const User = require('../models/User');
const env = require('../config/env');

/**
 * Handles password reset requests.
 * Note: Currently no external email provider is configured.
 * We return a safe, generic message to prevent account enumeration.
 */
async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists in the database
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // In production or when an email provider (e.g. SendGrid, SES, Resend) is configured,
    // generate a cryptographic token, store its hash with an expiration in the database,
    // and dispatch the email.
    if (!env.isProduction && !env.isTest) {
      console.log(`[PasswordReset] Password reset requested for registered email: ${normalizedEmail} (Email provider not configured)`);
    }
  } else {
    if (!env.isProduction && !env.isTest) {
      console.log(`[PasswordReset] Password reset requested for non-existent email: ${normalizedEmail}`);
    }
  }

  // Safe generic response that never exposes whether the email exists
  return {
    success: true,
    message: 'If an account exists with this email address, password reset instructions will be sent.',
  };
}

module.exports = {
  requestPasswordReset,
};
