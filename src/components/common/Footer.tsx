import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedinIn } from 'react-icons/fa';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import SignatureMark from './SignatureMark';

export default function Footer() {
  const { i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;
  return (
    <footer className="portfolio-footer">
      <div className="portfolio-shell footer-main">
        <a className="portfolio-brand footer-brand" href="#top" aria-label="Andrés Cordero — home">
          <SignatureMark size="md" />
          <span className="brand-label">
            ANDRÉS CORDERO<small>PRODUCT / ENGINEERING</small>
          </span>
        </a>
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
      <div className="portfolio-shell footer-bottom">
        <span>© {new Date().getFullYear()} Andrés Cordero</span>
        <span>
          {spanish
            ? 'DE LA IDEA A PRODUCCIÓN · LEÓN, MX · BUILD v9.2.0'
            : 'IDEA TO PRODUCTION · LEÓN, MX · BUILD v9.2.0'}
        </span>
        <a href="#top">
          {spanish ? 'VOLVER ARRIBA' : 'BACK TO TOP'} <HiOutlineArrowUpRight />
        </a>
      </div>
    </footer>
  );
}
