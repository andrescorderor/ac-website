import { useEffect, useState, useMemo } from 'react';

import { motion } from 'framer-motion';

import CardSection from './CardSection';

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
  const [gradientStart, setGradientStart] = useState(Math.random() * 100);

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

        // Selecciona una nueva frase que no sea igual a la anterior
        let newIndex = currentPhraseIndex;
        while (
          newIndex === currentPhraseIndex ||
          newIndex === previousPhraseIndex
        ) {
          newIndex = Math.floor(Math.random() * phrases.length);
        }

        setPreviousPhraseIndex(currentPhraseIndex);
        setCurrentPhraseIndex(newIndex);
        setGradientStart(Math.random() * 100);
      }
    };

    const typingSpeed = isDeleting ? 50 : 100;
    const typingInterval = setInterval(handleTyping, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [charIndex, isDeleting, currentPhraseIndex, previousPhraseIndex, phrases]);

  return (
    <div className="flex h-screen w-full items-center justify-between gap-7">
      <div className="flex flex-col items-start justify-center text-[var(--black)]">
        <h1 className="font-manrope mb-0 text-[10rem] leading-none">Make it</h1>
        <div className="flex">
          <motion.h1
            key={currentPhraseIndex}
            className="font-manrope animate-gradient-rotate bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] bg-clip-text text-[10rem] font-bold leading-none text-transparent"
            style={{ backgroundPosition: `${gradientStart}% 50%` }}
          >
            {displayText}
          </motion.h1>
          <motion.div
            className="font-manrope text-[10rem] leading-none text-[var(--black)]"
            animate={{
              opacity: [1, 0],
              transition: { repeat: Infinity, duration: 1 },
            }}
          >
            |
          </motion.div>
        </div>
      </div>
      <div className=" justify-end ">
        <CardSection />
      </div>
    </div>
  );
}
