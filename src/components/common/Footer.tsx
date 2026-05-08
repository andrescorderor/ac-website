/* eslint-disable tailwindcss/no-custom-classname */
import { FaGithub, FaLinkedinIn, FaTelegramPlane } from 'react-icons/fa';
import { HiDocumentDownload } from 'react-icons/hi';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';

import { DynamicButton } from './buttons/DynamicButton';
import { ContactButton } from './buttons/ContactButton';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[var(--white)] pt-32 pb-10">
      <div className="container mx-auto px-6 md:px-16 lg:px-36">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-dm-sans text-4xl lg:text-6xl font-bold tracking-tight text-[var(--black)] leading-tight mb-8">
                {t('footer.quote1')} <span className="text-gradient">{t('footer.quote2').replace('"', '')}</span>
              </h2>
              <p className="font-syne text-xl font-bold text-[var(--vibrant-sky-blue)] tracking-[0.2em] uppercase">
                — Peter Drucker
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-4 mt-16">
              {[
                { icon: FaGithub, href: "https://github.com/andrescorderor", label: "GitHub" },
                { icon: FaLinkedinIn, href: "https://www.linkedin.com/in/andresmcorderor/", label: "LinkedIn" },
                { icon: IoMdMail, href: "mailto:andresmcorderor@gmail.com", label: "Email" },
                { icon: IoLogoWhatsapp, href: "https://wa.me/524777037913", label: "WhatsApp" },
                { icon: FaTelegramPlane, href: "https://t.me/corderoandres", label: "Telegram" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-[var(--light-gray)] hover:border-[var(--black)] hover:bg-[var(--soft-light-gray)] transition-all duration-300 font-syne text-xs font-bold uppercase tracking-widest text-[var(--dark-gray)] hover:text-[var(--black)]"
                >
                  <social.icon className="text-lg" />
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <ContactButton />
          </div>
        </div>

        <div className="mt-32 pt-10 border-t border-[var(--light-gray)] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-dm-sans text-sm text-[var(--gray)]">
            © {currentYear} Andrés Cordero • {t('footer.rights')}
          </p>
          <div className="flex items-center gap-8">
            <span className="font-syne text-[10px] font-bold tracking-[0.4em] uppercase text-[var(--gray)]">
              Crafted with Precision
            </span>
            <div className="h-1 w-20 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  );
}
