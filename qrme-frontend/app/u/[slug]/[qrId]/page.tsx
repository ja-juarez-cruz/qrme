/**
 * QR.me — Public QR page.
 * Renders /u/[slug]/[qrId] with ISR (revalidate: 60s).
 * Fetches QR data + profile from the API and renders the template.
 */
import SocialFunCard from '@/components/templates/SocialFunCard';
import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface PageProps {
  params: Promise<{ slug: string; qrId: string }>;
}

// Demo data for development when API is not configured
const DEMO_DATA = {
  qr: {
    qrId: 'demo-qr',
    tagline: 'Soltera disponible 💃',
    templateId: 'social-v1',
    scanCount: 42,
  },
  profile: {
    displayName: 'María García',
    age: 25,
    bio: '✨ Amante de la vida, los viajes y la buena música. Siempre lista para una aventura nueva. Si me escaneas, ya somos amigos.',
    interests: ['🎵 Música', '✈️ Viajes', '🍳 Cocina', '📸 Fotografía', '🎬 Cine'],
    photoUrl: '',
    socialLinks: {
      instagram: '@mariagarcia',
      whatsapp: '+52 55 1234 5678',
      tiktok: '@mariagarcia',
    },
  },
  user: {
    slug: 'maria-garcia',
  },
};

async function getQRData(slug: string, qrId: string) {
  if (!API_BASE) {
    // Use demo data in development
    return DEMO_DATA;
  }

  try {
    const res = await fetch(`${API_BASE}/public/qr/${slug}/${qrId}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, qrId } = await params;
  const data = await getQRData(slug, qrId);

  if (!data) {
    return { title: 'QR no encontrado — QR.me' };
  }

  const name = data.profile?.displayName || 'Usuario';
  const tagline = data.qr?.tagline || '';

  return {
    title: `${name} — ${tagline || 'QR.me'}`,
    description: data.profile?.bio || `Perfil de ${name} en QR.me`,
    openGraph: {
      title: `${name} ${tagline ? `— "${tagline}"` : ''}`,
      description: data.profile?.bio || `Conoce a ${name} escaneando su QR`,
      type: 'profile',
    },
  };
}

export default async function PublicQRPage({ params }: PageProps) {
  const { slug, qrId } = await params;
  const data = await getQRData(slug, qrId);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">QR no encontrado</h1>
          <p className="text-[var(--color-text-muted)]">
            Este código QR no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  // Track scan (fire and forget)
  if (API_BASE) {
    fetch(`${API_BASE}/track/scan/${qrId}`, { method: 'POST' }).catch(() => {});
  }

  // Render based on template
  const templateId = data.qr?.templateId || 'social-v1';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {templateId === 'social-v1' ? (
        <SocialFunCard profile={data.profile} qr={data.qr} />
      ) : (
        <SocialFunCard profile={data.profile} qr={data.qr} />
      )}
    </div>
  );
}
