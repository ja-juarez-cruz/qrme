'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplates, createQRCode, getMyProfile } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

interface Template {
  templateId: string;
  name: string;
  description: string;
  category?: string;
  emoji?: string;
  taglinePlaceholder?: string;
}

type Category = 'social' | 'profesional' | 'divulgacion';

const CATEGORIES: { id: Category; label: string; emoji: string; available: boolean }[] = [
  { id: 'social', label: 'Social', emoji: '🎭', available: true },
  { id: 'profesional', label: 'Profesional', emoji: '💼', available: false },
  { id: 'divulgacion', label: 'Divulgación', emoji: '📣', available: false },
];

export default function CreateQRPage() {
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('social');
  const [label, setLabel] = useState('');
  const [tagline, setTagline] = useState('');

  const [qrType, setQrType] = useState<'template' | 'redirect'>('template');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [profile, setProfile] = useState<{ displayName?: string; [key: string]: unknown } | null>(null);

  const [creating, setCreating] = useState(false);
  const [createdQR, setCreatedQR] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const [templatesData, profileData] = await Promise.all([
        getTemplates(),
        getMyProfile().catch(() => ({ profile: {} }))
      ]);
      const tmplList: Template[] = templatesData.templates || [];
      setTemplates(tmplList);
      const firstSocial = tmplList.find(t => (t.category || 'social') === 'social');
      if (firstSocial) setSelectedTemplate(firstSocial.templateId);
      if (profileData.profile) setProfile(profileData.profile);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    t => (t.category || 'social') === activeCategory
  );

  const currentTemplate = templates.find(t => t.templateId === selectedTemplate);

  const handleCreate = async () => {
    if (!label) return;
    if (qrType === 'template' && !selectedTemplate) return;
    if (qrType === 'redirect' && !redirectUrl) return;

    setCreating(true);
    try {
      let htmlContent = '';

      if (qrType === 'template') {
        const res = await fetch('/api/generate-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: profile || {},
            qr: { label, tagline, templateId: selectedTemplate }
          })
        });
        if (!res.ok) throw new Error('Error generando HTML de la plantilla');
        const data = await res.json();
        htmlContent = data.html;
      }

      const data = await createQRCode({
        type: qrType,
        templateId: selectedTemplate,
        redirectUrl,
        htmlContent,
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

  if (createdQR) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">¡QR creado!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Tu QR está listo. Descárgalo e imprímelo donde quieras.
          </p>
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
              onClick={() => { setCreatedQR(null); setLabel(''); setTagline(''); }}
              className="btn-secondary"
            >
              ➕ Crear otro
            </button>
            <button onClick={() => router.push('/dashboard/qrs')} className="btn-secondary">
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

          {/* Tipo de QR */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--color-text-muted)]">
              ¿Qué tipo de QR quieres crear?
            </label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                onClick={() => setQrType('template')}
                className={`p-3 rounded-xl text-center font-medium transition-all duration-200 border ${
                  qrType === 'template'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]'
                    : 'border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                📱 Plantilla Web
              </button>
              <button
                onClick={() => setQrType('redirect')}
                className={`p-3 rounded-xl text-center font-medium transition-all duration-200 border ${
                  qrType === 'redirect'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]'
                    : 'border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                🔗 Redirigir URL
              </button>
            </div>
          </div>

          {/* Template selector */}
          {qrType === 'template' && (
            <div className="animate-fade-in">
              {/* Category tabs */}
              <div className="flex gap-1.5 mb-4 p-1 bg-[var(--color-surface)] rounded-xl">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => cat.available && setActiveCategory(cat.id)}
                    disabled={!cat.available}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      cat.available && activeCategory === cat.id
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] border border-[var(--color-primary)]/40'
                        : cat.available
                        ? 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-light)]'
                        : 'text-[var(--color-text-muted)]/30 cursor-not-allowed'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                    {!cat.available && (
                      <span className="ml-1 text-[10px] opacity-60">pronto</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Templates grid */}
              <label className="block text-xs font-medium mb-2 text-[var(--color-text-muted)] uppercase tracking-wider">
                Elige una plantilla
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.templateId}
                    onClick={() => setSelectedTemplate(tmpl.templateId)}
                    className={`p-3.5 rounded-xl text-left transition-all duration-200 border group ${
                      selectedTemplate === tmpl.templateId
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-light)]'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{tmpl.emoji || '✨'}</div>
                    <h3 className="font-semibold text-sm leading-tight mb-1">{tmpl.name}</h3>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                      {tmpl.description}
                    </p>
                    {selectedTemplate === tmpl.templateId && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                        <span className="text-[10px] text-[var(--color-primary-light)] font-medium">Seleccionada</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* URL Input */}
          {qrType === 'redirect' && (
            <div className="animate-fade-in">
              <label htmlFor="redirect-url" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                URL Destino
              </label>
              <input
                id="redirect-url"
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="input-field"
                placeholder="https://tupagina.com"
                required={qrType === 'redirect'}
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Al escanear el QR, los usuarios serán redirigidos a esta página.
              </p>
            </div>
          )}

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
          {qrType === 'template' && (
            <div className="animate-fade-in">
              <label htmlFor="qr-tagline" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                Mensaje / Tagline
              </label>
              <input
                id="qr-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="input-field"
                placeholder={currentTemplate?.taglinePlaceholder ? `Ej: "${currentTemplate.taglinePlaceholder}"` : 'Tu mensaje aquí...'}
                maxLength={200}
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Este mensaje aparecerá en tu página pública al escanear el QR.
              </p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={
              !label ||
              creating ||
              (qrType === 'template' && !selectedTemplate) ||
              (qrType === 'redirect' && !redirectUrl)
            }
            className="btn-primary w-full text-center disabled:opacity-50"
          >
            {creating ? '⏳ Creando...' : '🚀 Crear QR'}
          </button>
        </div>

        {/* Preview */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Vista previa</h3>

          {qrType === 'template' ? (
            <div className="social-card p-6 text-center animate-fade-in">
              <div className="text-4xl mb-3">{currentTemplate?.emoji || '✨'}</div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 mx-auto mb-4 flex items-center justify-center text-2xl">
                👤
              </div>
              <h2 className="text-xl font-bold mb-1">{profile?.displayName || 'Tu Nombre'}</h2>
              {currentTemplate && (
                <p className="text-xs text-[var(--color-primary-light)] font-medium mb-2 uppercase tracking-wider">
                  {currentTemplate.name}
                </p>
              )}
              <p className="text-[var(--color-accent)] font-semibold text-base mb-3">
                &ldquo;{tagline || currentTemplate?.taglinePlaceholder || 'Tu tagline aquí'}&rdquo;
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="badge text-xs">🎵 música</span>
                <span className="badge text-xs">✈️ viajes</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Así se verá tu página al escanear el QR
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px] border-2 border-dashed border-[var(--color-surface-lighter)] rounded-2xl p-6 text-center animate-fade-in bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-lg font-bold mb-2">Redirección Directa</h3>
              <p className="text-[var(--color-text-muted)] text-sm mb-4">
                Los usuarios irán directamente a:
              </p>
              <div className="bg-[var(--color-surface)] px-4 py-2 rounded-lg text-[var(--color-primary-light)] font-mono text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap border border-[var(--color-surface-lighter)]">
                {redirectUrl || 'https://...'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
