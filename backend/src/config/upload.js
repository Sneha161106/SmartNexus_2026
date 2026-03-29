const fs = require("fs");
const path = require("path");

function getUploadDir() {
  return process.env.UPLOAD_DIR || "uploads/receipts";
}

function ensureUploadDir() {
  const fullPath = path.resolve(process.cwd(), getUploadDir());
  fs.mkdirSync(fullPath, { recursive: true });
  return fullPath;
}

module.exports = {
  getUploadDir,
  ensureUploadDir
};
