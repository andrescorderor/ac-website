/* eslint-disable tailwindcss/no-custom-classname */
import { FaGithub, FaLinkedinIn, FaTelegramPlane } from 'react-icons/fa';
import { HiDocumentDownload } from 'react-icons/hi';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';

import { DynamicButton } from './buttons/DynamicButton';
import { ContactButton } from './buttons/ContactButton';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[var(--white)] ">
      <div className="flex flex-col lg:flex-row justify-between p-6 md:p-16 lg:p-36 gap-12 lg:gap-0">
        <div>
          <div className="pointer-events-none flex flex-col">
            <p className="font-dm-sans font-light tracking-tight mb-4 text-2xl lg:text-4xl leading-snug text-[var(--dark-gray)]">
              {t('footer.quote1')}
              <br />
              {t('footer.quote2')}
            </p>
            <p className="font-syne text-start text-xl lg:text-2xl font-medium tracking-wide text-[var(--gray)]">
              Peter Drucker
            </p>
          </div>

          <div className="flex flex-wrap gap-4 lg:gap-6 pt-8 lg:pt-16">
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={FaGithub}
              name="Professional GitHub"
              onClick={() =>
                window.open('https://github.com/andrescordero-cbqa', '_blank')
              }
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={FaGithub}
              name="Personal GitHub"
              onClick={() =>
                window.open('https://github.com/andrescorderor', '_blank')
              }
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={FaLinkedinIn}
              name="LinkedIn"
              onClick={() =>
                window.open(
                  'https://www.linkedin.com/in/andresmcorderor/',
                  '_blank',
                )
              }
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={HiDocumentDownload}
              name="Download Resume"
              onClick={() => window.open('/assets/Resume.pdf', '_blank')}
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={IoMdMail}
              name="Email"
              onClick={() =>
                window.open('mailto:andresmcorderor@gmail.com', '_blank')
              }
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={IoLogoWhatsapp}
              name="WhatsApp"
              onClick={() =>
                window.open('https://wa.me/524777037913', '_blank')
              }
            />
            <DynamicButton
              style="WHITE"
              type="full-dynamic"
              icon={FaTelegramPlane}
              name="Telegram"
              onClick={() =>
                window.open('https://t.me/corderoandres', '_blank')
              }
            />
          </div>
        </div>
        <ContactButton />
      </div>
      <div className="animate-gradient-rotate h-1 w-full bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]" />
      <p className="font-dm-sans pointer-events-none my-4 text-center text-sm text-[var(--black)] ">
        © Andrés Cordero {currentYear} • {t('footer.rights')}
      </p>
    </footer>
  );
}
