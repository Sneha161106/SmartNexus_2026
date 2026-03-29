const Notification = require("../models/Notification");
const emailService = require("./emailService");

async function createNotification({ companyId, userId, title, sub }) {
  return Notification.create({
    companyId,
    userId,
    title,
    sub
  });
}

async function notifyUser({ companyId, user, title, sub, sendEmail = false }) {
  const notification = await createNotification({
    companyId,
    userId: user._id,
    title,
    sub
  });

  if (sendEmail) {
    await emailService.sendMail({
      to: user.email,
      subject: title,
      text: `${title}\n\n${sub}`
    });
  }

  return notification;
}

module.exports = {
  createNotification,
  notifyUser
};
