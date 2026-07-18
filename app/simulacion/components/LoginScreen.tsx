'use client';

import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (user: string, pass: string) => Promise<string | null>; // returns error message or null on success
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const errMsg = await onLogin(username.trim().toLowerCase(), password);
    if (errMsg) {
      setError(errMsg);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{
        background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.10) 0%, transparent 40%), linear-gradient(135deg, #0E3B25 0%, #1C6B45 45%, #2FA76B 75%, #4FC98A 100%)'
      }}
    >
      <div className="w-full max-w-sm bg-[rgba(15,30,22,0.55)] border border-white/16 backdrop-blur-xl rounded-[18px] p-[34px] pb-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#4FC98A] to-[#1C6B45] flex items-center justify-center mb-4 shadow-[0_6px_18px_rgba(47,167,107,0.45)]">
          <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13Z" fill="#08170F" />
          </svg>
        </div>
        <h1 className="font-['Space_Grotesk'] text-[22px] m-0 mb-1 text-[#F1FBF4]">Control de Riego</h1>
        <p className="text-[#BFE4CC] text-[13px] m-0 mb-6">Ingresa tus credenciales para acceder al panel del sistema ESP32.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-[.06em] text-[#BFE4CC] mb-1.5">Usuario o Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={loading}
              className="w-full bg-white/8 border border-white/22 text-[#F1FBF4] px-3 py-[11px] rounded-lg font-['Inter'] text-sm outline-none transition-[border-color,background] duration-150 placeholder:text-[#8FBFA0] focus:border-[#4FC98A] focus:bg-white/12 disabled:opacity-50"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-[.06em] text-[#BFE4CC] mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-white/8 border border-white/22 text-[#F1FBF4] px-3 py-[11px] pr-[42px] rounded-lg font-['Inter'] text-sm outline-none transition-[border-color,background] duration-150 placeholder:text-[#8FBFA0] focus:border-[#4FC98A] focus:bg-white/12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-lg text-[#BFE4CC] hover:bg-white/12 hover:text-[#F1FBF4]"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? (
                  <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 7 11 7a20.4 20.4 0 0 1-3.22 4.32M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/18 border border-red-500/50 text-[#FFC9C4] text-[12.5px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 py-3 px-4 rounded-lg border-none bg-gradient-to-br from-[#4FC98A] to-[#1C6B45] text-[#08170F] font-['Space_Grotesk'] font-bold text-sm cursor-pointer transition-[filter,transform] duration-100 hover:brightness-105 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-4.5 pt-3.5 border-t border-white/18 border-dashed text-center">
          <p className="text-[#8FBFA0] text-[12px] m-0">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-[#4FC98A] font-medium hover:text-[#59C36A] transition-colors no-underline">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
