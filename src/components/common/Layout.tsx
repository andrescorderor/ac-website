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
  const [contactTopic, setContactTopic] = useState<string | undefined>(undefined);

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
    const handleOpenContact = (event: Event) => {
      const custom = event as CustomEvent<{ topic?: string }>;
      setContactTopic(custom.detail?.topic);
      setIsContactOpen(true);
    };
    window.addEventListener(CONTACT_MODAL_EVENT, handleOpenContact);
    return () => window.removeEventListener(CONTACT_MODAL_EVENT, handleOpenContact);
  }, []);

  const openBlankContact = () => {
    setContactTopic(undefined);
    setIsContactOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactOpen(false);
    setContactTopic(undefined);
  };

  return (
    <div
      className={`public-site ${
        isDark ? 'public-dark' : 'public-light'
      } overflow-x-hidden w-full min-h-screen flex flex-col`}
    >
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenContact={openBlankContact}
      />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer onOpenContact={openBlankContact} />
      <ContactModal
        isOpen={isContactOpen}
        onClose={handleCloseContact}
        initialTopic={contactTopic}
      />
    </div>
  );
}
