import { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { getJob } from '../services/api.js';

function fmt(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString();
}

export default function JobDetail({ jobId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let interval;

    async function load() {
      const body = await getJob(jobId);
      if (cancelled) return;
      if (!body.success) {
        setError(body.error);
        return;
      }
      setData(body);
      // Stop polling once the job reaches a terminal state.
      if (['completed', 'dead'].includes(body.job.status) && interval) {
        clearInterval(interval);
      }
    }

    load();
    interval = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '4rem',
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 8, padding: '1.5rem', width: 600, maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Job Detail</h2>
          <button onClick={onClose}>Close</button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {data && (
          <>
            <p style={{ fontFamily: 'monospace', color: '#6b7280' }}>{data.job.id}</p>
            <table style={{ marginBottom: '1rem' }}>
              <tbody>
                <tr><td style={label}>Type</td><td>{data.job.type}</td></tr>
                <tr><td style={label}>Status</td><td><StatusBadge status={data.job.status} /></td></tr>
                <tr><td style={label}>Attempts</td><td>{data.job.attempts} / {data.job.max_attempts}</td></tr>
                <tr><td style={label}>Created</td><td>{fmt(data.job.created_at)}</td></tr>
                <tr><td style={label}>Started</td><td>{fmt(data.job.started_at)}</td></tr>
                <tr><td style={label}>Completed</td><td>{fmt(data.job.completed_at)}</td></tr>
                {data.job.last_error && (
                  <tr><td style={label}>Last Error</td><td style={{ color: '#b91c1c' }}>{data.job.last_error}</td></tr>
                )}
              </tbody>
            </table>

            <h3>Attempt History</h3>
            {data.attemptHistory.length === 0 && <p style={{ color: '#6b7280' }}>No attempts recorded yet.</p>}
            {data.attemptHistory.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.5rem',
                  background: a.result === 'completed' ? '#f0fdf4' : '#fffbeb',
                }}
              >
                <strong>Attempt {a.attempt_number}</strong>
                {' - '}
                <span style={{ color: a.result === 'completed' ? '#15803d' : '#b45309' }}>{a.result || 'in progress'}</span>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                  Worker: {a.worker_host}:{a.worker_pid} · Started: {fmt(a.started_at)} · Ended: {fmt(a.ended_at)}
                </div>
                {a.error && <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>Error: {a.error}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const label = { fontWeight: 600, paddingRight: '1rem', verticalAlign: 'top' };
