const ApiError = require('../utils/api-error');

// Standard RFC-compliant email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Username: 3-30 characters, alphanumeric, underscores, hyphens, periods
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

function validateSignup(req, res, next) {
  const { email, password, fullName, userName, phoneNumber, termsAccepted } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(ApiError.badRequest('Invalid email address.'));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(ApiError.badRequest('Password should be at least six characters.'));
  }

  if (fullName !== undefined && fullName !== null) {
    if (typeof fullName !== 'string' || fullName.trim().length > 100) {
      return next(ApiError.badRequest('Full name must be a string up to 100 characters.'));
    }
  }

  if (userName !== undefined && userName !== null && userName !== '') {
    if (typeof userName !== 'string' || !USERNAME_REGEX.test(userName.trim())) {
      return next(
        ApiError.badRequest(
          'Username must be between 3 and 30 characters and contain only letters, numbers, underscores, hyphens, or periods.'
        )
      );
    }
  }

  if (phoneNumber !== undefined && phoneNumber !== null) {
    if (typeof phoneNumber !== 'string' || phoneNumber.length > 25) {
      return next(ApiError.badRequest('Invalid phone number format.'));
    }
  }

  if (termsAccepted !== undefined && typeof termsAccepted !== 'boolean') {
    return next(ApiError.badRequest('termsAccepted must be a boolean.'));
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(ApiError.badRequest('Invalid email address.'));
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return next(ApiError.badRequest('Password is required.'));
  }

  next();
}

function validateForgotPassword(req, res, next) {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(ApiError.badRequest('Invalid email address.'));
  }

  next();
}

function validateUsernameAvailability(req, res, next) {
  const userName = req.query.userName ?? req.query.username;

  if (userName === undefined) {
    return next(ApiError.badRequest('Username query parameter is required.'));
  }

  next();
}

module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateUsernameAvailability,
};
