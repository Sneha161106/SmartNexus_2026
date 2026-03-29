const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  [
    body("companyName").trim().notEmpty(),
    body("country").trim().notEmpty(),
    body("currency").trim().isLength({ min: 3, max: 3 }),
    body("symbol").trim().notEmpty(),
    body("adminName").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("department").optional().trim()
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 8 })],
  validate,
  asyncHandler(authController.login)
);

router.get("/me", authenticate, asyncHandler(authController.me));

module.exports = router;
