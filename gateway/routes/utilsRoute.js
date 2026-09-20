const { createProxyMiddleware } = require("http-proxy-middleware");
const createRateLimiter = require("../middleware/rateLimiter");

// utils: 15 requests per minute per IP (Gemini AI calls + file uploads are costly)
const utilsRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 15,
  keyPrefix: "utils",
});

const utilsProxy = createProxyMiddleware({
  target: "http://localhost:5002",
  changeOrigin: true,
});

module.exports = { utilsRateLimiter, utilsProxy };