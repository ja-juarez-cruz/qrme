'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SocialFunCard from '@/components/templates/SocialFunCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

type QRData = {
  qr: {
    qrId: string;
    tagline?: string;
    templateId?: string;
    scanCount?: number;
    type?: string;
    redirectUrl?: string;
    s3Key?: string;
  };
  profile: {
    displayName?: string;
    age?: number;
    bio?: string;
    interests?: string[];
    photoUrl?: string;
    socialLinks?: Record<string, string>;
  };
  user: { slug: string };
} | null;

export default function QRPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const qrId = params.qrId as string;

  const [data, setData] = useState<QRData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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

        if (json.qr?.type === 'redirect' && json.qr?.redirectUrl) {
          window.location.href = json.qr.redirectUrl;
          return;
        } else if (json.qr?.type === 'template' && json.qr?.s3Key) {
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
