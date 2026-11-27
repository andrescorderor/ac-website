import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowUpRight,
} from 'react-icons/hi2';
import SignatureMark from './SignatureMark';

interface HeaderProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function Header({ isDark = false, onToggleTheme }: HeaderProps) {
  const { i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const spanish = i18n.language?.startsWith('es') ?? true;
  const links = spanish
    ? [
        { href: '#capabilities', label: 'Capacidades' },
        { href: '#experience', label: 'Experiencia' },
        { href: '#projects', label: 'Proyectos' },
        { href: '#credentials', label: 'Credenciales' },
      ]
    : [
        { href: '#capabilities', label: 'Capabilities' },
        { href: '#experience', label: 'Experience' },
        { href: '#projects', label: 'Work' },
        { href: '#credentials', label: 'Credentials' },
      ];
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="portfolio-nav-wrap">
      <nav className="portfolio-nav" aria-label={spanish ? 'Navegación principal' : 'Main navigation'}>
        <a className="portfolio-brand" href="#top" onClick={closeMenu} aria-label="Andrés Cordero — home">
          <SignatureMark size="sm" />
          <span className="brand-label">
            ANDRÉS CORDERO<small>PRODUCT / ENGINEERING</small>
          </span>
        </a>
        <div className="portfolio-nav-links">
          {links.map((link, index) => (
            <a key={link.href} href={link.href}>
              <small>0{index + 1}</small>
              {link.label}
            </a>
          ))}
        </div>
        <div className="portfolio-nav-controls">
          <button
            type="button"
            className="nav-control language-control"
            aria-label={spanish ? 'Switch language to English' : 'Cambiar idioma a español'}
            onClick={() => i18n.changeLanguage(spanish ? 'en' : 'es')}
          >
            {spanish ? 'EN' : 'ES'}
          </button>
          {onToggleTheme && (
            <button
              type="button"
              className="nav-control theme-control"
              aria-label={
                isDark
                  ? spanish
                    ? 'Cambiar a modo claro'
                    : 'Switch to light mode'
                  : spanish
                  ? 'Cambiar a modo oscuro'
                  : 'Switch to dark mode'
              }
              onClick={onToggleTheme}
            >
              {isDark ? <HiOutlineSun aria-hidden="true" /> : <HiOutlineMoon aria-hidden="true" />}
            </button>
          )}
          <a className="nav-contact" href="#contact" onClick={closeMenu}>
            {spanish ? 'Contacto' : 'Contact'}
            <HiOutlineArrowUpRight aria-hidden="true" />
          </a>
          <button
            className="nav-menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              menuOpen
                ? spanish
                  ? 'Cerrar menú'
                  : 'Close menu'
                : spanish
                ? 'Abrir menú'
                : 'Open menu'
            }
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
          </button>
        </div>
      </nav>
      <div id="mobile-navigation" className={`mobile-navigation ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <span className="mobile-nav-label">
          {spanish ? 'NAVEGACIÓN' : 'NAVIGATION'} / 0{links.length}
        </span>
        {links.map((link, index) => (
          <a key={link.href} href={link.href} tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>
            <span>0{index + 1}</span>
            {link.label}
            <HiOutlineArrowUpRight />
          </a>
        ))}
        <div className="mobile-nav-footer">
          <SignatureMark size="sm" />
          <span>BUILD / SHIP / LEARN</span>
        </div>
      </div>
    </header>
  );
}
