const { createProxyMiddleware } = require("http-proxy-middleware");
const createRateLimiter = require("../middleware/rateLimiter");

// auth: 20 requests per minute per IP
const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "auth",
});

const authProxy = createProxyMiddleware({
  target: "http://localhost:5001",
  changeOrigin: true,
});

module.exports = { authRateLimiter, authProxy };