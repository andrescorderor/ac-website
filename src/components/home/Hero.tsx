/* eslint-disable tailwindcss/no-custom-classname */
import { useEffect, useState, useMemo } from 'react';

import { motion } from 'framer-motion';

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
    <section className="hover:cursor-default">
      <div className="flex flex-col gap-8 px-24 pb-24 pt-28">
        <div>
          <h1 className="font-manrope mb-0 text-[10rem] leading-none">
            Make it
          </h1>
          <div className="flex">
            <motion.h1
              key={currentPhraseIndex}
              className="font-manrope bg-clip-text text-[10rem] font-bold leading-none text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--deep-navy-blue), var(--vibrant-sky-blue), var(--magenta-pink))',
                backgroundSize: '400% 400%',
                animation: 'gradient-random 6s ease infinite',
              }}
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
        <div className="flex gap-4 rounded-2xl border-2 p-8">
          <img
            src="/assets/Profile.png"
            alt="Profile"
            className="size-14 rounded-full"
          />
          <p className="text-gray w-1/4 text-xl ">
            I am a developer and project manager with experience in software
            development, project coordination, and more.
          </p>
        </div>
      </div>
      <div className="font-segoe w-full  whitespace-nowrap bg-[var(--black)] text-[4rem] font-bold text-[var(--white)]">
        <div className="animate-scroll flex gap-16 py-8 ">
          <h3>Project Management</h3>
          <h3>Software Development</h3>
          <h3>Quality Assurance</h3>
        </div>
      </div>
    </section>
  );
}
