const mongoose = require('mongoose');
const env = require('./env');

let isConnecting = false;

async function connectDB(uri = null) {
  const connectionUri = uri || env.MONGODB_URI;

  if (!connectionUri) {
    throw new Error('MongoDB connection URI is not configured.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    if (!env.isTest) {
      console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    }

    return conn;
  } catch (error) {
    if (!env.isTest) {
      console.error(`[Database] MongoDB connection failed: ${error.message}`);
    }
    throw error;
  } finally {
    isConnecting = false;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    if (!env.isTest) {
      console.log('[Database] MongoDB disconnected cleanly.');
    }
  }
}

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
};
