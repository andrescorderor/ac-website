import { motion, useReducedMotion } from 'framer-motion';

/**
 * Fuente centralizada para el ícono/firma de marca de Andrés Cordero.
 * Cuando tengas tu archivo SVG o PNG final de firma personal, reemplaza
 * únicamente este asset o ruta manteniendo una única fuente de verdad.
 */
export const SIGNATURE_ASSET_SRC = '/assets/ac-website-icon.svg';

interface SignatureMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showRoleTag?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<SignatureMarkProps['size']>, { box: string; img: string; title: string }> = {
  sm: { box: 'size-10 rounded-xl', img: 'size-6', title: 'text-sm' },
  md: { box: 'size-12 rounded-2xl', img: 'size-7', title: 'text-base' },
  lg: { box: 'size-16 rounded-2xl', img: 'size-10', title: 'text-xl' },
};

export default function SignatureMark({
  size = 'md',
  showWordmark = false,
  showRoleTag = false,
  animated = false,
  className = '',
}: SignatureMarkProps) {
  const reducedMotion = useReducedMotion();
  const s = SIZE_CLASSES[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      <div
        className={`relative ${s.box} flex items-center justify-center bg-[var(--pub-surface-elevated)] border border-[var(--pub-border-strong)] shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105`}
      >
        {/* Subtle technical corner brackets */}
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 size-1.5 border-t border-l border-[var(--vibrant-sky-blue)] opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 size-1.5 border-b border-r border-[var(--magenta-pink)] opacity-60 group-hover:opacity-100 transition-opacity"
        />

        {/* Ambient radial sheen */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-sky-blue)]/10 via-transparent to-[var(--magenta-pink)]/10 opacity-70"
        />

        {animated && !reducedMotion ? (
          <motion.img
            src={SIGNATURE_ASSET_SRC}
            alt="Andrés Cordero Signature Mark"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className={`relative ${s.img} object-contain dark:brightness-110`}
          />
        ) : (
          <img
            src={SIGNATURE_ASSET_SRC}
            alt="Andrés Cordero Signature Mark"
            className={`relative ${s.img} object-contain dark:brightness-110`}
          />
        )}
      </div>

      {showWordmark && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className={`font-dm-sans font-bold tracking-tight text-[var(--black)] ${s.title}`}>
            Andrés Cordero
          </span>
          {showRoleTag && (
            <span className="font-mono-tech text-[10px] tracking-wider uppercase text-[var(--dark-gray)]">
              ENG · AI · QA · PM
            </span>
          )}
        </div>
      )}
    </div>
  );
}
