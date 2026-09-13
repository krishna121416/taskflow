const { Job } = require('../models/Job');
const { AttemptHistory } = require('../models/AttemptHistory');

/**
 * Figure out which attempt number this run is, purely from what's already
 * persisted in MongoDB. This is the "reliable mechanism" the fail-twice
 * job type depends on: it does NOT trust any in-memory counter, because a
 * retry can land on a completely different worker process than the one
 * that ran the previous attempt.
 */
async function nextAttemptNumber(jobId) {
  const count = await AttemptHistory.countDocuments({ job: jobId });
  return count + 1;
}

async function startAttempt({ jobId, bullJobId, attemptNumber, workerPid, workerHost }) {
  await Job.findByIdAndUpdate(jobId, { status: 'running' });
  // started_at should only be set the first time the job ever runs, not
  // reset on every retry attempt.
  await Job.updateOne({ _id: jobId, started_at: null }, { started_at: new Date() });

  const attempt = await AttemptHistory.create({
    job: jobId,
    bull_job_id: bullJobId,
    attempt_number: attemptNumber,
    worker_pid: workerPid,
    worker_host: workerHost,
    started_at: new Date(),
  });

  return attempt;
}

async function completeAttempt({ attempt, jobId, attemptNumber }) {
  const now = new Date();
  attempt.ended_at = now;
  attempt.result = 'completed';
  await attempt.save();

  await Job.findByIdAndUpdate(jobId, {
    status: 'completed',
    attempts: attemptNumber,
    completed_at: now,
    last_error: null,
  });
}

async function failAttempt({ attempt, jobId, attemptNumber, maxAttempts, error }) {
  const now = new Date();
  attempt.ended_at = now;
  attempt.result = 'failed';
  attempt.error = error.message;
  await attempt.save();

  const isFinalAttempt = attemptNumber >= maxAttempts;

  // 'failed' = this attempt failed and BullMQ will retry it.
  // 'dead'   = this was the last allowed attempt; BullMQ will not retry.
  await Job.findByIdAndUpdate(jobId, {
    status: isFinalAttempt ? 'dead' : 'failed',
    attempts: attemptNumber,
    last_error: error.message,
  });

  return { isFinalAttempt };
}

module.exports = { nextAttemptNumber, startAttempt, completeAttempt, failAttempt };
