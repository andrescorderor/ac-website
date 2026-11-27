import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineArrowLeft } from 'react-icons/hi';
import { useEffect } from 'react';
import SignatureMark from '@components/common/SignatureMark';

export default function NotFound() {
  useEffect(() => {
    document.title = '404 - Página No Encontrada | Andrés Cordero';
  }, []);

  return (
    <div className="public-site public-light dark:public-dark arch-grid-canvas min-h-screen text-[var(--black)] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--vibrant-sky-blue)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--magenta-pink)]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg w-full telemetry-panel corner-ticks rounded-3xl p-8 sm:p-12 text-center relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center gap-3">
          <SignatureMark size="md" />
          <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-[var(--vibrant-sky-blue)]/10 text-[var(--vibrant-sky-blue)] border border-[var(--vibrant-sky-blue)]/25">
            ERR // 404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold text-[var(--black)] tracking-tight">
            Ruta no encontrada
          </h1>
          <p className="font-inter text-sm text-[var(--dark-gray)] max-w-sm mx-auto leading-relaxed">
            La dirección solicitada no existe o fue reubicada dentro del sistema.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 min-h-[44px] py-3 bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <HiOutlineHome className="text-base" />
            <span>Ir al Portafolio</span>
          </Link>

          <Link
            to="/admin/panel"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 min-h-[44px] py-3 bg-[var(--pub-bg)] hover:bg-[var(--pub-surface-muted)] text-[var(--black)] font-syne text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--pub-border)] active:scale-95 transition-all cursor-pointer"
          >
            <HiOutlineShieldCheck className="text-base text-[var(--vibrant-sky-blue)]" />
            <span>Panel Privado</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-[var(--pub-border)]">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-mono-tech font-semibold text-[var(--dark-gray)] hover:text-[var(--black)] transition-colors cursor-pointer"
          >
            <HiOutlineArrowLeft className="text-xs" />
            <span>Volver atrás</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
