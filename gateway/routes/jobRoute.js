const { createProxyMiddleware } = require("http-proxy-middleware");
const createRateLimiter = require("../middleware/rateLimiter");

// job: 200 requests per minute per IP (users browse/search a lot)
const jobRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 200,
  keyPrefix: "job",
});

const jobProxy = createProxyMiddleware({
  target: "http://localhost:5004",
  changeOrigin: true,
});

module.exports = { jobRateLimiter, jobProxy };