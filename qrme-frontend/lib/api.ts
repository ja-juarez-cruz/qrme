/**
 * QR.me — API client.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL && typeof window !== 'undefined') {
  console.error('NEXT_PUBLIC_API_URL no está definido. Verifica tu .env.local o las variables de entorno del build.');
}

// ─── Fetch Helper ───────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('qrme_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getTemplates() {
  return apiFetch('/public/templates');
}

export async function getPublicQR(slug: string, qrId: string) {
  return apiFetch(`/public/qr/${slug}/${qrId}`);
}

export async function trackScan(qrId: string) {
  return apiFetch(`/track/scan/${qrId}`, { method: 'POST' });
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export async function getMyProfile() {
  return apiFetch('/me/profile');
}

export async function upsertProfile(data: Record<string, unknown>) {
  return apiFetch('/me/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function getPhotoUploadUrl(contentType: string) {
  return apiFetch('/me/profile/photo-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });
}

// ─── QR Codes API ───────────────────────────────────────────────────────────

export async function listQRCodes() {
  return apiFetch('/me/qrcodes');
}

export async function createQRCode(data: Record<string, unknown>) {
  return apiFetch('/me/qrcodes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateQRCode(qrId: string, data: Record<string, unknown>) {
  return apiFetch(`/me/qrcodes/${qrId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteQRCode(qrId: string) {
  return apiFetch(`/me/qrcodes/${qrId}`, { method: 'DELETE' });
}
