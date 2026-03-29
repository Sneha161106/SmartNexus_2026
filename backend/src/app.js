const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const logger = require("./config/logger");
const swaggerSpec = require("./config/swagger");
const { ensureUploadDir } = require("./config/upload");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

ensureUploadDir();

const isDevelopment = process.env.NODE_ENV !== "production";
const corsOptions = isDevelopment
  ? { origin: true }
  : {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
        : false
    };

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later."
    }
  })
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
