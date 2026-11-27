import { motion, useReducedMotion } from 'framer-motion';

interface SignatureMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function SignatureMark({
  size = 'md',
  className = '',
  label = 'Andrés Cordero signature mark',
}: SignatureMarkProps) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={`signature-mark signature-mark-${size} ${className}`} aria-label={label} role="img">
      <motion.img
        src="/assets/ac-website-icon.svg"
        alt=""
        initial={reduceMotion ? false : { opacity: 0, scale: 0.82, rotate: -8 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      />
      <span className="signature-mark-ring" aria-hidden="true" />
    </span>
  );
}
