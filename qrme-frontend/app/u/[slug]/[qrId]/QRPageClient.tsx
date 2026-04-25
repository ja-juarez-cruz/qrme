'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SocialFunCard from '@/components/templates/SocialFunCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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
  user: { slug: 'maria-garcia' },
};

type QRData = typeof DEMO_DATA | null;

export default function QRPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const qrId = params.qrId as string;

  const [data, setData] = useState<QRData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || slug === '_') {
      setData(DEMO_DATA);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!API_BASE) {
        setData(DEMO_DATA);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/public/qr/${slug}/${qrId}`);
        if (!res.ok) {
          setData(null);
          return;
        }
        const json = await res.json();
        setData(json);
        
        // Track scan in background
        fetch(`${API_BASE}/track/scan/${qrId}`, { method: 'POST' }).catch(() => {});

        // Handle redirection based on type
        if (json.qr?.type === 'redirect' && json.qr?.redirectUrl) {
          window.location.href = json.qr.redirectUrl;
          return;
        } else if (json.qr?.type === 'template' && json.qr?.s3Key) {
          // If the S3 bucket is the same as the frontend host, we can just navigate to the file
          window.location.href = '/' + json.qr.s3Key;
          return;
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, qrId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">✨</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <SocialFunCard profile={data.profile} qr={data.qr} />
    </div>
  );
}
