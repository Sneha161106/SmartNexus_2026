const express = require("express");
const { body } = require("express-validator");

const controller = require("../controllers/notificationController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.getNotifications));

router.post(
  "/",
  authorize("admin", "manager"),
  [body("userId").isMongoId(), body("title").trim().notEmpty(), body("sub").optional().trim()],
  validate,
  asyncHandler(controller.createNotification)
);

module.exports = router;
