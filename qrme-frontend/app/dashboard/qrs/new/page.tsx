'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplates, createQRCode } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

interface Template {
  templateId: string;
  name: string;
  description: string;
}

export default function CreateQRPage() {
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [label, setLabel] = useState('');
  const [tagline, setTagline] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdQR, setCreatedQR] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0) {
        setSelectedTemplate(data.templates[0].templateId);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !label) return;
    setCreating(true);
    try {
      const data = await createQRCode({
        templateId: selectedTemplate,
        label,
        tagline,
      });
      setCreatedQR(data.qrcode);
    } catch (err) {
      console.error('Error creating QR:', err);
    } finally {
      setCreating(false);
    }
  };

  const downloadQR = (format: 'svg' | 'png') => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrme-${label || 'qr'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 1024;
        canvas.height = 1024;
        ctx?.drawImage(img, 0, 0, 1024, 1024);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `qrme-${label || 'qr'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center text-[var(--color-text-muted)]">
        Cargando plantillas...
      </div>
    );
  }

  // Success state — show QR + download buttons
  if (createdQR) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">¡QR creado!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Tu QR está listo. Descárgalo e imprímelo donde quieras.
          </p>

          {/* QR Preview */}
          <div
            ref={qrRef}
            className="inline-block p-6 bg-white rounded-2xl mb-6 animate-pulse-glow"
          >
            <QRCodeSVG
              value={createdQR.targetUrl as string}
              size={256}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#1a1035"
            />
          </div>

          <p className="text-sm text-[var(--color-text-muted)] mb-6 break-all">
            {createdQR.targetUrl as string}
          </p>

          {/* Download buttons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button onClick={() => downloadQR('png')} className="btn-primary">
              📥 Descargar PNG
            </button>
            <button onClick={() => downloadQR('svg')} className="btn-secondary">
              📐 Descargar SVG
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCreatedQR(null);
                setLabel('');
                setTagline('');
              }}
              className="btn-secondary"
            >
              ➕ Crear otro
            </button>
            <button
              onClick={() => router.push('/dashboard/qrs')}
              className="btn-secondary"
            >
              📱 Ver mis QRs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Crear nuevo QR</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card p-6 space-y-5">
          {/* Template selector */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--color-text-muted)]">
              Elige una plantilla
            </label>
            <div className="grid gap-3">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.templateId}
                  onClick={() => setSelectedTemplate(tmpl.templateId)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                    selectedTemplate === tmpl.templateId
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedTemplate === tmpl.templateId
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                        : 'border-[var(--color-surface-lighter)]'
                    }`}>
                      {selectedTemplate === tmpl.templateId && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{tmpl.name}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label htmlFor="qr-label" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
              Nombre del QR (interno)
            </label>
            <input
              id="qr-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input-field"
              placeholder="Ej: Camiseta para la fiesta"
              maxLength={100}
            />
          </div>

          {/* Tagline */}
          <div>
            <label htmlFor="qr-tagline" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
              Mensaje / Tagline
            </label>
            <input
              id="qr-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="input-field"
              placeholder='Ej: "Soltera disponible 💃"'
              maxLength={200}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Este mensaje aparecerá en tu página QR pública
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || !label || creating}
            className="btn-primary w-full text-center disabled:opacity-50"
          >
            {creating ? '⏳ Creando...' : '🚀 Crear QR'}
          </button>
        </div>

        {/* Preview */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Vista previa</h3>

          {/* Mini social card preview */}
          <div className="social-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 mx-auto mb-4 flex items-center justify-center text-3xl">
              👤
            </div>
            <h2 className="text-xl font-bold mb-1">Tu Nombre</h2>
            <p className="text-[var(--color-accent)] font-semibold text-lg mb-3">
              {tagline || '"Tu tagline aquí"'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="badge text-xs">🎵 música</span>
              <span className="badge text-xs">✈️ viajes</span>
              <span className="badge text-xs">🍳 cocina</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Así se verá tu página al escanear el QR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
