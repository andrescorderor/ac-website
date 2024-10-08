import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

export default function Hero() {
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

  const circleVariants = {
    rotate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 10,
        ease: 'linear',
      },
    },
  };

  return (
    <div className="hover:cursor-default">
      <motion.div
        className="relative flex size-[400px] items-center justify-center"
        variants={circleVariants}
        animate="rotate"
      >
        <motion.div
          className="absolute size-[120px] rounded-full bg-[var(--deep-navy-blue)]"
          style={{
            transform: 'translateY(-110px)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          className="absolute size-[120px] rounded-full bg-[var(--magenta-pink)]"
          style={{
            transform: 'translate(-110px, 90px)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          className="absolute size-[120px] rounded-full bg-[var(--vibrant-sky-blue)]"
          style={{
            transform: 'translate(110px, 90px)',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>
    </div>
  );
}
