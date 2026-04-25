'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle Cognito OAuth callback
    // In production, extract tokens from URL hash/query params
    // For now, redirect to dashboard
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Exchange code for tokens via Cognito token endpoint
      // For MVP, just redirect
      console.log('Auth callback with code:', code);
    }

    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center animate-fade-in">
        <div className="text-4xl mb-4 animate-pulse">🔐</div>
        <p className="text-[var(--color-text-muted)]">Procesando autenticación...</p>
      </div>
    </div>
  );
}
