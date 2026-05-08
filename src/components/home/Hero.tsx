import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { heroParagraph } from '@mocks/HomeMocks';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { HiOutlineDownload } from 'react-icons/hi';
import { DynamicButton } from '../common/buttons/DynamicButton';

import HeroCircles from './HeroCircles';

export default function Hero() {
  const { t } = useTranslation();
  
  const phrases = useMemo(
    () => t('hero.phrases', { returnObjects: true }) as string[],
    [t],
  );

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [previousPhraseIndex, setPreviousPhraseIndex] = useState<number | null>(
    null,
  );
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (!isDeleting && charIndex < currentPhrase.length) {
        setDisplayText((prev) => prev + currentPhrase[charIndex]);
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);

        let newIndex = currentPhraseIndex;
        while (
          newIndex === currentPhraseIndex ||
          newIndex === previousPhraseIndex
        ) {
          newIndex = Math.floor(Math.random() * phrases.length);
        }

        setPreviousPhraseIndex(currentPhraseIndex);
        setCurrentPhraseIndex(newIndex);
      }
    };

    const typingSpeed = isDeleting ? 50 : 100;
    const typingInterval = setInterval(handleTyping, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [charIndex, isDeleting, currentPhraseIndex, previousPhraseIndex, phrases]);

  return (
    <section className="relative hover:cursor-default overflow-hidden min-h-screen flex items-center pt-20">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[var(--vibrant-sky-blue)]/10 to-transparent blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[var(--magenta-pink)]/10 to-transparent blur-[120px]" 
        />
      </div>

      <div className="container mx-auto px-6 md:px-16 lg:px-36 w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-16 lg:gap-24">
          <div className="flex-1 z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-6 block">
                {t('roles.sd')} & {t('roles.pm')}
              </span>
              <h1 className="font-dm-sans text-6xl sm:text-8xl lg:text-[10rem] font-bold leading-[0.85] tracking-tighter text-[var(--black)] mb-4">
                {t('hero.make_it')}
              </h1>
              <div className="flex items-center">
                <motion.h1
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-dm-sans text-gradient text-6xl sm:text-8xl lg:text-[10rem] font-bold leading-none tracking-tighter"
                >
                  {displayText}
                </motion.h1>
                <motion.div
                  className="font-dm-sans text-6xl sm:text-8xl lg:text-[10rem] leading-none text-[var(--black)] font-thin ml-2"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  _
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 lg:mt-24 max-w-2xl"
            >
              <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
                <div className="relative group flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <img
                    src={heroParagraph.profilePicture}
                    alt="Andres Cordero"
                    className="relative size-24 rounded-full border-2 border-white grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl object-cover"
                  />
                </div>
                <p className="font-inter text-xl lg:text-2xl font-light tracking-tight text-[var(--dark-gray)] leading-relaxed italic">
                  "{t('hero.paragraph')}"
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-8 mt-12">
                <a href="#portfolio-section" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                }} className="relative group overflow-hidden">
                  <div className="absolute inset-0 bg-[var(--black)] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <DynamicButton
                    style="BLACK"
                    type="full-static"
                    name={t('hero.cta_work')}
                  />
                </a>
                
                <div className="flex items-center gap-5">
                  {[
                    { icon: HiOutlineDownload, href: "/assets/CV_AndresCordero.pdf", label: "CV" },
                    { icon: FaGithub, href: "https://github.com/andrescorderor", label: "GitHub" },
                    { icon: FaLinkedin, href: "https://www.linkedin.com/in/andresmcorderor/", label: "LinkedIn" }
                  ].map((social, i) => (
                    <a 
                      key={i}
                      href={social.href} 
                      target="_blank" 
                      rel="noreferrer" 
                      title={social.label}
                      className="group relative flex items-center justify-center size-14 rounded-2xl bg-white border border-[var(--light-gray)] hover:border-[var(--black)] hover:-translate-y-1 shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <social.icon className="text-[var(--dark-gray)] group-hover:text-[var(--black)] text-2xl transition-colors duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block flex-shrink-0 relative"
          >
            <div className="absolute inset-0 bg-[var(--vibrant-sky-blue)]/5 blur-[100px] rounded-full animate-pulse" />
            <HeroCircles />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
