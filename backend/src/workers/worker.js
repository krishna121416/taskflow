const os = require('os');
const { Worker } = require('bullmq');
const { connectMongo } = require('../config/db');
const { connectionOptions } = require('../config/redis');
const { queueName } = require('../config/env');
const { handlers } = require('./handlers');
const {
  nextAttemptNumber,
  startAttempt,
  completeAttempt,
  failAttempt,
} = require('../services/jobExecutionService');

const WORKER_PID = process.pid;
// Inside a Docker container, process.pid is almost always 1 (each
// container is its own PID namespace) - so PID alone can't tell two
// worker containers apart. os.hostname() is the container id/hostname,
// which IS unique per container, so combining the two identifies a
// worker process in both plain-Node and Docker deployments. WORKER_ID
// (set per service in docker-compose.yml) gives an even more readable
// label than a raw container hostname.
const WORKER_HOST = process.env.WORKER_ID || os.hostname();
const WORKER_LABEL = `${WORKER_HOST}:${WORKER_PID}`;

/**
 * The BullMQ processor function. BullMQ guarantees only one active Worker
 * process is running this function for a given job at any moment (see the
 * README section "How job claiming works" for the Redis mechanism behind
 * that guarantee, and its limits around crashes/stalled jobs).
 */
async function processJob(job) {
  const { mongoJobId, payload } = job.data;
  const maxAttempts = job.opts.attempts;

  const attemptNumber = await nextAttemptNumber(mongoJobId);
  const attempt = await startAttempt({
    jobId: mongoJobId,
    bullJobId: job.id,
    attemptNumber,
    workerPid: WORKER_PID,
    workerHost: WORKER_HOST,
  });

  console.log(`[Worker ${WORKER_LABEL}] Processing job ${mongoJobId} (${job.name}, attempt ${attemptNumber}/${maxAttempts})`);

  const handler = handlers[job.name];
  if (!handler) {
    const err = new Error(`No handler registered for job type "${job.name}"`);
    await failAttempt({ attempt, jobId: mongoJobId, attemptNumber, maxAttempts, error: err });
    throw err;
  }

  try {
    const result = await handler(payload, { attemptNumber, maxAttempts });
    await completeAttempt({ attempt, jobId: mongoJobId, attemptNumber });
    console.log(`[Worker ${WORKER_LABEL}] Completed job ${mongoJobId} (attempt ${attemptNumber})`);
    return result;
  } catch (err) {
    const { isFinalAttempt } = await failAttempt({
      attempt,
      jobId: mongoJobId,
      attemptNumber,
      maxAttempts,
      error: err,
    });
    console.log(
      `[Worker ${WORKER_LABEL}] Failed job ${mongoJobId} (attempt ${attemptNumber}/${maxAttempts}) - ${
        isFinalAttempt ? 'DEAD, no more retries' : 'will retry with backoff'
      }: ${err.message}`
    );
    // Re-throw so BullMQ's own retry/backoff/dead-letter logic runs.
    // TaskFlow never implements its own retry loop.
    throw err;
  }
}

async function start() {
  await connectMongo();

  const worker = new Worker(queueName, processJob, {
    connection: connectionOptions,
    concurrency: 5,
    // How long a worker can hold a job's lock without renewing it before
    // BullMQ considers it stalled (default 30000ms). Renewed automatically
    // in the background while a job is actively processing; only matters
    // if the worker process dies/freezes mid-job. Configurable purely so
    // the crash-recovery demo in the README doesn't require a 30s wait.
    lockDuration: parseInt(process.env.LOCK_DURATION_MS || '30000', 10),
    // How often BullMQ scans for stalled jobs (default 30000ms).
    stalledInterval: parseInt(process.env.STALLED_INTERVAL_MS || '30000', 10),
  });

  worker.on('ready', () => {
    console.log(`[Worker ${WORKER_LABEL}] Ready and listening on queue "${queueName}"`);
  });

  worker.on('error', (err) => {
    console.error(`[Worker ${WORKER_LABEL}] Worker error:`, err.message);
  });

  // Fires whenever BullMQ detects a job whose lock expired while active
  // (e.g. the worker that held it crashed or was too slow to renew the
  // lock). BullMQ will move it back to "wait" for another worker to pick
  // up, consuming one of its retry attempts.
  worker.on('stalled', (jobId) => {
    console.warn(`[Worker ${WORKER_LABEL}] Job ${jobId} stalled - will be recovered by another worker`);
  });

  const shutdown = async (signal) => {
    console.log(`[Worker ${WORKER_LABEL}] Received ${signal}, closing gracefully...`);
    await worker.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error(`[Worker ${WORKER_LABEL}] Failed to start:`, err);
  process.exit(1);
});
