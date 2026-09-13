import StatusBadge from './StatusBadge.jsx';

function fmt(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString();
}

export default function JobTable({ jobs, onSelect }) {
  if (jobs.length === 0) {
    return <p style={{ color: '#6b7280' }}>No jobs yet. Submit one below.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
            <th style={th}>Job ID</th>
            <th style={th}>Type</th>
            <th style={th}>Status</th>
            <th style={th}>Attempts</th>
            <th style={th}>Created</th>
            <th style={th}>Last Error</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onSelect(job.id)}
              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
            >
              <td style={{ ...td, fontFamily: 'monospace' }}>{job.id.slice(-8)}</td>
              <td style={td}>{job.type}</td>
              <td style={td}>
                <StatusBadge status={job.status} />
              </td>
              <td style={td}>
                {job.attempts} / {job.max_attempts}
              </td>
              <td style={td}>{fmt(job.created_at)}</td>
              <td style={{ ...td, color: '#b91c1c', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.last_error || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: '8px 12px' };
const td = { padding: '8px 12px' };
