const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...NGROK_HEADERS,
  };
}

async function parseError(res) {
  try {
    const data = await res.clone().json();
    return data?.message || JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return `HTTP ${res.status}`;
    }
  }
}

export async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiPut(path, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json().catch(() => ({}));
}

export async function apiUpload(path, formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...NGROK_HEADERS,
    },
    body: formData,
  });
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      /* abaikan */
    }
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export { API_BASE, NGROK_HEADERS };
