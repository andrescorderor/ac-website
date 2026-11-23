import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';

const PUBLIC_THEME_KEY = 'public_theme';

function getInitialPublicTheme(): boolean {
  try {
    const saved = localStorage.getItem(PUBLIC_THEME_KEY);
    if (saved) return saved === 'dark';
  } catch {
    // Ignora errores de almacenamiento (modo privado)
  }
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export default function Layout() {
  const [isDark, setIsDark] = useState<boolean>(getInitialPublicTheme);

  useEffect(() => {
    try {
      localStorage.setItem(PUBLIC_THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignora errores de almacenamiento
    }
  }, [isDark]);

  return (
    <div
      className={`public-site ${
        isDark ? 'public-dark' : 'public-light'
      } overflow-x-hidden w-full min-h-screen flex flex-col`}
    >
      <Header isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
