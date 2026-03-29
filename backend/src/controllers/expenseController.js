const Expense = require("../models/Expense");
const Workflow = require("../models/Workflow");
const User = require("../models/User");
const Company = require("../models/Company");
const ApiError = require("../utils/ApiError");
const { successResponse } = require("../utils/response");
const { buildReceiptPayload } = require("../middleware/upload");
const { createAuditLog } = require("../services/auditService");
const { notifyUser } = require("../services/notificationService");
const { convertAmount } = require("../services/currencyService");
const { processReceipt } = require("../services/ocrService");
const {
  getApplicableWorkflow,
  canActOnExpense,
  determineNextWorkflowState
} = require("../services/workflowService");

function buildExpenseQuery(user) {
  if (user.role === "admin") {
    return { companyId: user.companyId };
  }

  if (user.role === "manager") {
    return {
      companyId: user.companyId,
      $or: [{ submittedBy: user._id }]
    };
  }

  return {
    companyId: user.companyId,
    submittedBy: user._id
  };
}

async function getExpenses(req, res) {
  const query = buildExpenseQuery(req.user);

  if (req.user.role === "manager") {
    const teamMembers = await User.find({ companyId: req.user.companyId, managerId: req.user._id }).select("_id");
    query.$or.push({ submittedBy: { $in: teamMembers.map((member) => member._id) } });
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const expenses = await Expense.find(query)
    .populate("submittedBy", "name email role department avatar managerId")
    .populate("workflowId")
    .populate("approvals.approverId", "name email role avatar")
    .sort({ createdAt: -1 });

  return successResponse(res, {
    message: "Expenses fetched successfully.",
    data: expenses
  });
}

async function getExpenseById(req, res) {
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId })
    .populate("submittedBy", "name email role department avatar managerId")
    .populate("workflowId")
    .populate("approvals.approverId", "name email role avatar");

  if (!expense) {
    throw new ApiError(404, "Expense not found.");
  }

  const canView =
    req.user.role === "admin" ||
    String(expense.submittedBy._id) === String(req.user._id) ||
    (req.user.role === "manager" && String(expense.submittedBy.managerId) === String(req.user._id));

  if (!canView) {
    throw new ApiError(403, "You do not have permission to view this expense.");
  }

  return successResponse(res, {
    message: "Expense fetched successfully.",
    data: expense
  });
}

async function createExpense(req, res) {
  const company = await Company.findById(req.user.companyId);
  const workflow = await getApplicableWorkflow({
    companyId: req.user.companyId,
    amount: Number(req.body.amount)
  });

  const convertedAmount = await convertAmount({
    amount: Number(req.body.amount),
    fromCurrency: req.body.currency,
    toCurrency: company.currency
  });

  const receipt = buildReceiptPayload(req.file);
  const ocrData = await processReceipt(req.file);

  const expense = await Expense.create({
    companyId: req.user.companyId,
    submittedBy: req.user._id,
    category: req.body.category,
    description: req.body.description,
    amount: Number(req.body.amount),
    currency: req.body.currency,
    convertedAmount,
    companyCurrency: company.currency,
    date: req.body.date,
    workflowId: workflow?._id || null,
    currentStep: workflow?.steps?.[0]?._id || null,
    receipt,
    ocrData
  });

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    expenseId: expense._id,
    action: "EXPENSE_SUBMITTED",
    details: `${req.user.email} submitted expense ${expense.description}`
  });

  if (workflow?.steps?.[0]) {
    const approver = await User.findById(workflow.steps[0].approverId);
    if (approver) {
      await notifyUser({
        companyId: req.user.companyId,
        user: approver,
        title: "New expense pending your review",
        sub: `${req.user.name} submitted ${expense.currency} ${expense.amount} for ${expense.category}`
      });
    }
  }

  const populated = await Expense.findById(expense._id)
    .populate("submittedBy", "name email role department avatar managerId")
    .populate("workflowId")
    .populate("approvals.approverId", "name email role avatar");

  return successResponse(res, {
    statusCode: 201,
    message: "Expense submitted successfully.",
    data: populated
  });
}

async function updateExpense(req, res) {
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!expense) {
    throw new ApiError(404, "Expense not found.");
  }

  const isOwner = String(expense.submittedBy) === String(req.user._id);
  if (!(req.user.role === "admin" || isOwner)) {
    throw new ApiError(403, "You do not have permission to update this expense.");
  }

  if (expense.status !== "pending") {
    throw new ApiError(400, "Only pending expenses can be updated.");
  }

  const company = await Company.findById(req.user.companyId);
  const convertedAmount = await convertAmount({
    amount: Number(req.body.amount || expense.amount),
    fromCurrency: req.body.currency || expense.currency,
    toCurrency: company.currency
  });

  Object.assign(expense, {
    amount: req.body.amount !== undefined ? Number(req.body.amount) : expense.amount,
    currency: req.body.currency || expense.currency,
    category: req.body.category || expense.category,
    description: req.body.description || expense.description,
    date: req.body.date || expense.date,
    convertedAmount,
    companyCurrency: company.currency
  });

  if (req.file) {
    expense.receipt = buildReceiptPayload(req.file);
    expense.ocrData = await processReceipt(req.file);
  }

  await expense.save();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    expenseId: expense._id,
    action: "EXPENSE_UPDATED",
    details: `${req.user.email} updated expense ${expense.description}`
  });

  return successResponse(res, {
    message: "Expense updated successfully.",
    data: expense
  });
}

async function deleteExpense(req, res) {
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!expense) {
    throw new ApiError(404, "Expense not found.");
  }

  const isOwner = String(expense.submittedBy) === String(req.user._id);
  if (!(req.user.role === "admin" || isOwner)) {
    throw new ApiError(403, "You do not have permission to delete this expense.");
  }

  await expense.deleteOne();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    expenseId: expense._id,
    action: "EXPENSE_DELETED",
    details: `${req.user.email} deleted expense ${expense.description}`
  });

  return successResponse(res, {
    message: "Expense deleted successfully.",
    data: { id: req.params.id }
  });
}

async function approveExpense(req, res) {
  return handleExpenseDecision(req, res, "approved");
}

async function rejectExpense(req, res) {
  if (!req.body.comment) {
    throw new ApiError(400, "A rejection comment is required.");
  }

  return handleExpenseDecision(req, res, "rejected");
}

async function handleExpenseDecision(req, res, action) {
  const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!expense) {
    throw new ApiError(404, "Expense not found.");
  }

  const workflow = expense.workflowId
    ? await Workflow.findOne({ _id: expense.workflowId, companyId: req.user.companyId })
    : null;

  if (!workflow) {
    throw new ApiError(400, "This expense is not attached to a valid workflow.");
  }

  if (!canActOnExpense({ workflow, expense, user: req.user })) {
    throw new ApiError(403, "You are not allowed to act on this expense.");
  }

  expense.approvals.push({
    stepId: expense.currentStep,
    approverId: req.user._id,
    status: action,
    comment: req.body.comment || ""
  });

  const nextState = determineNextWorkflowState({
    workflow,
    expense,
    action,
    actorId: req.user._id
  });

  expense.status = nextState.status;
  expense.currentStep = nextState.currentStep;
  await expense.save();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    expenseId: expense._id,
    action: action === "approved" ? "EXPENSE_APPROVED" : "EXPENSE_REJECTED",
    details: `${req.user.email} ${action} expense ${expense.description}`,
    metadata: { comment: req.body.comment || "" }
  });

  const submitter = await User.findById(expense.submittedBy);
  if (submitter) {
    const title = action === "approved" ? "Expense update" : "Expense rejected";
    const sub =
      action === "approved" && expense.status === "approved"
        ? `Your expense "${expense.description}" has been fully approved.`
        : action === "approved"
        ? `Your expense "${expense.description}" moved to the next approval step.`
        : `Your expense "${expense.description}" was rejected by ${req.user.name}.`;

    await notifyUser({
      companyId: req.user.companyId,
      user: submitter,
      title,
      sub
    });
  }

  if (expense.status === "pending" && expense.currentStep) {
    const nextStep = workflow.steps.find((step) => String(step._id) === String(expense.currentStep));
    if (nextStep) {
      const nextApprover = await User.findById(nextStep.approverId);
      if (nextApprover) {
        await notifyUser({
          companyId: req.user.companyId,
          user: nextApprover,
          title: "Expense awaiting your approval",
          sub: `A new workflow step is ready for "${expense.description}".`
        });
      }
    }
  }

  const populated = await Expense.findById(expense._id)
    .populate("submittedBy", "name email role department avatar managerId")
    .populate("workflowId")
    .populate("approvals.approverId", "name email role avatar");

  return successResponse(res, {
    message: `Expense ${action} successfully.`,
    data: populated
  });
}

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense
};
