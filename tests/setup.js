const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let isSetupSuccessful = false;

beforeAll(async () => {
  try {
    // Use isolated in-memory MongoDB instance for testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    global.__MONGO_URI__ = uri;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isSetupSuccessful = true;
  } catch (error) {
    isSetupSuccessful = false;
    console.error('[Jest Setup] Failed to initialize in-memory database:', error.message);
    throw error;
  }
}, 30000);

afterEach(async () => {
  // If initial setup never succeeded, do not attempt to clear or reconnect
  if (!isSetupSuccessful) {
    return;
  }

  // If a test disconnected the database (e.g. testing offline health state), restore connection
  if (mongoose.connection.readyState === 0 && global.__MONGO_URI__) {
    try {
      await mongoose.connect(global.__MONGO_URI__, {
        serverSelectionTimeoutMS: 3000,
      });
    } catch (err) {
      // Reconnect failure logged without blocking teardown
      console.warn('[Jest afterEach] Failed to reconnect to in-memory database:', err.message);
    }
  }

  // Clear all data between tests to ensure test isolation
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    console.warn('[Jest afterAll] Disconnect warning:', err.message);
  }

  try {
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.warn('[Jest afterAll] MongoMemoryServer stop warning:', err.message);
  }
});
