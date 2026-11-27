import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import {
  HiOutlineShieldCheck,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineMenuAlt3,
  HiX,
  HiOutlineMail,
} from 'react-icons/hi';
import { MdLanguage } from 'react-icons/md';
import SignatureMark from './SignatureMark';

interface HeaderProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenContact?: () => void;
}

export default function Header({ isDark = false, onToggleTheme, onOpenContact }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const isSpanish = i18n.language?.startsWith('es');

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const navItems = [
    { id: 'services-section', label: isSpanish ? 'Soluciones' : 'Solutions' },
    { id: 'capabilities-section', label: isSpanish ? 'Capacidades' : 'Capabilities' },
    { id: 'experience-section', label: isSpanish ? 'Trayectoria' : 'Path' },
    { id: 'portfolio-section', label: isSpanish ? 'Proyectos' : 'Projects' },
    { id: 'faq-section', label: 'FAQ' },
  ];

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

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  };

  return (
    <>
      {/* Scroll Telemetry Progress Bar */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress, transformOrigin: '0 50%' }}
        className="fixed top-0 inset-x-0 h-[3px] z-[60] bg-gradient-to-r from-[var(--vibrant-sky-blue)] via-[var(--magenta-pink)] to-[var(--vibrant-sky-blue)] pointer-events-none"
      />

      <header
        onFocusCapture={() => setShowNavbar(true)}
        className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl transition-all duration-400 motion-reduce:transition-none ${
          showNavbar || isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <nav
          aria-label={isSpanish ? 'Navegación principal' : 'Main navigation'}
          className="glass rounded-2xl px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3"
        >
          {/* Brand Signature */}
          <Link
            to="/"
            aria-label={isSpanish ? 'Ir al inicio' : 'Go to home'}
            className="flex items-center min-h-[44px] cursor-pointer shrink-0"
          >
            <SignatureMark size="sm" showWordmark showRoleTag />
          </Link>

          {/* Desktop Navigation Anchors */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--pub-surface-muted)]/70 border border-[var(--pub-border)]">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="px-3 min-h-[36px] rounded-lg font-mono-tech text-[11px] font-medium text-[var(--dark-gray)] hover:text-[var(--black)] hover:bg-[var(--pub-surface)] transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenContact && (
              <button
                type="button"
                onClick={onOpenContact}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <HiOutlineMail className="text-sm" />
                <span>{isSpanish ? 'Contacto' : 'Contact'}</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={
                  isDark
                    ? isSpanish
                      ? 'Cambiar a modo claro'
                      : 'Switch to light mode'
                    : isSpanish
                    ? 'Cambiar a modo oscuro'
                    : 'Switch to dark mode'
                }
                title={
                  isDark
                    ? isSpanish
                      ? 'Modo claro'
                      : 'Light mode'
                    : isSpanish
                    ? 'Modo oscuro'
                    : 'Dark mode'
                }
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--black)] flex items-center justify-center transition-all cursor-pointer"
              >
                {isDark ? (
                  <HiOutlineSun className="text-lg text-amber-400" />
                ) : (
                  <HiOutlineMoon className="text-lg text-[var(--dark-gray)]" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => i18n.changeLanguage(isSpanish ? 'en' : 'es')}
              aria-label={isSpanish ? 'Cambiar idioma a inglés' : 'Switch language to Spanish'}
              className="px-3 min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--black)] font-mono-tech text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MdLanguage className="text-base text-[var(--vibrant-sky-blue)]" />
              <span>{t('language.switch')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              aria-label={isSpanish ? 'Acceso administrador' : 'Admin access'}
              title={isSpanish ? 'Acceso administrador' : 'Admin access'}
              className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--dark-gray)] hover:text-[var(--black)] items-center justify-center transition-all cursor-pointer"
            >
              <HiOutlineShieldCheck className="text-lg" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isSpanish ? 'Menú de navegación' : 'Navigation menu'}
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] text-[var(--black)] flex items-center justify-center transition-all cursor-pointer"
            >
              {isMobileMenuOpen ? <HiX className="text-xl" /> : <HiOutlineMenuAlt3 className="text-xl" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden mt-2 glass rounded-2xl p-3 space-y-1.5 shadow-xl"
            >
              {navItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl flex items-center justify-between text-left font-dm-sans text-sm font-medium text-[var(--black)] hover:bg-[var(--pub-surface-muted)] transition-colors cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="font-mono-tech text-[11px] text-[var(--vibrant-sky-blue)]">
                    0{idx + 2}
                  </span>
                </button>
              ))}

              <div className="pt-2 mt-2 border-t border-[var(--pub-border)] grid grid-cols-2 gap-2">
                {onOpenContact && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenContact();
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HiOutlineMail className="text-base" />
                    <span>{isSpanish ? 'Contactar' : 'Contact'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-[var(--pub-surface-muted)] text-[var(--black)] border border-[var(--pub-border)] font-syne text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HiOutlineShieldCheck className="text-base text-[var(--vibrant-sky-blue)]" />
                  <span>Admin</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
