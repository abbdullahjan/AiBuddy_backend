const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

let server;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start Express server
    server = app.listen(env.PORT, () => {
      console.log(`[Server] Reusable Authentication Backend is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
