const AuditLog = require("../models/AuditLog");
const { successResponse } = require("../utils/response");

async function getAuditLogs(req, res) {
  const logs = await AuditLog.find({ companyId: req.user.companyId })
    .populate("userId", "name email role")
    .populate("expenseId", "description amount currency status")
    .sort({ createdAt: -1 })
    .limit(200);

  return successResponse(res, {
    message: "Audit logs fetched successfully.",
    data: logs
  });
}

module.exports = {
  getAuditLogs
};
