const nodemailer = require("nodemailer");
const logger = require("../config/logger");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const client = getTransporter();

  if (!client) {
    logger.info(`Email skipped for ${to}: transporter is not configured.`);
    return null;
  }

  return client.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendMail
};
