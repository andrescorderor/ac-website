import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const spanish = i18n.language?.startsWith('es') ?? true;

  const links = spanish
    ? [
        { to: '/#capabilities', label: 'Capacidades' },
        { to: '/#projects', label: 'Proyectos' },
        { to: '/diagnostico', label: 'Diagnóstico' },
        { to: '/#credentials', label: 'Credenciales' },
      ]
    : [
        { to: '/#capabilities', label: 'Capabilities' },
        { to: '/#projects', label: 'Work' },
        { to: '/diagnostico', label: 'Diagnostic' },
        { to: '/#credentials', label: 'Credentials' },
      ];

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    closeMenu();
    if (target.startsWith('/#')) {
      e.preventDefault();
      const id = target.slice(2);
      if (location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/#${id}`);
      }
    }
  };

  return (
    <header className="portfolio-nav-wrap">
      <nav className="portfolio-nav" aria-label={spanish ? 'Navegación principal' : 'Main navigation'}>
        <Link className="portfolio-brand" to="/" onClick={closeMenu} aria-label="Andrés Cordero — home">
          <SignatureMark size="sm" />
          <span className="brand-label">
            ANDRÉS CORDERO<small>PRODUCT / ENGINEERING</small>
          </span>
        </Link>
        <div className="portfolio-nav-links">
          {links.map((link, index) => (
            <Link key={link.to} to={link.to} onClick={(e) => handleNavClick(e, link.to)}>
              <small>0{index + 1}</small>
              {link.label}
            </Link>
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
          <Link className="nav-contact" to="/#contact" onClick={(e) => handleNavClick(e, '/#contact')}>
            {spanish ? 'Contacto' : 'Contact'}
            <HiOutlineArrowUpRight aria-hidden="true" />
          </Link>
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
          <Link
            key={link.to}
            to={link.to}
            tabIndex={menuOpen ? 0 : -1}
            onClick={(e) => handleNavClick(e, link.to)}
          >
            <span>0{index + 1}</span>
            {link.label}
            <HiOutlineArrowUpRight />
          </Link>
        ))}
        <div className="mobile-nav-footer">
          <SignatureMark size="sm" />
          <span>BUILD / SHIP / LEARN</span>
        </div>
      </div>
    </header>
  );
}
