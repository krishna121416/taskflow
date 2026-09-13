const mongoose = require('mongoose');
const { Job } = require('../models/Job');
const { AttemptHistory } = require('../models/AttemptHistory');
const { enqueueJob } = require('../queue/queue');
const { JOB_TYPES } = require('../services/jobTypes');
const { defaultMaxAttempts } = require('../config/env');

async function createJob(req, res, next) {
  try {
    const { type, payload, max_attempts: maxAttemptsInput } = req.body || {};

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, error: '"type" is required' });
    }
    if (!JOB_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Unknown job type "${type}". Valid types: ${JOB_TYPES.join(', ')}`,
      });
    }
    if (payload !== undefined && typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: '"payload" must be an object' });
    }

    const maxAttempts = maxAttemptsInput
      ? parseInt(maxAttemptsInput, 10)
      : defaultMaxAttempts;
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      return res.status(400).json({ success: false, error: '"max_attempts" must be a positive integer' });
    }

    // 1. Create the MongoDB record first (status = queued) so we have a
    //    stable id to hand to BullMQ.
    const job = await Job.create({
      type,
      payload: payload || {},
      max_attempts: maxAttempts,
      status: 'queued',
      // bull_job_id is filled in right after we enqueue below.
      bull_job_id: 'pending',
    });

    // 2. Enqueue in BullMQ, linking back to the Mongo document id. This is
    //    the "stable identifier connecting the MongoDB job and BullMQ job":
    //    Mongo's _id is passed into the BullMQ job data, and BullMQ's own
    //    job id is stored back onto the Mongo document.
    const bullJob = await enqueueJob({
      type,
      payload: payload || {},
      mongoJobId: job._id.toString(),
      maxAttempts,
    });

    job.bull_job_id = bullJob.id;
    await job.save();

    return res.status(201).json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        max_attempts: job.max_attempts,
        created_at: job.created_at,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listJobs(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const statusFilter = req.query.status;

    const query = {};
    if (statusFilter) query.status = statusFilter;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Job.countDocuments(query),
    ]);

    return res.json({
      success: true,
      jobs: jobs.map((j) => j.toJSON()),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
}

async function getJob(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid job id' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const attemptHistory = await AttemptHistory.find({ job: job._id }).sort({ attempt_number: 1 });

    return res.json({
      success: true,
      job: job.toJSON(),
      attemptHistory: attemptHistory.map((a) => a.toJSON()),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createJob, listJobs, getJob };
