const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY || '';

function headers(extra = {}) {
  return API_ACCESS_KEY ? { ...extra, 'X-API-Key': API_ACCESS_KEY } : extra;
}

export async function fetchJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal, headers: headers() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Request failed with status ${response.status}`);
  }
  return payload.data;
}

export async function postJson(path, body, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Request failed with status ${response.status}`);
  return payload.data;
}

export { API_BASE_URL };
