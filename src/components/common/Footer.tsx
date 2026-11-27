import { FaGithub, FaLinkedinIn } from 'react-icons/fa';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { HiOutlineDownload } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import SignatureMark from './SignatureMark';

interface FooterProps {
  onOpenContact?: () => void;
}

export default function Footer({ onOpenContact }: FooterProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[var(--pub-surface)] border-t border-[var(--pub-border)] pt-16 pb-10">
      <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[var(--pub-border)]">
          {/* Brand & Quote */}
          <div className="lg:col-span-7 space-y-6">
            <SignatureMark size="md" showWordmark showRoleTag />

            <h2 className="font-dm-sans text-2xl sm:text-4xl font-bold tracking-tight text-[var(--black)] leading-tight max-w-2xl">
              {t('footer.quote1')}{' '}
              <span className="text-gradient">{t('footer.quote2').replace('"', '')}</span>
            </h2>
            <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[var(--vibrant-sky-blue)]">
              — Peter Drucker
            </p>
          </div>

          {/* Direct Actions & Socials */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--dark-gray)] block">
                {isSpanish ? '// Canales Directos' : '// Direct Channels'}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {onOpenContact && (
                  <button
                    type="button"
                    onClick={onOpenContact}
                    className="inline-flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <span>{t('footer.contact_button')}</span>
                    <HiOutlineArrowUpRight className="text-base" />
                  </button>
                )}

                <a
                  href="/assets/Resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[var(--pub-bg)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--black)] font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <HiOutlineDownload className="text-base text-[var(--vibrant-sky-blue)]" />
                  <span>{isSpanish ? 'Descargar CV' : 'Resume PDF'}</span>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[
                { icon: FaGithub, href: 'https://github.com/andrescorderor', label: 'GitHub' },
                { icon: FaLinkedinIn, href: 'https://www.linkedin.com/in/andresmcorderor/', label: 'LinkedIn' },
                { icon: IoMdMail, href: 'mailto:andresmcorderor@gmail.com', label: 'Email' },
                { icon: IoLogoWhatsapp, href: 'https://wa.me/524777037913', label: 'WhatsApp' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl bg-[var(--pub-bg)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--dark-gray)] hover:text-[var(--black)] font-mono-tech text-xs font-medium transition-all cursor-pointer"
                >
                  <social.icon className="text-sm text-[var(--vibrant-sky-blue)]" />
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Metadata Row */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p className="font-inter text-[var(--dark-gray)]">
            © {currentYear} Andrés Cordero · {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--dark-gray)]">
              {t('footer.crafted')} · BUILD v9.0.0
            </span>
            <span className="h-1.5 w-14 rounded-full bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
