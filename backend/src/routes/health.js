const express = require('express');
const { isMongoConnected } = require('../config/db');
const { isRedisConnected } = require('../config/redis');

const router = express.Router();

router.get('/health', async (req, res) => {
  const mongoOk = isMongoConnected();
  const redisOk = await isRedisConnected();
  const healthy = mongoOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    api: 'running',
    mongo: mongoOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
