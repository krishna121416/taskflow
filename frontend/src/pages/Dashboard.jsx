import { useCallback, useEffect, useState } from 'react';
import JobTable from '../components/JobTable.jsx';
import JobDetail from '../components/JobDetail.jsx';
import JobSubmitForm from '../components/JobSubmitForm.jsx';
import { listJobs, createJob, getHealth } from '../services/api.js';

const POLL_MS = 3000;
const DEMO_TYPES = ['send-email', 'process-data', 'fail-twice', 'always-fail'];

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [health, setHealth] = useState(null);
  const [busySeeding, setBusySeeding] = useState(false);

  const refresh = useCallback(async () => {
    const body = await listJobs({ status: statusFilter || undefined, limit: 50 });
    if (body.success) setJobs(body.jobs);
  }, [statusFilter]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  async function submit20Jobs() {
    setBusySeeding(true);
    try {
      // Fires 20 requests concurrently, cycling through all job types, so
      // the demo shows multiple worker PIDs picking up work from the same
      // queue (see README "20-job demonstration").
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          createJob({
            type: DEMO_TYPES[i % DEMO_TYPES.length],
            payload: { email: `demo-${i}@example.com` },
          })
        )
      );
      await refresh();
    } finally {
      setBusySeeding(false);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 0 }}>TaskFlow</h1>
        <span style={{ fontSize: '0.85rem', color: health?.status === 'ok' ? '#15803d' : '#b91c1c' }}>
          API: {health?.status || 'unknown'} · Mongo: {health?.mongo || '?'} · Redis: {health?.redis || '?'}
        </span>
      </div>
      <p style={{ color: '#6b7280' }}>Distributed background job scheduler - live dashboard (polling every {POLL_MS / 1000}s).</p>

      <JobSubmitForm onSubmitted={refresh} />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label>
          Filter by status:{' '}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed (will retry)</option>
            <option value="dead">Dead</option>
          </select>
        </label>
        <button onClick={refresh}>Refresh</button>
        <button onClick={submit20Jobs} disabled={busySeeding}>
          {busySeeding ? 'Submitting 20 jobs...' : 'Submit 20 Jobs (demo)'}
        </button>
      </div>

      <JobTable jobs={jobs} onSelect={setSelectedId} />

      {selectedId && <JobDetail jobId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
