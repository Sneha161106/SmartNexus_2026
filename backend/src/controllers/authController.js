const bcrypt = require("bcryptjs");

const Company = require("../models/Company");
const User = require("../models/User");
const { buildAvatar } = require("../utils/avatar");
const { successResponse } = require("../utils/response");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../services/tokenService");
const { createAuditLog } = require("../services/auditService");

async function register(req, res) {
  const { companyName, country, currency, symbol, adminName, email, password, department } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const company = await Company.create({
    name: companyName,
    country,
    currency,
    symbol
  });

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await User.create({
    companyId: company._id,
    name: adminName,
    email,
    password: hashedPassword,
    role: "admin",
    department,
    avatar: buildAvatar(adminName)
  });

  const token = generateToken(admin);

  await createAuditLog({
    companyId: company._id,
    userId: admin._id,
    action: "AUTH_REGISTER",
    details: `Company ${company.name} registered with admin ${admin.email}`
  });

  return successResponse(res, {
    statusCode: 201,
    message: "Company and admin account created successfully.",
    data: {
      token,
      company,
      user: sanitizeUser(admin)
    }
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const company = await Company.findById(user.companyId);
  const token = generateToken(user);

  await createAuditLog({
    companyId: user.companyId,
    userId: user._id,
    action: "AUTH_LOGIN",
    details: `${user.email} logged in`
  });

  return successResponse(res, {
    message: "Login successful.",
    data: {
      token,
      company,
      user: sanitizeUser(user)
    }
  });
}

function me(req, res) {
  return successResponse(res, {
    message: "Authenticated user fetched successfully.",
    data: {
      user: sanitizeUser(req.user)
    }
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    managerId: user.managerId,
    avatar: user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  register,
  login,
  me,
  sanitizeUser
};
