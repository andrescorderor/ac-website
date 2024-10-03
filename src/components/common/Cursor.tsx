import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

export default function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [delayedPosition, setDelayedPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [clickable, setClickable] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setActive(true);
    const handleMouseLeave = () => setActive(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.style.cursor === 'pointer'
      ) {
        setClickable(true);
      } else {
        setClickable(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);

    let animationFrameId: number;
    const animateDelayedPosition = () => {
      setDelayedPosition((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.1,
        y: prev.y + (position.y - prev.y) * 0.1,
      }));
      animationFrameId = requestAnimationFrame(animateDelayedPosition);
    };

    animateDelayedPosition();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, [position]);

  const getScale = () => {
    if (clickable) return 1;
    if (active) return 0.6;
    return 0.6;
  };

  return (
    <motion.div
      className={`pointer-events-none fixed left-0 top-0 z-[9998] size-12 rounded-full transition-colors duration-200 ease-out ${
        active
          ? 'bg-[var(--white)] mix-blend-difference'
          : 'bg-[var(--soft-light-gray)] mix-blend-difference'
      }`}
      animate={{
        x: delayedPosition.x,
        y: delayedPosition.y,
        scale: getScale(),
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  );
}
