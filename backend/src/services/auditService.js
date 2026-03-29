const AuditLog = require("../models/AuditLog");

async function createAuditLog({ companyId, userId = null, expenseId = null, action, details = "", metadata = {} }) {
  return AuditLog.create({
    companyId,
    userId,
    expenseId,
    action,
    details,
    metadata
  });
}

module.exports = {
  createAuditLog
};
