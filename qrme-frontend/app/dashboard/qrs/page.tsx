'use client';

import { useState, useEffect } from 'react';
import { listQRCodes, deleteQRCode } from '@/lib/api';
import Link from 'next/link';

interface QRCode {
  qrId: string;
  label: string;
  tagline: string;
  templateId: string;
  targetUrl: string;
  scanCount: number;
  createdAt: string;
}

export default function QRListPage() {
  const [qrcodes, setQrcodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadQRs();
  }, []);

  const loadQRs = async () => {
    try {
      const data = await listQRCodes();
      setQrcodes(data.qrcodes || []);
    } catch (err) {
      console.error('Error loading QRs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (qrId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este QR?')) return;
    setDeleting(qrId);
    try {
      await deleteQRCode(qrId);
      setQrcodes(prev => prev.filter(q => q.qrId !== qrId));
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center text-[var(--color-text-muted)]">
        Cargando QRs...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Códigos QR</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {qrcodes.length} QR{qrcodes.length !== 1 ? 's' : ''} creado{qrcodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/qrs/new" className="btn-primary">
          ➕ Crear QR
        </Link>
      </div>

      {qrcodes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-2">Aún no tienes QRs</h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Crea tu primer código QR y empieza a conectar con las personas
          </p>
          <Link href="/dashboard/qrs/new" className="btn-primary">
            🚀 Crear mi primer QR
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {qrcodes.map((qr) => (
            <div
              key={qr.qrId}
              className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card-hover transition-all duration-300"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg truncate">
                    {qr.label || 'Sin nombre'}
                  </h3>
                  <span className="badge text-xs">
                    {qr.templateId}
                  </span>
                </div>
                {qr.tagline && (
                  <p className="text-[var(--color-text-muted)] text-sm mb-2 truncate">
                    &ldquo;{qr.tagline}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    📊 <strong className="text-[var(--color-success)]">{qr.scanCount}</strong> escaneos
                  </span>
                  <span>
                    🕐 {new Date(qr.createdAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={qr.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm py-2 px-3"
                >
                  👁️ Ver
                </a>
                <button
                  onClick={() => handleDelete(qr.qrId)}
                  disabled={deleting === qr.qrId}
                  className="btn-danger text-sm py-2 px-3 disabled:opacity-50"
                >
                  {deleting === qr.qrId ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
