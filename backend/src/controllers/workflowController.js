const Workflow = require("../models/Workflow");
const { successResponse } = require("../utils/response");
const { createAuditLog } = require("../services/auditService");
const { ensureWorkflowApprovers } = require("../services/workflowService");

async function createWorkflow(req, res) {
  const workflow = new Workflow({
    companyId: req.user.companyId,
    name: req.body.name,
    threshold: req.body.threshold || 0,
    conditionType: req.body.conditionType || "sequential",
    approvalPercentage: req.body.approvalPercentage || null,
    specificApproverId: req.body.specificApproverId || null,
    steps: req.body.steps || [],
    isDefault: Boolean(req.body.isDefault)
  });

  await ensureWorkflowApprovers(workflow);
  await workflow.save();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    action: "WORKFLOW_CREATED",
    details: `${req.user.email} created workflow ${workflow.name}`
  });

  return successResponse(res, {
    statusCode: 201,
    message: "Workflow created successfully.",
    data: workflow
  });
}

async function getWorkflows(req, res) {
  const workflows = await Workflow.find({ companyId: req.user.companyId })
    .populate("steps.approverId", "name email role department avatar")
    .populate("specificApproverId", "name email role department avatar")
    .sort({ threshold: 1, createdAt: 1 });

  return successResponse(res, {
    message: "Workflows fetched successfully.",
    data: workflows
  });
}

module.exports = {
  createWorkflow,
  getWorkflows
};
