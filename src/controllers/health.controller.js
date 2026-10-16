const { isDBConnected } = require('../config/database');

function checkHealth(req, res) {
  const dbStatus = isDBConnected();

  if (dbStatus) {
    return res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'ERROR',
    database: 'disconnected',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  checkHealth,
};
