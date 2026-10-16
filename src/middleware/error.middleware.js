const ApiError = require('../utils/api-error');
const env = require('../config/env');

// Centralized error handler
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(' ');
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const key = Object.keys(err.keyPattern || err.keyValue || {})[0];
    if (key === 'email') {
      message = 'This email is already in use.';
    } else if (key === 'userName' || key === 'userNameLower') {
      message = 'Username is already taken.';
    } else {
      message = 'A resource with that unique identifier already exists.';
    }
  }

  // Handle JWT syntax and expiration errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // In production, mask unexpected 500 errors
  if (statusCode === 500 && env.isProduction) {
    message = 'Internal server error.';
  }

  // Only log unexpected server errors, avoiding sensitive logs
  if (statusCode >= 500 && !env.isTest) {
    console.error(`[Error] Unhandled error: ${err.message}`);
  }

  res.status(statusCode).json({
    error: message,
    status: statusCode,
  });
}

// 404 handler for undefined routes
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
