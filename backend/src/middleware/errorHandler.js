const logger = require("../config/logger");

module.exports = function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    errors: err.details || null
  });
};
