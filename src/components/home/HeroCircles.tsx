import { motion, useReducedMotion } from 'framer-motion';

export default function HeroCircles() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="hover:cursor-default select-none pointer-events-none">
      <div className="relative flex size-[340px] xl:size-[420px] items-center justify-center">
        {/* Anillo orbital exterior */}
        <div className="absolute inset-4 rounded-full border border-[var(--light-gray)]/60" />
        <div className="absolute inset-12 rounded-full border border-dashed border-[var(--vibrant-sky-blue)]/30" />

        {/* Núcleo central suave */}
        <div className="absolute size-24 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)]/20 via-indigo-500/15 to-[var(--magenta-pink)]/20 blur-xl" />
        <div className="relative size-14 rounded-full bg-[var(--white)] border border-[var(--light-gray)] shadow-lg flex items-center justify-center">
          <span className="size-3.5 rounded-full bg-gradient-to-tr from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]" />
        </div>

        {/* Orbes rotativos */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={
            reducedMotion ? undefined : { repeat: Infinity, duration: 16, ease: 'linear' }
          }
        >
          <div
            className="absolute size-32 rounded-full bg-gradient-to-br from-[var(--vibrant-sky-blue)] to-indigo-500 opacity-55 blur-[36px]"
            style={{ transform: 'translateY(-115px)' }}
          />
          <div
            className="absolute size-28 rounded-full bg-gradient-to-tr from-[var(--magenta-pink)] to-sky-400 opacity-55 blur-[32px]"
            style={{ transform: 'translate(-105px, 95px)' }}
          />
          <div
            className="absolute size-32 rounded-full bg-gradient-to-bl from-indigo-500 to-[var(--vibrant-sky-blue)] opacity-45 blur-[36px]"
            style={{ transform: 'translate(105px, 95px)' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
