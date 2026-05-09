import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      setError('Acceso denegado.');
      setLoading(false);
    } else {
      navigate('/admin/panel');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-xs w-full px-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-xs text-gray-400 font-mono mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm py-2 border-b border-gray-100 focus:border-gray-400 outline-none transition-colors"
              placeholder="id"
              required
            />
          </div>

          <div className="space-y-1">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm py-2 border-b border-gray-100 focus:border-gray-400 outline-none transition-colors"
              placeholder="pass"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-800 transition-colors uppercase tracking-widest text-left"
          >
            {loading ? '...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
