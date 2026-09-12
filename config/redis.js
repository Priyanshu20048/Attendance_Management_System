const REDIS_URL = process.env.REDIS_URL || "";
const REDIS_ENABLED = (process.env.REDIS_ENABLED || "true").toString().toLowerCase() !== "false" && REDIS_URL.trim() !== "";

if (!REDIS_ENABLED) {
  console.log("⚠ Redis disabled via REDIS_ENABLED=false or no REDIS_URL; running without cache");
  module.exports = {
    get: async () => null,
    setEx: async () => {},
    del: async () => {},
  };
} else {
  const { createClient } = require("redis");

  const redisClient = createClient({
    url: REDIS_URL || "redis://127.0.0.1:6379",
  });

  let redisConnected = false;

  redisClient.on("connect", () => {
    console.log("✓ Redis connected");
    redisConnected = true;
  });

  redisClient.on("error", (err) => {
    console.warn("⚠ Redis connection failed - running without cache");
    redisConnected = false;
  });

  redisClient.connect().catch((err) => {
    console.warn("⚠ Redis unavailable - app will run without caching");
  });

  // Override methods to handle disconnections gracefully
  const originalGet = redisClient.get.bind(redisClient);
  const originalSetEx = redisClient.setEx.bind(redisClient);
  const originalDel = redisClient.del.bind(redisClient);

  redisClient.get = async (key) => {
    try {
      if (redisConnected) return await originalGet(key);
    } catch (err) {
      console.warn("Redis get error:", err.message);
    }
    return null;
  };

  redisClient.setEx = async (key, ttl, value) => {
    try {
      if (redisConnected) return await originalSetEx(key, ttl, value);
    } catch (err) {
      console.warn("Redis setEx error:", err.message);
    }
  };

  redisClient.del = async (key) => {
    try {
      if (redisConnected) return await originalDel(key);
    } catch (err) {
      console.warn("Redis del error:", err.message);
    }
  };

  module.exports = redisClient;
}
