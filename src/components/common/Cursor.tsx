import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

export default function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);
  const x = useSpring(pointerX, { stiffness: 500, damping: 35, mass: 0.35 });
  const y = useSpring(pointerY, { stiffness: 500, damping: 35, mass: 0.35 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncPointerSupport = () => setIsVisible(finePointer.matches);
    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };
    const handlePointerOver = (event: PointerEvent) => {
      setIsInteractive(
        Boolean(
          (event.target as HTMLElement | null)?.closest(
            'a, button, summary, input, textarea, select, [role="button"], [onclick], [data-clickable="true"], .cursor-pointer'
          )
        )
      );
    };
    const handlePointerEnter = () => setIsVisible(true);
    const handlePointerLeave = () => setIsVisible(false);

    syncPointerSupport();
    finePointer.addEventListener('change', syncPointerSupport);
    if (finePointer.matches && !reducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      document.addEventListener('pointerover', handlePointerOver, { passive: true });
      document.documentElement.addEventListener('pointerenter', handlePointerEnter);
      document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    }
    return () => {
      finePointer.removeEventListener('change', syncPointerSupport);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerover', handlePointerOver);
      document.documentElement.removeEventListener('pointerenter', handlePointerEnter);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [pointerX, pointerY, reducedMotion]);

  if (reducedMotion) return null;
  return (
    <motion.div
      aria-hidden="true"
      className={`public-cursor ${isVisible ? 'is-visible' : ''} ${isInteractive ? 'is-interactive' : ''}`}
      style={{ x, y }}
    />
  );
}
