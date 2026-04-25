import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define SOCIAL_ICONS matching the React component
const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  tiktok: '🎵',
  twitter: '🐦',
  snapchat: '👻',
  spotify: '🎧',
  youtube: '▶️',
};

export async function POST(req: Request) {
  try {
    const { profile, qr } = await req.json();

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

    let css = '';
    try {
      css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf-8');
    } catch (e) {
      console.warn('Could not load globals.css');
    }

    const fullHtml = `
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${qr.label || 'QR.me'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${css}
    body {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0c1a 0%, #1a1528 40%, #15112a 100%);
    }
    .social-card {
      margin-top: 2rem;
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  ${componentHtml}
</body>
</html>
    `;

    return NextResponse.json({ html: fullHtml });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json({ error: 'Failed to generate HTML' }, { status: 500 });
  }
}
