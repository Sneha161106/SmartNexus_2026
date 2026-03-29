const express = require("express");
const { body, param } = require("express-validator");

const controller = require("../controllers/userController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/", asyncHandler(controller.getUsers));

router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["admin", "manager", "employee"]),
    body("department").optional().trim(),
    body("managerId").optional().isMongoId()
  ],
  validate,
  asyncHandler(controller.createUser)
);

router.put(
  "/:id",
  [
    param("id").isMongoId(),
    body("email").optional().isEmail(),
    body("password").optional().isLength({ min: 8 }),
    body("role").optional().isIn(["admin", "manager", "employee"]),
    body("managerId").optional({ nullable: true }).custom((value) => !value || /^[0-9a-fA-F]{24}$/.test(value))
  ],
  validate,
  asyncHandler(controller.updateUser)
);

router.delete("/:id", [param("id").isMongoId()], validate, asyncHandler(controller.deleteUser));

module.exports = router;
