import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  tiktok: '🎵',
  twitter: '🐦',
  snapchat: '👻',
  spotify: '🎧',
  youtube: '▶️',
};

// Per-template visual theme (accent color, glow, bg gradient, photo border gradient)
const TEMPLATE_THEMES: Record<string, {
  accent: string;
  accentRgb: string;
  bgGradient: string;
  photoBorder: string;
  badgeBg: string;
  scanEmoji: string;
}> = {
  'social-v1': {
    accent: '#c084fc',
    accentRgb: '192, 132, 252',
    bgGradient: 'linear-gradient(135deg, #0f0c1a 0%, #1a1528 40%, #15112a 100%)',
    photoBorder: 'linear-gradient(135deg, #c084fc, #f472b6)',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    scanEmoji: '👀',
  },
  'social-friends-v1': {
    accent: '#fb923c',
    accentRgb: '251, 146, 60',
    bgGradient: 'linear-gradient(135deg, #1a0e07 0%, #1f1508 40%, #140e04 100%)',
    photoBorder: 'linear-gradient(135deg, #fb923c, #fbbf24)',
    badgeBg: 'rgba(251, 146, 60, 0.15)',
    scanEmoji: '🤝',
  },
  'social-romance-v1': {
    accent: '#f472b6',
    accentRgb: '244, 114, 182',
    bgGradient: 'linear-gradient(135deg, #1a0812 0%, #1f0a18 40%, #150610 100%)',
    photoBorder: 'linear-gradient(135deg, #f472b6, #fb7185)',
    badgeBg: 'rgba(244, 114, 182, 0.15)',
    scanEmoji: '💕',
  },
  'social-fiesta-v1': {
    accent: '#4ade80',
    accentRgb: '74, 222, 128',
    bgGradient: 'linear-gradient(135deg, #071a0e 0%, #081f12 40%, #05150a 100%)',
    photoBorder: 'linear-gradient(135deg, #4ade80, #facc15)',
    badgeBg: 'rgba(74, 222, 128, 0.15)',
    scanEmoji: '🎉',
  },
};

const DEFAULT_THEME = TEMPLATE_THEMES['social-v1'];

export async function POST(req: Request) {
  try {
    const { profile, qr } = await req.json();
    const theme = TEMPLATE_THEMES[qr.templateId] ?? DEFAULT_THEME;

    const socialEntries = Object.entries(profile.socialLinks || {}).filter(([, v]) => v);

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
          <a href="${href}" target="_blank" rel="noopener noreferrer"
            style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);text-decoration:none;font-size:0.875rem;color:inherit;transition:all 0.2s;">
            <span>${icon}</span>
            <span style="color:#a0a0b8;">${platform}</span>
          </a>`;
      }).join('');

      socialLinksHtml = `
        <div style="margin-bottom:1.5rem;">
          <p style="text-align:center;font-size:0.65rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem;">Encuéntrame en</p>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.75rem;">${linksHtml}</div>
        </div>`;
    }

    let interestsHtml = '';
    if (profile.interests && profile.interests.length > 0) {
      const badges = profile.interests.map((interest: string) =>
        `<span style="padding:0.25rem 0.75rem;border-radius:9999px;background:${theme.badgeBg};border:1px solid rgba(255,255,255,0.1);font-size:0.75rem;color:#d4d4e8;">${interest}</span>`
      ).join('');
      interestsHtml = `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem;margin-bottom:1.5rem;">${badges}</div>`;
    }

    const bioHtml = profile.bio
      ? `<p style="text-align:center;color:#8a8aaa;font-size:0.875rem;margin-bottom:1.5rem;line-height:1.6;">${profile.bio}</p>`
      : '';

    const ageHtml = profile.age
      ? `<div style="position:absolute;bottom:-4px;right:-4px;background:${theme.photoBorder.includes(',') ? theme.accent : theme.accent};color:white;font-size:0.65rem;font-weight:700;border-radius:9999px;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;border:2px solid #1a1528;">${profile.age}</div>`
      : '';

    const photoHtml = profile.photoUrl
      ? `<img src="${profile.photoUrl}" alt="${profile.displayName || 'Foto'}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:linear-gradient(135deg,rgba(${theme.accentRgb},0.2),rgba(${theme.accentRgb},0.05));">👤</div>`;

    const taglineHtml = qr.tagline
      ? `<p style="text-align:center;font-size:1.125rem;font-weight:600;color:${theme.accent};margin-bottom:1rem;">&ldquo;${qr.tagline}&rdquo;</p>`
      : '';

    const componentHtml = `
      <div style="max-width:28rem;width:100%;margin:2rem auto;padding:2rem;border-radius:1.5rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(20px);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

        <div style="display:flex;justify-content:center;margin-bottom:1.5rem;">
          <div style="position:relative;">
            <div style="width:7rem;height:7rem;border-radius:9999px;overflow:hidden;padding:3px;background:${theme.photoBorder};">
              <div style="width:100%;height:100%;border-radius:9999px;overflow:hidden;">${photoHtml}</div>
            </div>
            ${ageHtml}
          </div>
        </div>

        <h1 style="font-size:1.875rem;font-weight:800;text-align:center;background:linear-gradient(135deg,#e8d5ff,${theme.accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:0.5rem;">
          ${profile.displayName || 'Anónimo'}
        </h1>

        ${taglineHtml}
        ${bioHtml}
        ${interestsHtml}
        ${socialLinksHtml}

        <div style="text-align:center;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="font-size:0.75rem;color:#6b6b8a;">
            ${theme.scanEmoji} <span style="color:${theme.accent};font-weight:600;">${qr.scanCount ?? 1}</span> personas han visto este perfil
          </p>
        </div>

        <div style="text-align:center;margin-top:1rem;">
          <p style="font-size:0.65rem;color:rgba(107,107,138,0.5);">
            Hecho con <span style="background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700;">QR.me</span>
          </p>
        </div>
      </div>`;

    let css = '';
    try {
      css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf-8');
    } catch {
      // globals.css optional — inline styles cover the layout
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${qr.label || 'QR.me'}</title>
  <style>
    ${css}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e8e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme.bgGradient};
      padding: 1rem;
    }
    a:hover { opacity: 0.8; }
  </style>
</head>
<body>
  ${componentHtml}
</body>
</html>`;

    return NextResponse.json({ html: fullHtml });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json({ error: 'Failed to generate HTML' }, { status: 500 });
  }
}
