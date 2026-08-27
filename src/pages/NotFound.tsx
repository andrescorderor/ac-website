import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineArrowLeft } from 'react-icons/hi';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    document.title = '404 - Página No Encontrada | Andrés Cordero';
  }, []);

  return (
    <div className="min-h-screen bg-soft-light-gray dark:bg-black text-black dark:text-white flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden selection:bg-[var(--vibrant-sky-blue)] selection:text-white">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--vibrant-sky-blue)]/15 dark:bg-[var(--vibrant-sky-blue)]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--magenta-pink)]/15 dark:bg-[var(--magenta-pink)]/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative z-10 space-y-6"
      >
        {/* Animated 404 Badge */}
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-tr from-[var(--vibrant-sky-blue)] via-indigo-500 to-[var(--magenta-pink)] p-0.5 shadow-xl shadow-sky-500/10 mx-auto">
          <div className="size-full rounded-[22px] bg-white dark:bg-gray-900 flex items-center justify-center text-3xl font-syne font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Página no encontrada
          </h1>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            La ruta a la que intentas acceder no existe, fue reubicada o la dirección es incorrecta.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <HiOutlineHome className="text-base" />
            <span>Ir al Inicio</span>
          </Link>

          <Link
            to="/admin/panel"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider rounded-2xl border border-gray-200 dark:border-gray-700 active:scale-95 transition-all"
          >
            <HiOutlineShieldCheck className="text-base text-[var(--vibrant-sky-blue)]" />
            <span>Panel Privado</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs font-syne font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <HiOutlineArrowLeft className="text-xs" />
            <span>Regresar a la página anterior</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
