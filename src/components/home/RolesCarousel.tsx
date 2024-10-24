import { useEffect, useState } from 'react';

import { rolesCarousel } from '@mocks/HomeMocks';
import { motion } from 'framer-motion';

export default function RolesCarousel() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const calculatePosition = (initialX: number, finalX: number) => {
    const maxScroll = 1000;
    const scrollPercentage = Math.min(scrollY / maxScroll, 1);
    return initialX + (finalX - initialX) * scrollPercentage;
  };

  return (
    <div className="relative w-full cursor-default overflow-hidden">
      <div className="font-syne whitespace-nowrap bg-[var(--black)] text-[6rem] font-bold text-[var(--white)]">
        <div className="flex">
          <motion.h3
            className="text-[var(--white)]"
            animate={{ x: calculatePosition(-1800, 700) }}
            transition={{
              type: 'tween',
              ease: [0.17, 0.67, 0.83, 0.67],
              duration: 2.5,
            }}
          >
            {rolesCarousel[0].role}
          </motion.h3>
          <motion.h3
            className="text-[var(--white)]"
            animate={{ x: calculatePosition(-1700, 800) }}
            transition={{
              type: 'tween',
              ease: [0.17, 0.67, 0.83, 0.67],
              duration: 2.5,
            }}
          >
            {rolesCarousel[1].role}
          </motion.h3>
          <motion.h3
            className="text-[var(--white)]"
            animate={{ x: calculatePosition(-1600, 900) }}
            transition={{
              type: 'tween',
              ease: [0.17, 0.67, 0.83, 0.67],
              duration: 2.5,
            }}
          >
            {rolesCarousel[2].role}
          </motion.h3>
        </div>
      </div>
    </div>
  );
}
