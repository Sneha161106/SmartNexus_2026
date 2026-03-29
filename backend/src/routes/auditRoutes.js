const express = require("express");

const controller = require("../controllers/auditController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, authorize("admin", "manager"), asyncHandler(controller.getAuditLogs));

module.exports = router;
