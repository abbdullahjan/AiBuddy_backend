const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: env.ALLOWED_ORIGINS === '*' ? '*' : env.ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: '10kb' }));

// Health check endpoint
app.use('/health', healthRoutes);

// Authentication routes
app.use('/auth', authRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
