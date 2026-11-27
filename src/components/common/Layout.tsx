import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import ScopeAssistantWidget from './ScopeAssistantWidget';

const PUBLIC_THEME_KEY = 'ac_public_theme';

function getInitialPublicTheme(): boolean {
  try {
    const saved = localStorage.getItem(PUBLIC_THEME_KEY);
    if (saved) return saved === 'dark';
  } catch {
    // Ignora errores de almacenamiento (modo privado)
  }
  return false; // Tema editorial claro por defecto en portafolio público
}

export default function Layout() {
  const [isDark, setIsDark] = useState<boolean>(getInitialPublicTheme);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(PUBLIC_THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignora errores de almacenamiento
    }
    const root = document.documentElement;
    root.classList.add('public-site');
    root.classList.toggle('public-dark', isDark);
    root.classList.toggle('public-light', !isDark);

    return () => {
      root.classList.remove('public-site', 'public-dark', 'public-light');
    };
  }, [isDark]);

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

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
      <ScopeAssistantWidget />
    </div>
  );
}
