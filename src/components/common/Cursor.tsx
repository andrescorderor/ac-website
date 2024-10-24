import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

export default function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [delayedPosition, setDelayedPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [clickable, setClickable] = useState(false);
  const [isInDiscussionCarousel, setIsInDiscussionCarousel] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setActive(true);
    const handleMouseLeave = () => setActive(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setClickable(
        target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.style.cursor === 'pointer',
      );
    };

    const handleDiscussionCarouselHover = (e: CustomEvent) => {
      setIsInDiscussionCarousel(e.detail.isHovered);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener(
      'discussionCarouselHover',
      handleDiscussionCarouselHover as EventListener,
    );

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
      window.removeEventListener(
        'discussionCarouselHover',
        handleDiscussionCarouselHover as EventListener,
      );
      cancelAnimationFrame(animationFrameId);
    };
  }, [position]);

  const getScale = () => {
    if (isInDiscussionCarousel) return 1.5;
    if (clickable) return 1;
    if (active) return 0.6;
    return 0.6;
  };

  const getCursorClassName = () => {
    const baseClasses =
      'fixed left-0 top-0 z-50 rounded-full transition-colors duration-200 ease-out pointer-events-none  z-[9999] ';

    if (isInDiscussionCarousel) {
      return `${baseClasses} flex items-center justify-center size-24 animate-gradient-random  bg-[var(--soft-light-gray)] bg-opacity-50 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] text-white`;
    }

    if (active) {
      return `${baseClasses} size-12 bg-[var(--white)] mix-blend-difference`;
    }

    return `${baseClasses} size-12 bg-[var(--soft-light-gray)] mix-blend-difference`;
  };

  return (
    <motion.div
      className={getCursorClassName()}
      animate={{
        x: delayedPosition.x,
        y: delayedPosition.y,
        scale: getScale(),
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      {isInDiscussionCarousel && (
        <span className="text-center text-sm font-bold leading-tight  ">
          Let&apos;s get in touch
        </span>
      )}
    </motion.div>
  );
}
