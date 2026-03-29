const express = require("express");
const { body, param } = require("express-validator");

const controller = require("../controllers/expenseController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.getExpenses));
router.get("/:id", [param("id").isMongoId()], validate, asyncHandler(controller.getExpenseById));

router.post(
  "/",
  upload.single("receipt"),
  [
    body("amount").isFloat({ min: 0.01 }),
    body("currency").trim().isLength({ min: 3, max: 3 }),
    body("category").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("date").isISO8601()
  ],
  validate,
  asyncHandler(controller.createExpense)
);

router.put(
  "/:id",
  upload.single("receipt"),
  [
    param("id").isMongoId(),
    body("amount").optional().isFloat({ min: 0.01 }),
    body("currency").optional().trim().isLength({ min: 3, max: 3 }),
    body("category").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("date").optional().isISO8601()
  ],
  validate,
  asyncHandler(controller.updateExpense)
);

router.delete("/:id", [param("id").isMongoId()], validate, asyncHandler(controller.deleteExpense));

router.post(
  "/:id/approve",
  [param("id").isMongoId(), body("comment").optional().trim()],
  validate,
  asyncHandler(controller.approveExpense)
);

router.post(
  "/:id/reject",
  [param("id").isMongoId(), body("comment").trim().notEmpty()],
  validate,
  asyncHandler(controller.rejectExpense)
);

module.exports = router;
