import { useEffect, useState, useMemo } from 'react';

import { heroParagraph } from '@mocks/HomeMocks';
import { motion } from 'framer-motion';

import HeroCircles from './HeroCircles';
import RolesCarousel from './RolesCarousel';

export default function Hero() {
  const phrases = useMemo(
    () => [
      'better',
      'useful',
      'creative',
      'efficient',
      'impactful',
      'accessible',
      'scalable',
      'innovative',
      'simple',
      'effective',
      'possible',
      'happen',
    ],
    [],
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
    <section className="hover:cursor-default ">
      <div className="flex items-center px-36 pb-36 pt-28">
        <div>
          <h1 className="font-dm-sans text-[10rem] font-medium leading-none">
            Make it
          </h1>
          <div className="flex">
            <motion.h1
              key={currentPhraseIndex}
              className="font-dm-sans animate-gradient-random bg-clip-text text-[10rem] font-bold leading-none text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--deep-navy-blue), var(--vibrant-sky-blue), var(--magenta-pink))',
              }}
            >
              {displayText}
            </motion.h1>

            <motion.div
              className="font-dm-sans text-[10rem] leading-none text-[var(--black)]"
              animate={{
                opacity: [1, 0],
                transition: { repeat: Infinity, duration: 1 },
              }}
            >
              |
            </motion.div>
          </div>
          <div className="mt-32 flex w-5/12 gap-4">
            <img
              src={heroParagraph.profilePicture}
              alt="Profile"
              className="size-14 rounded-full"
            />
            <p className="font-inter text-3xl font-medium tracking-tight text-[var(--black)]">
              {heroParagraph.text}
            </p>
          </div>
        </div>
        <HeroCircles />
      </div>
      <RolesCarousel />
    </section>
  );
}
