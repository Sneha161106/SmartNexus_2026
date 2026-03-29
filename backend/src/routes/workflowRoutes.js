const express = require("express");
const { body } = require("express-validator");

const controller = require("../controllers/workflowController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.getWorkflows));

router.post(
  "/",
  authorize("admin"),
  [
    body("name").trim().notEmpty(),
    body("threshold").optional().isFloat({ min: 0 }),
    body("conditionType").optional().isIn(["sequential", "percentage", "specific", "hybrid"]),
    body("approvalPercentage").optional({ nullable: true }).isInt({ min: 1, max: 100 }),
    body("specificApproverId").optional({ nullable: true }).isMongoId(),
    body("steps").isArray({ min: 1 }),
    body("steps.*.label").trim().notEmpty(),
    body("steps.*.approverId").isMongoId()
  ],
  validate,
  asyncHandler(controller.createWorkflow)
);

module.exports = router;
