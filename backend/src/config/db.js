const mongoose = require("mongoose");
const logger = require("./logger");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  logger.info("Connected to MongoDB");
}

module.exports = connectDatabase;
