const { createProxyMiddleware } = require("http-proxy-middleware");
const createRateLimiter = require("../middleware/rateLimiter");

// payment: 10 requests per minute per IP (sensitive, low-frequency for real users)
const paymentRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  keyPrefix: "payment",
});

const paymentProxy = createProxyMiddleware({
  target: "http://localhost:5005",
  changeOrigin: true,
});

module.exports = { paymentRateLimiter, paymentProxy };