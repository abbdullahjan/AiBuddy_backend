const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./api-error');

function signToken(payload, options = {}) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Authentication token has expired.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }
}

module.exports = {
  signToken,
  verifyToken,
};
