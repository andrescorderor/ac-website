import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedinIn } from 'react-icons/fa';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import SignatureMark from './SignatureMark';

export default function Footer() {
  const { i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;

  const seoLinks = spanish
    ? [
        { to: '/servicios/desarrollo-software-ia', label: 'Software & IA' },
        { to: '/servicios/digitalizacion-procesos', label: 'Digitalización' },
        { to: '/servicios/pruebas-qa', label: 'Pruebas QA' },
        { to: '/servicios/leon-guanajuato', label: 'León, Gto.' },
        { to: '/diagnostico', label: 'Diagnóstico Gratis' },
      ]
    : [
        { to: '/servicios/desarrollo-software-ia', label: 'Software & AI' },
        { to: '/servicios/digitalizacion-procesos', label: 'Processes' },
        { to: '/servicios/pruebas-qa', label: 'QA & Testing' },
        { to: '/servicios/leon-guanajuato', label: 'León, MX' },
        { to: '/diagnostico', label: 'Free Diagnostic' },
      ];

  return (
    <footer className="portfolio-footer">
      <div className="portfolio-shell footer-main">
        <Link className="portfolio-brand footer-brand" to="/" aria-label="Andrés Cordero — home">
          <SignatureMark size="md" />
          <span className="brand-label">
            ANDRÉS CORDERO<small>PRODUCT / ENGINEERING</small>
          </span>
        </Link>
        <p>
          {spanish
            ? 'Ingeniería, procesos e inteligencia para productos que importan · León, Gto. y todo México.'
            : 'Engineering, process and intelligence for products that matter · León, MX & Remote.'}
        </p>
        <div className="footer-links">
          <a href="https://github.com/andrescorderor" target="_blank" rel="noreferrer" aria-label="GitHub">
            <FaGithub />
          </a>
          <a href="https://www.linkedin.com/in/andresmcorderor/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
          <a href="https://wa.me/524777037913" target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <IoLogoWhatsapp />
          </a>
          <a href="mailto:andresmcorderor@gmail.com" aria-label="Email">
            <IoMdMail />
          </a>
        </div>
      </div>

      <div className="portfolio-shell flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-t border-[var(--site-line)]">
        {seoLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="min-h-[44px] inline-flex items-center font-mono-tech text-[11px] text-[var(--site-muted)] hover:text-[var(--site-accent)] transition-colors cursor-pointer"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="portfolio-shell footer-bottom">
        <span>© {new Date().getFullYear()} Andrés Cordero</span>
        <span>
          {spanish
            ? 'DE LA IDEA A PRODUCCIÓN · LEÓN, MX · BUILD v10.0.0'
            : 'IDEA TO PRODUCTION · LEÓN, MX · BUILD v10.0.0'}
        </span>
        <a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          {spanish ? 'VOLVER ARRIBA' : 'BACK TO TOP'} <HiOutlineArrowUpRight />
        </a>
      </div>
    </footer>
  );
}
