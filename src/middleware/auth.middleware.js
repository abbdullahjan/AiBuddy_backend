const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/api-error');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing.');
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.sub) {
      throw ApiError.unauthorized('Invalid token payload.');
    }

    // Always verify the user still exists in the database
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
};
