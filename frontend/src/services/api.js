export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function getHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  return res.json();
}

export async function listJobs({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  const res = await fetch(`${API_URL}/jobs?${params.toString()}`);
  return res.json();
}

export async function getJob(id) {
  const res = await fetch(`${API_URL}/jobs/${id}`);
  return res.json();
}

export async function createJob({ type, payload }) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  });
  return res.json();
}
