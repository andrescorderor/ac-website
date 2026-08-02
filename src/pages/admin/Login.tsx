import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineArrowLeft } from 'react-icons/hi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/panel', { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailToUse = email.includes('@') ? email : `${email}@admin.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      setError('Acceso denegado. Verifica tu usuario y contraseña.');
      setLoading(false);
    } else {
      navigate('/admin/panel');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F17] transition-colors duration-300 px-4 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-primary)]/10 dark:bg-[var(--vibrant-sky-blue)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--color-info)]/10 dark:bg-[var(--electric-blue)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass border border-gray-200/60 dark:border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full font-syne text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              Admin Portal
            </span>
            <h1 className="font-syne text-2xl font-bold text-gray-900 dark:text-white">
              Iniciar Sesión
            </h1>
            <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
              Ingresa tus credenciales para acceder al panel de control
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-inter text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Usuario / Email
              </label>
              <div className="relative flex items-center">
                <HiOutlineUser className="absolute left-4 text-gray-400 text-base pointer-events-none" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all"
                  placeholder="andresmcorderor"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-4 text-gray-400 text-base pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Entrar al Panel'}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-syne font-bold uppercase tracking-wider text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <HiOutlineArrowLeft className="text-sm" />
              <span>Volver a Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
