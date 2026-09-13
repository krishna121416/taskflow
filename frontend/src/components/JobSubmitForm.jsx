import { useState } from 'react';
import { createJob } from '../services/api.js';

const JOB_TYPES = ['send-email', 'process-data', 'fail-twice', 'always-fail'];

export default function JobSubmitForm({ onSubmitted }) {
  const [type, setType] = useState(JOB_TYPES[0]);
  const [email, setEmail] = useState('test@example.com');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = type === 'send-email' ? { email } : {};
      await createJob({ type, payload });
      onSubmitted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {JOB_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {type === 'send-email' && (
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      )}
      <button type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit Job'}</button>
    </form>
  );
}
