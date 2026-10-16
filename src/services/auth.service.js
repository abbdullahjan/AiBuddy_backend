const User = require('../models/User');
const ApiError = require('../utils/api-error');
const { signToken } = require('../utils/jwt');

async function signup({ email, password, fullName, userName, phoneNumber, termsAccepted }) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = userName && typeof userName === 'string' && userName.trim().length > 0 ? userName.trim() : null;

  // Check email uniqueness
  const existingEmailUser = await User.findOne({ email: normalizedEmail });
  if (existingEmailUser) {
    throw ApiError.conflict('This email is already in use.');
  }

  // Check username uniqueness if provided
  if (trimmedUsername) {
    const existingUsernameUser = await User.findOne({
      userNameLower: trimmedUsername.toLowerCase(),
    });
    if (existingUsernameUser) {
      throw ApiError.conflict('Username is already taken.');
    }
  }

  // Hash password
  const passwordHash = await User.hashPassword(password);

  try {
    const newUser = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: fullName && typeof fullName === 'string' ? fullName.trim() : null,
      userName: trimmedUsername,
      phoneNumber: phoneNumber && typeof phoneNumber === 'string' ? phoneNumber.trim() : null,
      termsAccepted: Boolean(termsAccepted),
    });

    const userJson = newUser.toJSON();
    const token = signToken({
      sub: userJson.id,
      email: userJson.email,
    });

    return {
      user: userJson,
      token,
    };
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      if (field === 'email') {
        throw ApiError.conflict('This email is already in use.');
      }
      if (field === 'userName' || field === 'userNameLower') {
        throw ApiError.conflict('Username is already taken.');
      }
      throw ApiError.conflict('A unique constraint violation occurred.');
    }
    throw error;
  }
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user and explicitly select passwordHash
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid credentials.');
  }

  const userJson = user.toJSON();
  const token = signToken({
    sub: userJson.id,
    email: userJson.email,
  });

  return {
    user: userJson,
    token,
  };
}

async function isUsernameAvailable(userName) {
  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    return true;
  }

  const normalized = userName.trim().toLowerCase();
  const existingUser = await User.findOne({ userNameLower: normalized });
  return !existingUser;
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('User not found or session expired.');
  }
  return user.toJSON();
}

module.exports = {
  signup,
  login,
  isUsernameAvailable,
  getCurrentUser,
};
