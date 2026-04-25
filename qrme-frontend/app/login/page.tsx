'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import Link from 'next/link';

function LoginForm() {
  const { login, register, confirmSignUp, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'confirm'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard/qrs');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'confirm') {
        await confirmSignUp(email, code);
        await login(email, password);
        router.push('/dashboard/qrs');
        return;
      }

      if (mode === 'register') {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.push('/dashboard/qrs');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'CONFIRMATION_REQUIRED') {
        setMode('confirm');
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: 'Bienvenido de vuelta',
    register: 'Crea tu cuenta',
    confirm: 'Verifica tu email',
  };

  const subtitles = {
    login: 'Accede a tu dashboard y gestiona tus QRs',
    register: 'Empieza a crear tus códigos QR personales',
    confirm: `Ingresa el código que enviamos a ${email}`,
  };

  const buttonLabels = {
    login: '🔓 Iniciar sesión',
    register: '🚀 Crear cuenta',
    confirm: '✅ Verificar y entrar',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-8 w-full max-w-md animate-fade-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            QR
          </div>
          <span className="text-2xl font-bold gradient-text">.me</span>
        </Link>

        <h1 className="text-2xl font-bold text-center mb-2">{titles[mode]}</h1>
        <p className="text-[var(--color-text-muted)] text-center mb-8 text-sm">{subtitles[mode]}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'confirm' && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1.5 text-[var(--color-text-muted)]">
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field text-center tracking-[0.5em] text-lg"
                placeholder="123456"
                required
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center disabled:opacity-50"
          >
            {loading ? '⏳ Cargando...' : buttonLabels[mode]}
          </button>
        </form>

        {mode !== 'confirm' && (
          <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-[var(--color-primary-light)] hover:underline font-medium"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-[var(--color-primary-light)] hover:underline font-medium"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--color-text-muted)]">Cargando...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
