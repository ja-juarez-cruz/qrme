export function generateHtml(profile: Record<string, any>, qr: Record<string, any>): string {
  const SOCIAL_ICONS: Record<string, string> = {
    instagram: '📸',
    whatsapp: '💬',
    tiktok: '🎵',
    twitter: '🐦',
    snapchat: '👻',
    spotify: '🎧',
    youtube: '▶️',
  };

  const socialEntries = Object.entries(profile.socialLinks || {}).filter(([, v]) => v);
  
  // Generate social links HTML
  let socialLinksHtml = '';
  if (socialEntries.length > 0) {
    const linksHtml = socialEntries.map(([platform, value]) => {
      const icon = SOCIAL_ICONS[platform] || '🔗';
      let href = String(value);
      if (platform === 'instagram' && !href.startsWith('http')) {
        href = `https://instagram.com/${href.replace('@', '')}`;
      } else if (platform === 'tiktok' && !href.startsWith('http')) {
        href = `https://tiktok.com/${href.replace('@', '')}`;
      } else if (platform === 'whatsapp' && !href.startsWith('http')) {
        href = `https://wa.me/${href.replace(/[^0-9+]/g, '')}`;
      }
      return `
        <a href="${href}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-surface-lighter)] hover:border-[var(--color-primary)]/50 transition-all hover:scale-105 text-sm" style="text-decoration: none;">
          <span>${icon}</span>
          <span class="text-[var(--color-text-muted)]">${platform}</span>
        </a>
      `;
    }).join('');
    
    socialLinksHtml = `
      <div class="space-y-2 mb-6">
        <p class="text-center text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Encuéntrame en</p>
        <div class="flex flex-wrap justify-center gap-3">
          ${linksHtml}
        </div>
      </div>
    `;
  }

  // Generate interests HTML
  let interestsHtml = '';
  if (profile.interests && profile.interests.length > 0) {
    const badgesHtml = profile.interests.map((interest: string, i: number) => `
      <span class="badge transition-transform hover:scale-110" style="animation-delay: ${i * 0.05}s">
        ${interest}
      </span>
    `).join('');
    interestsHtml = `
      <div class="flex flex-wrap justify-center gap-2 mb-6">
        ${badgesHtml}
      </div>
    `;
  }

  // Generate main component HTML
  const componentHtml = `
    <div class="social-card max-w-md mx-auto p-8 animate-fade-in" style="width: 100%; max-width: 28rem;">
      <div class="flex justify-center mb-6">
        <div class="relative">
          <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--color-primary)]/50 animate-pulse-glow" style="width: 7rem; height: 7rem;">
            ${profile.photoUrl ? `
              <img src="${profile.photoUrl}" alt="${profile.displayName || 'Foto'}" class="w-full h-full object-cover" />
            ` : `
              <div class="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-4xl">👤</div>
            `}
          </div>
          ${profile.age ? `
            <div class="absolute -bottom-1 -right-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-[var(--color-surface)]">
              ${profile.age}
            </div>
          ` : ''}
        </div>
      </div>

      <h1 class="text-3xl font-extrabold text-center gradient-text mb-2">
        ${profile.displayName || 'Anónimo'}
      </h1>

      ${qr.tagline ? `
        <p class="text-center text-xl font-semibold text-[var(--color-accent)] mb-4">
          &ldquo;${qr.tagline}&rdquo;
        </p>
      ` : ''}

      ${profile.bio ? `
        <p class="text-center text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">
          ${profile.bio}
        </p>
      ` : ''}

      ${interestsHtml}
      ${socialLinksHtml}

      <div class="text-center pt-4 border-t border-[var(--color-surface-lighter)]">
        <p class="text-xs text-[var(--color-text-muted)]">
          👀 <span class="text-[var(--color-primary-light)] font-semibold">1</span> personas han visto este perfil
        </p>
      </div>

      <div class="text-center mt-4">
        <p class="text-xs text-[var(--color-text-muted)]/50">
          Hecho con <span class="gradient-text font-bold">QR.me</span>
        </p>
      </div>
    </div>
  `;

  const fullHtml = `
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${qr.label || 'QR.me'}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    --color-primary: #7c3aed;
    --color-primary-light: #a78bfa;
    --color-primary-dark: #5b21b6;
    --color-accent: #f472b6;
    --color-surface: #1e1b2e;
    --color-surface-light: #2d2a3e;
    --color-surface-lighter: #3d3a4e;
    --color-text: #f1f0f5;
    --color-text-muted: #a09bb0;
  }
  body {
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c1a 0%, #1a1528 40%, #15112a 100%);
    color: var(--color-text);
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .social-card {
    background: linear-gradient(160deg, #1a1035 0%, #2d1b69 50%, #1a1035 100%);
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 1.5rem;
    position: relative;
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  .gradient-text {
    background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    background: rgba(124, 58, 237, 0.15);
    color: var(--color-primary-light);
    border: 1px solid rgba(124, 58, 237, 0.25);
  }
</style>
</head>
<body>
${componentHtml}
</body>
</html>
  `;

  return fullHtml;
}
