// Central place to read configuration from environment variables.
// Nothing here is hardcoded - every value has a safe local-dev default
// but can be overridden via .env (local) or docker-compose (containers).
require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow',

  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),

  queueName: process.env.QUEUE_NAME || 'taskflow-jobs',

  // Retry defaults, used when a job doesn't specify its own max attempts.
  defaultMaxAttempts: parseInt(process.env.DEFAULT_MAX_ATTEMPTS || '3', 10),
  backoffDelayMs: parseInt(process.env.BACKOFF_DELAY_MS || '1000', 10),
};
