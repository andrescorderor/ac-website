/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicButton } from './buttons/DynamicButton';
import { MdLanguage } from 'react-icons/md';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl glass rounded-full transition-all duration-500 ${
        showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform duration-300">
          <img
            src="/assets/ac-website-icon.svg"
            alt="icon"
            className="size-10"
          />
          <p className="font-dm-sans hidden md:block text-sm font-medium tracking-tight text-[var(--black)]">
            Andrés Cordero.
          </p>
        </div>
        <div 
          className="cursor-pointer"
          onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
        >
          <DynamicButton type="full-static" name={t('language.switch')} icon={MdLanguage} style="BLACK" />
        </div>
      </div>
    </nav>
  );
}
