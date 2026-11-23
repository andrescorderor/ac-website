import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MdLanguage } from 'react-icons/md';
import { HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { DynamicButton } from './buttons/DynamicButton';

interface HeaderProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function Header({ isDark = false, onToggleTheme }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  const isSpanish = i18n.language?.startsWith('es');

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < 80) {
        setShowNavbar(true);
        lastScrollY.current = y;
        return;
      }
      if (Math.abs(delta) < 8) return;
      setShowNavbar(delta < 0);
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress, transformOrigin: '0 50%' }}
        className="fixed top-0 inset-x-0 h-[3px] z-[60] bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] pointer-events-none"
      />
      <nav
        aria-label={isSpanish ? 'Navegación principal' : 'Main navigation'}
        onFocusCapture={() => setShowNavbar(true)}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl glass rounded-full transition-all duration-500 motion-reduce:transition-none ${
          showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
          <Link
            to="/"
            aria-label={isSpanish ? 'Ir al inicio' : 'Go to home'}
            className="flex items-center gap-4 min-h-[44px] hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <img src="/assets/ac-website-icon.svg" alt="" className="size-10" />
            <span className="font-dm-sans hidden md:block text-sm font-medium tracking-tight text-[var(--black)]">
              Andrés Cordero.
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <DynamicButton
                type="icon-only"
                name={
                  isDark
                    ? isSpanish ? 'Cambiar a modo claro' : 'Switch to light mode'
                    : isSpanish ? 'Cambiar a modo oscuro' : 'Switch to dark mode'
                }
                icon={isDark ? HiOutlineSun : HiOutlineMoon}
                style="WHITE"
                onClick={onToggleTheme}
              />
            )}
            <DynamicButton
              type="full-static"
              name={t('language.switch')}
              icon={MdLanguage}
              style="BLACK"
              onClick={() => i18n.changeLanguage(isSpanish ? 'en' : 'es')}
              ariaLabel={isSpanish ? 'Cambiar idioma' : 'Change language'}
            />
            <DynamicButton
              type="icon-only"
              name={isSpanish ? 'Acceso administrador' : 'Admin access'}
              title={isSpanish ? 'Acceso administrador' : 'Admin access'}
              icon={HiOutlineShieldCheck}
              style="WHITE"
              onClick={() => navigate('/admin')}
            />
          </div>
        </div>
      </nav>
    </>
  );
}
