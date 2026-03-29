const bcrypt = require("bcryptjs");

const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { successResponse } = require("../utils/response");
const { buildAvatar } = require("../utils/avatar");
const { createAuditLog } = require("../services/auditService");
const { sanitizeUser } = require("./authController");

async function getUsers(req, res) {
  const users = await User.find({ companyId: req.user.companyId }).sort({ createdAt: 1 });

  return successResponse(res, {
    message: "Users fetched successfully.",
    data: users.map(sanitizeUser)
  });
}

async function createUser(req, res) {
  const { name, email, password, role, department, managerId } = req.body;

  const existing = await User.findOne({ companyId: req.user.companyId, email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    companyId: req.user.companyId,
    name,
    email,
    password: hashedPassword,
    role,
    department,
    managerId: managerId || null,
    avatar: buildAvatar(name)
  });

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    action: "USER_CREATED",
    details: `${req.user.email} created user ${user.email}`
  });

  return successResponse(res, {
    statusCode: 201,
    message: "User created successfully.",
    data: sanitizeUser(user)
  });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const target = await User.findOne({ _id: id, companyId: req.user.companyId });

  if (!target) {
    throw new ApiError(404, "User not found.");
  }

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
  }

  if (req.body.name) {
    req.body.avatar = buildAvatar(req.body.name);
  }

  Object.assign(target, {
    name: req.body.name ?? target.name,
    email: req.body.email ? req.body.email.toLowerCase() : target.email,
    password: req.body.password ?? target.password,
    role: req.body.role ?? target.role,
    department: req.body.department ?? target.department,
    managerId: req.body.managerId !== undefined ? req.body.managerId || null : target.managerId,
    avatar: req.body.avatar ?? target.avatar,
    isActive: req.body.isActive ?? target.isActive
  });

  await target.save();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    action: "USER_UPDATED",
    details: `${req.user.email} updated user ${target.email}`
  });

  return successResponse(res, {
    message: "User updated successfully.",
    data: sanitizeUser(target)
  });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const target = await User.findOne({ _id: id, companyId: req.user.companyId });

  if (!target) {
    throw new ApiError(404, "User not found.");
  }

  if (String(target._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  await target.deleteOne();

  await createAuditLog({
    companyId: req.user.companyId,
    userId: req.user._id,
    action: "USER_DELETED",
    details: `${req.user.email} deleted user ${target.email}`
  });

  return successResponse(res, {
    message: "User deleted successfully.",
    data: { id }
  });
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
