import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  const phrases = [
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
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [gradientStart, setGradientStart] = useState(Math.random() * 100);

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (!isDeleting && charIndex < currentPhrase.length) {
        // Escribiendo
        setDisplayText((prev) => prev + currentPhrase[charIndex]);
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setGradientStart(Math.random() * 100);
      }
    };

    const typingSpeed = isDeleting ? 50 : 100;
    const typingInterval = setInterval(handleTyping, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [charIndex, isDeleting, currentPhraseIndex, phrases]);

  return (
    <div className="flex h-screen w-full items-center justify-between">
      <div className="flex flex-col items-start justify-center text-[var(--black)]">
        <h1 className="mb-0 text-[10rem] leading-none">Make it</h1>
        <div className="flex">
          <motion.h1
            key={currentPhraseIndex}
            className="bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] bg-clip-text text-[10rem] font-bold leading-none text-transparent animate-gradient-rotate"
            style={{ backgroundPosition: `${gradientStart}% 50%` }}
          >
            {displayText}
          </motion.h1>
          <motion.div
            className="text-[10rem] font-l leading-none text-[var(--black)]"
            animate={{
              opacity: [1, 0],
              transition: { repeat: Infinity, duration: 1 },
            }}
          >
            |
          </motion.div>
        </div>
      </div>
      <div className="mr-16 h-[300px] w-1/4 rounded-lg bg-white shadow-lg backdrop-blur-lg justify-center">
        test
      </div>
    </div>
  );
}
