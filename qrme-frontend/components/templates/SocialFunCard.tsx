/**
 * QR.me — SocialFunCard Template Component.
 * Fun, vibrant card for social events. Shows name, tagline, age,
 * photo, interests, and social links.
 */

interface SocialFunCardProps {
  profile: {
    displayName?: string;
    age?: number;
    bio?: string;
    interests?: string[];
    photoUrl?: string;
    socialLinks?: Record<string, string>;
  };
  qr: {
    tagline?: string;
    scanCount?: number;
  };
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  tiktok: '🎵',
  twitter: '🐦',
  snapchat: '👻',
  spotify: '🎧',
  youtube: '▶️',
};

export default function SocialFunCard({ profile, qr }: SocialFunCardProps) {
  const socialEntries = Object.entries(profile.socialLinks || {}).filter(([, v]) => v);

  return (
    <div className="social-card max-w-md mx-auto p-8 animate-fade-in">
      {/* Photo */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--color-primary)]/50 animate-pulse-glow">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName || 'Foto'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-4xl">
                👤
              </div>
            )}
          </div>
          {profile.age && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-[var(--color-surface)]">
              {profile.age}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h1 className="text-3xl font-extrabold text-center gradient-text mb-2">
        {profile.displayName || 'Anónimo'}
      </h1>

      {/* Tagline */}
      {qr.tagline && (
        <p className="text-center text-xl font-semibold text-[var(--color-accent)] mb-4">
          &ldquo;{qr.tagline}&rdquo;
        </p>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-center text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {profile.interests.map((interest, i) => (
            <span
              key={i}
              className="badge transition-transform hover:scale-110"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      {socialEntries.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-center text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Encuéntrame en
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {socialEntries.map(([platform, value]) => {
              const icon = SOCIAL_ICONS[platform] || '🔗';
              let href = value;
              if (platform === 'instagram' && !value.startsWith('http')) {
                href = `https://instagram.com/${value.replace('@', '')}`;
              } else if (platform === 'tiktok' && !value.startsWith('http')) {
                href = `https://tiktok.com/${value.replace('@', '')}`;
              } else if (platform === 'whatsapp' && !value.startsWith('http')) {
                href = `https://wa.me/${value.replace(/[^0-9+]/g, '')}`;
              }

              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/50 transition-all hover:scale-105 text-sm"
                >
                  <span>{icon}</span>
                  <span className="text-[var(--color-text-muted)]">{platform}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Scan counter */}
      <div className="text-center pt-4 border-t border-[var(--color-surface-lighter)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          👀 <span className="text-[var(--color-primary-light)] font-semibold">{qr.scanCount || 0}</span> personas han visto este perfil
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <p className="text-xs text-[var(--color-text-muted)]/50">
          Hecho con <span className="gradient-text font-bold">QR.me</span>
        </p>
      </div>
    </div>
  );
}
