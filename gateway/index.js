const express = require("express");

const cacheMiddleware = require("./middleware/cache");

const { authRateLimiter, authProxy } = require("./routes/authRoute");
const { jobRateLimiter, jobProxy } = require("./routes/jobRoute");
const { paymentRateLimiter, paymentProxy } = require("./routes/paymentRoute");
const { userRateLimiter, userProxy } = require("./routes/userRoute");
const { utilsRateLimiter, utilsProxy } = require("./routes/utilsRoute");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "gateway is up" });
});

// Cache runs first (shared, applies to every service) -- it already skips
// anything that isn't a safe-to-cache GET request on its own.
app.use(cacheMiddleware);

// Each service: its own rate limiter, then its own proxy.
app.use("/api/auth", authRateLimiter, authProxy);
app.use("/api/job", jobRateLimiter, jobProxy);
app.use("/api/payment", paymentRateLimiter, paymentProxy);
app.use("/api/user", userRateLimiter, userProxy);
app.use("/api/utils", utilsRateLimiter, utilsProxy);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});