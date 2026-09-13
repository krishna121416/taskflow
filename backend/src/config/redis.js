const IORedis = require('ioredis');
const { redisHost, redisPort } = require('./env');

// BullMQ requires maxRetriesPerRequest: null on any connection used by a
// Worker/QueueEvents (they issue blocking Redis commands that must not time
// out via ioredis's own retry logic). We use the same options everywhere -
// BullMQ opens its own underlying connection(s) per Queue/Worker instance,
// it does not require a single shared client.
const connectionOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
};

// A plain client, only used for simple things like the /api/health ping.
const redisClient = new IORedis(connectionOptions);
redisClient.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

async function isRedisConnected() {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (err) {
    return false;
  }
}

module.exports = { connectionOptions, redisClient, isRedisConnected };
