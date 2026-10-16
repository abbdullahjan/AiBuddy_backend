const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest, // Disable rate limiting in test suite
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = {
  authLimiter,
};
