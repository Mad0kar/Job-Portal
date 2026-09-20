const { createProxyMiddleware } = require("http-proxy-middleware");
const createRateLimiter = require("../middleware/rateLimiter");

// user: 100 requests per minute per IP (normal profile reads/updates)
const userRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  keyPrefix: "user",
});

const userProxy = createProxyMiddleware({
  target: "http://localhost:5003",
  changeOrigin: true,
});

module.exports = { userRateLimiter, userProxy };