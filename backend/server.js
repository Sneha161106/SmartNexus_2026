require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDatabase = require("./src/config/db");
const logger = require("./src/config/logger");

const port = process.env.PORT || 5001;

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);

  server.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
