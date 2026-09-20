const { createClient } = require("redis");
const crypto = require("crypto");

// Connects to the same Redis instance your auth service already uses.
// Put the same Redis_url value (from services/auth/.env) into gateway/.env
const redisClient = createClient({ url: process.env.Redis_url });
redisClient.on("error", (err) => console.error("[rate-limiter] redis error:", err));
redisClient
  .connect()
  .then(() => console.log("[rate-limiter] connected to redis"))
  .catch(console.error);

/**
 * Sliding Window Log algorithm:
 * - Every request's exact timestamp is stored in a Redis sorted set.
 * - On each new request: remove timestamps older than the window,
 *   count what's left. If count >= max, reject. Otherwise, record
 *   this request's timestamp and allow it.
 *
 * Same algorithm every time -- only windowMs/max/keyPrefix change per
 * call, so each service gets its own independent limit and its own
 * independent counters in Redis.
 */
function createRateLimiter({ windowMs, max, keyPrefix }) {
  return async function slidingWindowRateLimiter(req, res, next) {
    const key = `rl:${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      await redisClient.zRemRangeByScore(key, 0, windowStart);
      const count = await redisClient.zCard(key);

      if (count >= max) {
        return res.status(429).json({
          message: "Too many requests from this IP, please try again shortly.",
        });
      }

      const member = `${now}-${crypto.randomUUID()}`;
      await redisClient.zAdd(key, { score: now, value: member });
      await redisClient.expire(key, Math.ceil(windowMs / 1000));

      next();
    } catch (err) {
      console.error(`[rate-limit:${keyPrefix}] redis failure, allowing request:`, err);
      next(); // fail open, so a Redis hiccup doesn't take the whole gateway down
    }
  };
}

module.exports = createRateLimiter;