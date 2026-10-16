const authService = require('../services/auth.service');
const passwordResetService = require('../services/password-reset.service');

async function signup(req, res, next) {
  try {
    const { email, password, fullName, userName, phoneNumber, termsAccepted } = req.body;
    const result = await authService.signup({
      email,
      password,
      fullName,
      userName,
      phoneNumber,
      termsAccepted,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function checkUsernameAvailability(req, res, next) {
  try {
    const userName = req.query.userName ?? req.query.username;
    const available = await authService.isUsernameAvailable(userName);

    res.status(200).json({ available });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await passwordResetService.requestPasswordReset(email);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = req.user.toJSON();
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login,
  checkUsernameAvailability,
  forgotPassword,
  getCurrentUser,
};
