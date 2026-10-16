const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('Health Check API (/health)', () => {
  it('should return 200 and report connected when database is online', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 503 and report disconnected when database is offline', async () => {
    // Temporarily disconnect
    await mongoose.disconnect();

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'ERROR');
    expect(res.body).toHaveProperty('database', 'disconnected');
    expect(res.body).toHaveProperty('timestamp');

    // Reconnect for remaining tests if uri exists
    if (global.__MONGO_URI__) {
      await mongoose.connect(global.__MONGO_URI__, { serverSelectionTimeoutMS: 3000 });
    }
  });
});
