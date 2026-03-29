const Notification = require("../models/Notification");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { successResponse } = require("../utils/response");
const { createNotification } = require("../services/notificationService");

async function getNotifications(req, res) {
  const query = req.user.role === "admin"
    ? { companyId: req.user.companyId }
    : { companyId: req.user.companyId, userId: req.user._id };

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);

  return successResponse(res, {
    message: "Notifications fetched successfully.",
    data: notifications
  });
}

async function createNotificationController(req, res) {
  const recipient = await User.findOne({ _id: req.body.userId, companyId: req.user.companyId });
  if (!recipient) {
    throw new ApiError(404, "Notification recipient not found.");
  }

  const notification = await createNotification({
    companyId: req.user.companyId,
    userId: recipient._id,
    title: req.body.title,
    sub: req.body.sub
  });

  return successResponse(res, {
    statusCode: 201,
    message: "Notification created successfully.",
    data: notification
  });
}

module.exports = {
  getNotifications,
  createNotification: createNotificationController
};
