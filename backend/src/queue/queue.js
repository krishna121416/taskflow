const { Queue } = require('bullmq');
const { queueName, defaultMaxAttempts, backoffDelayMs } = require('../config/env');
const { connectionOptions } = require('../config/redis');

// The single BullMQ queue TaskFlow uses. All job "types" (send-email,
// process-data, fail-twice, always-fail) share this one queue and are
// distinguished by the BullMQ job `name` - a worker's Processor function
// looks at job.name to decide which handler to run.
const taskQueue = new Queue(queueName, { connection: connectionOptions });

/**
 * Add a job to BullMQ. `mongoJobId` is stashed in the job data so a worker
 * can update the corresponding MongoDB document without a separate lookup.
 */
async function enqueueJob({ type, payload, mongoJobId, maxAttempts }) {
  const attempts = maxAttempts || defaultMaxAttempts;

  const bullJob = await taskQueue.add(
    type,
    { mongoJobId, payload },
    {
      attempts,
      backoff: {
        type: 'exponential',
        delay: backoffDelayMs,
      },
      // Once a job reaches a terminal state we don't need BullMQ to keep
      // it around forever - MongoDB is the durable record of history.
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 24 * 3600 },
    }
  );

  return bullJob;
}

module.exports = { taskQueue, enqueueJob };
