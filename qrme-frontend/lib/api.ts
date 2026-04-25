/**
 * QR.me — API client.
 * Handles all API communication with mock data support for local dev.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL;

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_TEMPLATES = [
  {
    templateId: 'social-v1',
    name: 'Fun Card',
    description: 'Presentación vibrante para cualquier evento social. El clásico de QR.me.',
    category: 'social',
    emoji: '✨',
    taglinePlaceholder: '¡Escanéame y conectemos!',
    isActive: true,
    previewUrl: '',
    requiredFields: ['displayName', 'tagline'],
    optionalFields: ['age', 'bio', 'interests', 'photoUrl', 'socialLinks'],
  },
  {
    templateId: 'social-friends-v1',
    name: 'Nuevos Amigos',
    description: 'Para conocer gente nueva y ampliar tu círculo. Ideal para eventos, viajes y cualquier lugar.',
    category: 'social',
    emoji: '🤝',
    taglinePlaceholder: 'Siempre abierto/a a nuevas amistades',
    isActive: true,
    previewUrl: '',
    requiredFields: ['displayName', 'tagline'],
    optionalFields: ['age', 'bio', 'interests', 'photoUrl', 'socialLinks'],
  },
  {
    templateId: 'social-romance-v1',
    name: 'Buscando Pareja',
    description: 'Muestra tu mejor lado y conecta con alguien especial. Perfecto para el modo dating.',
    category: 'social',
    emoji: '💕',
    taglinePlaceholder: 'Soltero/a y listo/a para conocerte',
    isActive: true,
    previewUrl: '',
    requiredFields: ['displayName', 'tagline'],
    optionalFields: ['age', 'bio', 'interests', 'photoUrl', 'socialLinks'],
  },
  {
    templateId: 'social-fiesta-v1',
    name: 'Modo Fiesta',
    description: 'El QR perfecto para compartir en eventos y fiestas. Para el que siempre busca una buena noche.',
    category: 'social',
    emoji: '🎉',
    taglinePlaceholder: '¿Bailamos esta noche?',
    isActive: true,
    previewUrl: '',
    requiredFields: ['displayName', 'tagline'],
    optionalFields: ['age', 'bio', 'interests', 'photoUrl', 'socialLinks'],
  },
];

let mockProfile: Record<string, unknown> | null = null;
let mockUser: Record<string, unknown> | null = null;
let mockQrCodes: Record<string, unknown>[] = [];
let mockScanCounts: Record<string, number> = {};

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
  if (USE_MOCK) return { templates: MOCK_TEMPLATES };
  return apiFetch('/public/templates');
}

export async function getPublicQR(slug: string, qrId: string) {
  if (USE_MOCK) {
    const qr = mockQrCodes.find(q => q.qrId === qrId && q.slug === slug);
    if (!qr) throw new Error('QR no encontrado');
    return { qr, profile: mockProfile, user: mockUser };
  }
  return apiFetch(`/public/qr/${slug}/${qrId}`);
}

export async function trackScan(qrId: string) {
  if (USE_MOCK) {
    mockScanCounts[qrId] = (mockScanCounts[qrId] || 0) + 1;
    return { scanCount: mockScanCounts[qrId] };
  }
  return apiFetch(`/track/scan/${qrId}`, { method: 'POST' });
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export async function getMyProfile() {
  if (USE_MOCK) return { user: mockUser, profile: mockProfile };
  return apiFetch('/me/profile');
}

export async function upsertProfile(data: Record<string, unknown>) {
  if (USE_MOCK) {
    mockProfile = { userId: 'mock-user', ...mockProfile, ...data, updatedAt: new Date().toISOString() };
    if (!mockUser) {
      const slug = ((data.displayName as string) || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      mockUser = { userId: 'mock-user', slug, email: 'mock@qrme.test', createdAt: new Date().toISOString() };
    }
    return { message: 'Perfil actualizado', slug: (mockUser as Record<string, unknown>).slug, profile: mockProfile };
  }
  return apiFetch('/me/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function getPhotoUploadUrl(contentType: string) {
  if (USE_MOCK) {
    return {
      uploadUrl: 'https://mock-s3.example.com/upload',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      key: 'avatars/mock-user/mock.jpg',
    };
  }
  return apiFetch('/me/profile/photo-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });
}

// ─── QR Codes API ───────────────────────────────────────────────────────────

export async function listQRCodes() {
  if (USE_MOCK) return { qrcodes: mockQrCodes };
  return apiFetch('/me/qrcodes');
}

export async function createQRCode(data: Record<string, unknown>) {
  if (USE_MOCK) {
    const qrId = Math.random().toString(36).substring(2, 10);
    const slug = (mockUser as Record<string, unknown>)?.slug || 'user';
    const qr = {
      qrId,
      userId: 'mock-user',
      slug,
      templateId: data.templateId,
      label: data.label || '',
      tagline: data.tagline || '',
      customData: data.customData || {},
      targetUrl: `http://localhost:3000/u/${slug}/${qrId}`,
      scanCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockQrCodes.unshift(qr);
    return { qrcode: qr };
  }
  return apiFetch('/me/qrcodes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateQRCode(qrId: string, data: Record<string, unknown>) {
  if (USE_MOCK) {
    const idx = mockQrCodes.findIndex(q => q.qrId === qrId);
    if (idx === -1) throw new Error('QR no encontrado');
    mockQrCodes[idx] = { ...mockQrCodes[idx], ...data };
    return { qrcode: mockQrCodes[idx] };
  }
  return apiFetch(`/me/qrcodes/${qrId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteQRCode(qrId: string) {
  if (USE_MOCK) {
    mockQrCodes = mockQrCodes.filter(q => q.qrId !== qrId);
    return { message: 'QR eliminado', qrId };
  }
  return apiFetch(`/me/qrcodes/${qrId}`, { method: 'DELETE' });
}
