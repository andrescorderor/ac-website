import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/**
 * Precision cursor ring driven by MotionValues + CSS transforms (zero React re-renders per frame).
 * Automatically disabled on coarse/touch pointers, reduced-motion mode, and inside /admin.
 */
export default function Cursor() {
  const reducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const smoothX = useSpring(mouseX, { stiffness: 420, damping: 32, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 420, damping: 32, mass: 0.4 });

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) {
      setEnabled(false);
      return undefined;
    }

    const media = window.matchMedia('(pointer: fine)');
    const checkEnabled = () => {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      setEnabled(media.matches && !isAdminRoute);
    };

    checkEnabled();
    media.addEventListener('change', checkEnabled);
    window.addEventListener('popstate', checkEnabled);

    return () => {
      media.removeEventListener('change', checkEnabled);
      window.removeEventListener('popstate', checkEnabled);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);

      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest('a, button, input, textarea, select, [role="button"], [role="tab"], .cursor-pointer')
      );
      setIsInteractive((prev) => (prev === interactive ? prev : interactive));
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [enabled, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: isInteractive ? 1.45 : 1,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="pointer-events-none fixed top-0 left-0 z-[9990] hidden lg:flex items-center justify-center"
    >
      <div
        className={`size-9 rounded-full border transition-colors duration-200 flex items-center justify-center ${
          isInteractive
            ? 'border-[var(--vibrant-sky-blue)] bg-[var(--vibrant-sky-blue)]/10'
            : 'border-[var(--pub-border-strong)] bg-transparent'
        }`}
      >
        <span
          className={`size-1.5 rounded-full transition-colors duration-200 ${
            isInteractive ? 'bg-[var(--vibrant-sky-blue)]' : 'bg-[var(--black)]/60'
          }`}
        />
      </div>
    </motion.div>
  );
}
