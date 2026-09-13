const mongoose = require('mongoose');

// The five statuses a job can be in. Note there is deliberately no
// "retrying" status - see the comment on `status` below.
const JOB_STATUSES = ['queued', 'running', 'completed', 'failed', 'dead'];

const jobSchema = new mongoose.Schema(
  {
    // Human-readable job type, used to pick a handler in the worker
    // (e.g. "send-email", "process-data", "fail-twice", "always-fail").
    type: { type: String, required: true },

    // Arbitrary job-specific data (e.g. { email: "..." }).
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Current lifecycle status. "failed" here means "the most recent
    // attempt failed" - it does NOT necessarily mean the job is done.
    // BullMQ decides whether to retry; if a retry is scheduled the job
    // goes back to "queued" and then "running" again. Only once BullMQ
    // has exhausted all attempts do we mark the job "dead" (permanent).
    // We don't persist a separate "retrying" status because it isn't a
    // distinct state a job sits in - it goes straight back to "queued".
    status: { type: String, enum: JOB_STATUSES, default: 'queued', index: true },

    // How many attempts have been made so far (mirrors BullMQ's own
    // attemptsMade, persisted here so the API/dashboard don't need to
    // query Redis directly).
    attempts: { type: Number, default: 0 },

    // Max attempts allowed before the job is marked "dead".
    max_attempts: { type: Number, required: true },

    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },

    // Error message from the most recent failed attempt, if any.
    last_error: { type: String, default: null },

    // The BullMQ job id, so we can look up queue-side state
    // (e.g. via queue.getJob(bullJobId)) from a MongoDB job document.
    bull_job_id: { type: String, required: true, index: true },
  },
  {
    // Adds createdAt/updatedAt; created_at (below) is a virtual alias so
    // the API can expose the exact field name required by the spec.
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

jobSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Job = mongoose.model('Job', jobSchema);

module.exports = { Job, JOB_STATUSES };
