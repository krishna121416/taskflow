const mongoose = require('mongoose');

// One document per execution attempt of a job. This is what lets the
// dashboard/API show "attempt 1 failed on worker 1200, attempt 2 failed on
// worker 1204, attempt 3 completed on worker 1204" - BullMQ itself only
// keeps a job's *current* state in Redis, not a durable per-attempt log,
// so this collection is TaskFlow's own history record.
const attemptHistorySchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    bull_job_id: { type: String, required: true },

    // 1-based attempt number, matching BullMQ's attemptsMade after the
    // attempt is counted.
    attempt_number: { type: Number, required: true },

    // process.pid of the worker process that ran this attempt. Comparing
    // this across attempts is how we demonstrate that different worker
    // processes can pick up retries of the same job.
    //
    // Caveat: inside a Docker container, Node normally runs as PID 1 of
    // that container's own PID namespace - so worker_pid alone is often
    // "1" for EVERY worker container and can't distinguish them. worker_host
    // (the container hostname, unique per container) is what actually
    // distinguishes worker PROCESSES when running under docker-compose.
    worker_pid: { type: Number, required: true },
    worker_host: { type: String, required: true },

    started_at: { type: Date, required: true },
    ended_at: { type: Date, default: null },

    // 'completed' or 'failed'. Not the same enum as Job.status - an
    // attempt is always a terminal outcome for that one try.
    result: { type: String, enum: ['completed', 'failed'], default: null },

    error: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

attemptHistorySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const AttemptHistory = mongoose.model('AttemptHistory', attemptHistorySchema);

module.exports = { AttemptHistory };
