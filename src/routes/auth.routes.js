const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateUsernameAvailability,
} = require('../validators/auth.validators');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Public auth endpoints
router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get(
  '/username-available',
  validateUsernameAvailability,
  authController.checkUsernameAvailability
);
router.post(
  '/forgot-password',
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword
);

// Authenticated auth endpoints
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
