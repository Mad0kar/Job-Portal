const { createClient } = require("redis");

// Same Redis instance as the rate limiter -- different key prefix ("cache:")
// so cached responses never collide with rate-limit counters or the
// auth service's password-reset tokens.
const redisClient = createClient({ url: process.env.Redis_url });
redisClient.on("error", (err) => console.error("[cache] redis error:", err));
redisClient
  .connect()
  .then(() => console.log("[cache] connected to redis"))
  .catch(console.error);

const DEFAULT_TTL_SECONDS = 30;

/**
 * Shared response cache -- safe by design:
 * - Only caches GET requests (no side effects).
 * - Skips ANY request carrying an Authorization header, so protected
 *   routes (isAuth) never get cached -- caching them would let a second
 *   request skip the service's auth check entirely and get served
 *   straight from Redis.
 * - Key = the exact URL requested (path + query string).
 */
function cacheMiddleware(req, res, next) {
  if (req.method !== "GET" || req.headers.authorization) {
    return next();
  }

  const key = `cache:${req.originalUrl}`;

  redisClient
    .get(key)
    .then((cached) => {
      if (cached) {
        console.log(`[cache] HIT ${req.originalUrl}`);
        return res.status(200).json(JSON.parse(cached));
      }

      console.log(`[cache] MISS ${req.originalUrl}`);

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redisClient
          .set(key, JSON.stringify(body), { EX: DEFAULT_TTL_SECONDS })
          .catch((err) => console.error("[cache] failed to store:", err));
        return originalJson(body);
      };

      next();
    })
    .catch((err) => {
      console.error("[cache] redis failure, skipping cache:", err);
      next();
    });
}

module.exports = cacheMiddleware;