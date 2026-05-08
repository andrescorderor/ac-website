import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { heroParagraph } from '@mocks/HomeMocks';
import { motion } from 'framer-motion';

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
    <section className="hover:cursor-default overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center px-6 md:px-16 lg:px-36 pb-16 lg:pb-36 pt-24 lg:pt-28 gap-12 lg:gap-0">
        <div>
          <h1 className="font-dm-sans text-5xl sm:text-7xl lg:text-[8rem] font-medium leading-none tracking-tight text-[var(--dark-gray)]">
            {t('hero.make_it')}
          </h1>
          <div className="flex">
            <motion.h1
              key={currentPhraseIndex}
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
          <div className="mt-12 lg:mt-32 flex w-full lg:w-7/12 gap-4 items-start lg:items-center">
            <img
              src={heroParagraph.profilePicture}
              alt="Profile"
              className="size-16 rounded-full border border-[var(--light-gray)] shadow-sm"
            />
            <p className="font-inter text-lg lg:text-2xl font-light tracking-wide text-[var(--dark-gray)] leading-relaxed">
              {t('hero.paragraph')}
            </p>
          </div>
        </div>
        <HeroCircles />
      </div>
    </section>
  );
}
