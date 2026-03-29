const Workflow = require("../models/Workflow");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

async function getApplicableWorkflow({ companyId, amount }) {
  const workflows = await Workflow.find({ companyId }).sort({ threshold: -1, createdAt: 1 });
  return workflows.find((workflow) => amount >= (workflow.threshold || 0)) || null;
}

async function ensureWorkflowApprovers(workflow) {
  const approverIds = workflow.steps.map((step) => step.approverId).filter(Boolean);
  if (!approverIds.length) return;

  const count = await User.countDocuments({ _id: { $in: approverIds }, companyId: workflow.companyId });
  if (count !== approverIds.length) {
    throw new ApiError(400, "One or more workflow approvers are invalid for this company.");
  }
}

function canActOnExpense({ workflow, expense, user }) {
  if (!workflow || expense.status !== "pending") {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const currentStep = workflow.steps.find((step) => String(step._id) === String(expense.currentStep));
  return currentStep && String(currentStep.approverId) === String(user._id);
}

function determineNextWorkflowState({ workflow, expense, action, actorId }) {
  const currentStepIndex = workflow.steps.findIndex((step) => String(step._id) === String(expense.currentStep));

  if (action === "rejected") {
    return {
      status: "rejected",
      currentStep: null
    };
  }

  if (workflow.conditionType === "specific" && workflow.specificApproverId && String(workflow.specificApproverId) === String(actorId)) {
    return {
      status: "approved",
      currentStep: null
    };
  }

  const approvedCount = expense.approvals.filter((approval) => approval.status === "approved").length;
  const totalSteps = workflow.steps.length || 1;
  const approvalPercent = Math.round((approvedCount / totalSteps) * 100);

  if (
    (workflow.conditionType === "percentage" || workflow.conditionType === "hybrid") &&
    workflow.approvalPercentage &&
    approvalPercent >= workflow.approvalPercentage
  ) {
    return {
      status: "approved",
      currentStep: null
    };
  }

  const nextStep = workflow.steps[currentStepIndex + 1];

  if (nextStep) {
    return {
      status: "pending",
      currentStep: nextStep._id
    };
  }

  return {
    status: "approved",
    currentStep: null
  };
}

module.exports = {
  getApplicableWorkflow,
  ensureWorkflowApprovers,
  canActOnExpense,
  determineNextWorkflowState
};
