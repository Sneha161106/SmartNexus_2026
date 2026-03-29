const path = require("path");
const multer = require("multer");

const { ensureUploadDir, getUploadDir } = require("../config/upload");
const ApiError = require("../utils/ApiError");

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureUploadDir());
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new ApiError(400, "Unsupported receipt file type."));
    }
    return cb(null, true);
  }
});

function buildReceiptPayload(file) {
  if (!file) return null;

  return {
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/${getUploadDir().replace(/\\/g, "/")}/${file.filename}`
  };
}

module.exports = {
  upload,
  buildReceiptPayload
};
