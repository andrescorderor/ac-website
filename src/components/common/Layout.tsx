import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import ContactModal, { CONTACT_MODAL_EVENT } from './modals/ContactModal';

const PUBLIC_THEME_KEY = 'ac_public_theme';

function getInitialPublicTheme(): boolean {
  try {
    const saved = localStorage.getItem(PUBLIC_THEME_KEY);
    if (saved) return saved === 'dark';
  } catch {
    // Ignora errores de almacenamiento (modo privado)
  }
  return false; // Tema arquitectónico claro por defecto
}

export default function Layout() {
  const [isDark, setIsDark] = useState<boolean>(getInitialPublicTheme);
  const [isContactOpen, setIsContactOpen] = useState(false);

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
    const handleOpenContact = () => setIsContactOpen(true);
    window.addEventListener(CONTACT_MODAL_EVENT, handleOpenContact);
    return () => window.removeEventListener(CONTACT_MODAL_EVENT, handleOpenContact);
  }, []);

  return (
    <div
      className={`public-site ${
        isDark ? 'public-dark' : 'public-light'
      } overflow-x-hidden w-full min-h-screen flex flex-col`}
    >
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenContact={() => setIsContactOpen(true)}
      />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer onOpenContact={() => setIsContactOpen(true)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
