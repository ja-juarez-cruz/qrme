'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            QR
          </div>
          <span className="text-xl font-bold gradient-text">.me</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-secondary text-sm">
            Iniciar sesión
          </Link>
          <Link href="/login?mode=register" className="btn-primary text-sm">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="mb-6">
            <span className="badge text-sm">✨ Tu identidad digital en un QR</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="gradient-text">Conecta</span> con quien
            <br />escanee tu{' '}
            <span className="relative inline-block">
              <span className="gradient-text">QR</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 5 Q25 0 50 5 Q75 10 100 5" stroke="url(#grad)" strokeWidth="2" fill="none"/>
                <defs>
                  <linearGradient id="grad">
                    <stop offset="0%" stopColor="#a78bfa"/>
                    <stop offset="100%" stopColor="#f472b6"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Crea múltiples códigos QR personales. Imprímelos en camisetas, 
            tarjetas o donde quieras. Quien los escanee verá tu perfil con 
            tu estilo único.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login?mode=register" className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
              🚀 Crear mi QR gratis
            </Link>
            <Link href="#como-funciona" className="btn-secondary text-lg px-8 py-4">
              ¿Cómo funciona?
            </Link>
          </div>

          {/* How it works */}
          <div id="como-funciona" className="grid md:grid-cols-3 gap-6 stagger-children">
            <div className="glass-card p-6 text-left glass-card-hover transition-all duration-300">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-lg font-bold mb-2">1. Crea tu perfil</h3>
              <p className="text-[var(--color-text-muted)] text-sm">
                Agrega tu nombre, foto, intereses y links de contacto. 
                Tu perfil base se comparte en todos tus QRs.
              </p>
            </div>

            <div className="glass-card p-6 text-left glass-card-hover transition-all duration-300">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-bold mb-2">2. Elige plantilla</h3>
              <p className="text-[var(--color-text-muted)] text-sm">
                Selecciona una plantilla visual para tu QR. 
                Cada QR puede tener su propio diseño y mensaje.
              </p>
            </div>

            <div className="glass-card p-6 text-left glass-card-hover transition-all duration-300">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-bold mb-2">3. Escanea y conecta</h3>
              <p className="text-[var(--color-text-muted)] text-sm">
                Imprime tu QR en una camiseta o tarjeta. 
                Quien lo escanee verá tu perfil al instante.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        <p>QR.me — Tu identidad en un código · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
