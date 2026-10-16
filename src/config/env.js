const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'test' ? 'test_jwt_secret_key_for_testing_purposes_only_32_chars' : '');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : '*';

function validateEnv() {
  const errors = [];

  if (NODE_ENV === 'production') {
    if (!MONGODB_URI) {
      errors.push('MONGODB_URI is required in production.');
    }
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be defined and at least 32 characters long in production.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration error:\n${errors.join('\n')}`);
  }
}

// Validate environment on import
validateEnv();

module.exports = {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  JWT_SECRET: JWT_SECRET || 'dev_fallback_jwt_secret_key_minimum_32_characters_long_12345',
  JWT_EXPIRES_IN,
  ALLOWED_ORIGINS,
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  isDevelopment: NODE_ENV === 'development',
};
