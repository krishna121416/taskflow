#!/usr/bin/env node
// Fires N jobs at the TaskFlow API concurrently, cycling through all job
// types. Used to demonstrate multiple worker PROCESSES consuming the same
// BullMQ queue - watch the worker logs (or the dashboard) afterwards to
// see job ids distributed across different worker PIDs/containers.
//
// Usage:
//   node scripts/submit-jobs.js            # 20 jobs against http://localhost:4000
//   node scripts/submit-jobs.js 50          # 50 jobs
//   API_URL=http://localhost:4001 node scripts/submit-jobs.js 20

const API_URL = process.env.API_URL || 'http://localhost:4000';
const COUNT = parseInt(process.argv[2], 10) || 20;
const JOB_TYPES = ['send-email', 'process-data', 'fail-twice', 'always-fail'];

async function submitOne(i) {
  const type = JOB_TYPES[i % JOB_TYPES.length];
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload: { email: `demo-${i}@example.com` } }),
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(`Job ${i} (${type}) failed: ${body.error}`);
  }
  return { i, type, id: body.job.id };
}

async function main() {
  console.log(`Submitting ${COUNT} jobs to ${API_URL} ...`);
  const results = await Promise.all(
    Array.from({ length: COUNT }, (_, i) => submitOne(i))
  );
  for (const r of results) {
    console.log(`  [${r.i}] ${r.type} -> ${r.id}`);
  }
  console.log(`Done. Submitted ${results.length} jobs.`);
  console.log('Watch worker logs or the dashboard to see them distributed across worker processes.');
}

main().catch((err) => {
  console.error('Failed to submit jobs:', err.message);
  process.exit(1);
});
