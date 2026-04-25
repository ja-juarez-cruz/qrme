'use client';

import { useState, useEffect } from 'react';
import { getMyProfile, upsertProfile, getPhotoUploadUrl } from '@/lib/api';

interface Profile {
  displayName?: string;
  age?: number;
  bio?: string;
  interests?: string[];
  photoUrl?: string;
  socialLinks?: Record<string, string>;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>({});
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [interestsInput, setInterestsInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      if (data.profile) {
        setProfile(data.profile);
        setInterestsInput((data.profile.interests || []).join(', '));
      }
      if (data.user?.slug) {
        setSlug(data.user.slug);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const interests = interestsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const data = {
        ...profile,
        interests,
      };

      const result = await upsertProfile(data);
      if (result.slug) setSlug(result.slug);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { uploadUrl, photoUrl } = await getPhotoUploadUrl(file.type);

      // Upload to S3 (or mock)
      if (uploadUrl.startsWith('https://mock')) {
        // Mock mode — use the returned mock URL
      } else {
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
      }

      setProfile(prev => ({ ...prev, photoUrl }));
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center text-[var(--color-text-muted)]">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          {slug && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              qrme.app/u/<span className="text-[var(--color-primary-light)]">{slug}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Photo + Preview */}
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-primary)]/30 bg-[var(--color-surface)]">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-white text-sm font-medium">📷 Cambiar</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Click para cambiar foto</p>
        </div>

        {/* Form */}
        <div className="md:col-span-2 glass-card p-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
              Nombre público
            </label>
            <input
              id="displayName"
              type="text"
              value={profile.displayName || ''}
              onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
              className="input-field"
              placeholder="Tu nombre como quieres que te vean"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                Edad
              </label>
              <input
                id="age"
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) || undefined }))}
                className="input-field"
                placeholder="25"
                min={13}
                max={120}
              />
            </div>
            <div>
              <label htmlFor="instagram" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                Instagram
              </label>
              <input
                id="instagram"
                type="text"
                value={profile.socialLinks?.instagram || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  socialLinks: { ...p.socialLinks, instagram: e.target.value }
                }))}
                className="input-field"
                placeholder="@tuusuario"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
              Bio / Presentación
            </label>
            <textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              className="input-field min-h-[100px] resize-y"
              placeholder="Cuéntale al mundo quién eres..."
              maxLength={500}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
              {(profile.bio || '').length}/500
            </p>
          </div>

          <div>
            <label htmlFor="interests" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
              Intereses (separados por coma)
            </label>
            <input
              id="interests"
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              className="input-field"
              placeholder="música, viajes, cocina, deportes"
            />
            {interestsInput && (
              <div className="flex flex-wrap gap-2 mt-2">
                {interestsInput.split(',').map((i, idx) => i.trim() && (
                  <span key={idx} className="badge">{i.trim()}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="text"
                value={profile.socialLinks?.whatsapp || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  socialLinks: { ...p.socialLinks, whatsapp: e.target.value }
                }))}
                className="input-field"
                placeholder="+52 55 1234 5678"
              />
            </div>
            <div>
              <label htmlFor="tiktok" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                TikTok
              </label>
              <input
                id="tiktok"
                type="text"
                value={profile.socialLinks?.tiktok || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  socialLinks: { ...p.socialLinks, tiktok: e.target.value }
                }))}
                className="input-field"
                placeholder="@usuario"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
