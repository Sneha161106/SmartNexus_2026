const Redis = require("ioredis");
const NodeCache = require("node-cache");
const logger = require("../config/logger");

const memoryCache = new NodeCache({ stdTTL: 60 * 60 });
let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  redisClient.on("error", (error) => {
    logger.warn(`Redis unavailable, falling back to memory cache: ${error.message}`);
  });

  redisClient.connect().catch((error) => {
    logger.warn(`Redis connection failed, using memory cache: ${error.message}`);
  });
}

async function get(key) {
  if (redisClient && redisClient.status === "ready") {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  return memoryCache.get(key) || null;
}

async function set(key, value, ttlSeconds = 3600) {
  if (redisClient && redisClient.status === "ready") {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return;
  }

  memoryCache.set(key, value, ttlSeconds);
}

module.exports = {
  get,
  set
};
