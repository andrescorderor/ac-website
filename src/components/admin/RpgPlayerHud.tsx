import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitialStats, PlayerStats } from '@/lib/gamification';
import { HiOutlineSparkles, HiX } from 'react-icons/hi';

export default function RpgPlayerHud() {
  const [stats, setStats] = useState<PlayerStats>(getInitialStats());
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string } | null>(null);

  useEffect(() => {
    const handleStatsChanged = (e: any) => {
      if (e.detail) setStats(e.detail);
    };

    const handleLevelUp = (e: any) => {
      if (e.detail) {
        setLevelUpData(e.detail);
      }
    };

    window.addEventListener('ac_player_stats_changed', handleStatsChanged);
    window.addEventListener('ac_player_level_up', handleLevelUp);
    return () => {
      window.removeEventListener('ac_player_stats_changed', handleStatsChanged);
      window.removeEventListener('ac_player_level_up', handleLevelUp);
    };
  }, []);

  const xpPercentage = Math.min(100, Math.round((stats.xp / stats.nextLevelXp) * 100));

  return (
    <>
      {/* ═══ Player HUD Bar ═══ */}
      <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-amber-500/30 dark:border-amber-400/30 px-3.5 py-1.5 rounded-2xl shadow-lg shadow-amber-500/5">
        {/* Avatar & Level */}
        <div className="relative flex items-center justify-center">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center text-lg">
            {stats.avatar}
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-black text-amber-300 font-syne text-[9px] font-extrabold rounded-md border border-amber-400/50 shadow-xs">
            Nv.{stats.level}
          </span>
        </div>

        {/* Info & XP Bar */}
        <div className="hidden sm:flex flex-col justify-center min-w-[130px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-syne text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-[110px]" title={stats.title}>
              {stats.title}
            </span>
            <span className="font-syne text-[9px] font-extrabold text-amber-500">
              {stats.xp}/{stats.nextLevelXp} XP
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-1 p-0.5 border border-amber-500/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full shadow-xs"
            />
          </div>
        </div>

        {/* Gold Counter */}
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-300">
          <span className="text-xs">🪙</span>
          <span className="font-dm-sans font-bold text-xs">{stats.gold}</span>
        </div>
      </div>

      {/* ═══ Level Up Celebration Modal ═══ */}
      <AnimatePresence>
        {levelUpData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-b from-gray-900 to-black border-2 border-amber-400 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden space-y-5"
            >
              <button
                onClick={() => setLevelUpData(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/10"
              >
                <HiX />
              </button>

              <div className="size-20 mx-auto rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 animate-bounce">
                👑
              </div>

              <div className="space-y-1">
                <span className="font-syne text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
                  <HiOutlineSparkles /> ¡LEVEL UP! <HiOutlineSparkles />
                </span>
                <h2 className="font-dm-sans text-3xl font-black text-white">
                  ¡Nivel {levelUpData.level}!
                </h2>
                <p className="font-syne text-sm font-bold text-emerald-400">
                  {levelUpData.title}
                </p>
              </div>

              <p className="font-inter text-xs text-gray-300">
                ¡Has ganado +100 Monedas de Oro 🪙 por mantener la disciplina en tus misiones!
              </p>

              <button
                onClick={() => setLevelUpData(null)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-syne text-xs font-extrabold uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                ¡Continuar la Aventura! ⚔️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
