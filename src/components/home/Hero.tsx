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
    <section className="relative hover:cursor-default overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--vibrant-sky-blue)] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--magenta-pink)] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="flex flex-col lg:flex-row items-center px-6 md:px-16 lg:px-36 pb-16 lg:pb-36 pt-24 lg:pt-28 gap-12 lg:gap-0 w-full">
        <div className="flex-1">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-dm-sans text-5xl sm:text-7xl lg:text-[8rem] font-medium leading-none tracking-tight text-[var(--dark-gray)]"
          >
            {t('hero.make_it')}
          </motion.h1>
          <div className="flex flex-wrap">
            <motion.h1
              key={currentPhraseIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-dm-sans animate-gradient-random bg-clip-text text-5xl sm:text-7xl lg:text-[8rem] font-bold leading-none text-transparent tracking-tight"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--deep-navy-blue), var(--vibrant-sky-blue), var(--magenta-pink))',
              }}
            >
              {displayText}
            </motion.h1>

            <motion.div
              className="font-dm-sans text-5xl sm:text-7xl lg:text-[8rem] leading-none text-[var(--gray)] font-light"
              animate={{
                opacity: [1, 0],
                transition: { repeat: Infinity, duration: 1 },
              }}
            >
              |
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-12 lg:mt-32 flex flex-col md:flex-row w-full lg:w-11/12 gap-6 md:gap-12 items-start md:items-center"
          >
            <div className="relative flex-shrink-0">
              <img
                src={heroParagraph.profilePicture}
                alt="Profile"
                className="size-20 rounded-full border-2 border-[var(--white)] shadow-xl z-10 relative"
              />
              <div className="absolute inset-0 bg-[var(--vibrant-sky-blue)] rounded-full blur-md opacity-30 animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-8">
              <p className="font-inter text-lg lg:text-2xl font-light tracking-wide text-[var(--dark-gray)] leading-relaxed max-w-2xl">
                {t('hero.paragraph')}
              </p>
              
              {/* Primary Call to Action & Socials */}
              <div className="flex flex-wrap items-center gap-6">
                <a href="#portfolio-section" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:scale-105 transition-transform duration-300">
                  <DynamicButton
                    style="BLACK"
                    type="full-static"
                    name={t('hero.cta_work', 'View My Work')}
                  />
                </a>
                
                <div className="flex items-center gap-4">
                  <a href="/assets/CV_AndresCordero.pdf" target="_blank" rel="noreferrer" title="Download Resume" className="group flex items-center justify-center size-12 rounded-full border border-[var(--light-gray)] hover:border-[var(--vibrant-sky-blue)] bg-[var(--white)] shadow-sm hover:shadow-md transition-all duration-300">
                    <HiOutlineDownload className="text-[var(--gray)] group-hover:text-[var(--vibrant-sky-blue)] text-xl transition-colors duration-300" />
                  </a>

                  <a href="https://github.com/andrescorderor" target="_blank" rel="noreferrer" title="GitHub" className="group flex items-center justify-center size-12 rounded-full border border-[var(--light-gray)] hover:border-[var(--vibrant-sky-blue)] bg-[var(--white)] shadow-sm hover:shadow-md transition-all duration-300">
                    <FaGithub className="text-[var(--gray)] group-hover:text-[var(--vibrant-sky-blue)] text-xl transition-colors duration-300" />
                  </a>

                  <a href="https://www.linkedin.com/in/andresmcorderor/" target="_blank" rel="noreferrer" title="LinkedIn" className="group flex items-center justify-center size-12 rounded-full border border-[var(--light-gray)] hover:border-[var(--vibrant-sky-blue)] bg-[var(--white)] shadow-sm hover:shadow-md transition-all duration-300">
                    <FaLinkedin className="text-[var(--gray)] group-hover:text-[var(--vibrant-sky-blue)] text-xl transition-colors duration-300" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="flex-shrink-0 animate-float">
          <HeroCircles />
        </div>
      </div>
    </section>
  );
}
