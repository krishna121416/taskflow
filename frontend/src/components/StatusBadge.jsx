// Distinct visual style per status, so "failed" (will retry) is clearly
// different from "dead" (permanent) at a glance - see Phase 7 requirement.
const STYLES = {
  queued: { bg: '#e5e7eb', fg: '#374151', label: 'Queued' },
  running: { bg: '#dbeafe', fg: '#1d4ed8', label: 'Running' },
  completed: { bg: '#dcfce7', fg: '#15803d', label: 'Completed' },
  failed: { bg: '#fef3c7', fg: '#b45309', label: 'Failed (will retry)' },
  dead: { bg: '#fee2e2', fg: '#b91c1c', label: 'Dead' },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || { bg: '#e5e7eb', fg: '#374151', label: status };
  return (
    <span
      style={{
        background: style.bg,
        color: style.fg,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: '0.8rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}
