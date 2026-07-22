import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Flower = {
  slot: number;
  name: string;
  stage: number; // 1: Semilla, 2: Brote, 3: Botón, 4: Florecida
  waterCount: number;
};

const INITIAL_FLOWERS: Flower[] = [
  { slot: 1, name: 'Lili Rosa Victoria', stage: 1, waterCount: 0 },
  { slot: 2, name: 'Lili Ébano Gótico', stage: 1, waterCount: 0 },
  { slot: 3, name: 'Lili Neón de Moda', stage: 1, waterCount: 0 },
  { slot: 4, name: 'Lili Abejita Pibo', stage: 1, waterCount: 0 },
  { slot: 5, name: 'Lili Corazón Dorado', stage: 1, waterCount: 0 },
];

export default function Hannia() {
  const [flowers, setFlowers] = useState<Flower[]>(INITIAL_FLOWERS);
  const [piboTalking, setPiboTalking] = useState<string | null>(
    '¡Hola Hannia! Soy Pibo abejita 🐝. Regemos juntos tus lilis victorianas.'
  );
  const [piboBouncing, setPiboBouncing] = useState(false);
  const [showPoem, setShowPoem] = useState(false);

  useEffect(() => {
    fetchGardenState();
  }, []);

  const fetchGardenState = async () => {
    try {
      const { data, error } = await supabase
        .from('hannia_garden')
        .select('*')
        .order('flower_slot', { ascending: true });

      if (!error && data && data.length > 0) {
        const loaded: Flower[] = data.map((d) => ({
          slot: d.flower_slot,
          name: d.flower_name,
          stage: d.growth_stage || 1,
          waterCount: d.water_count || 0,
        }));
        setFlowers(loaded);
      }
    } catch {
      // Fallback to local state if Supabase table not created yet
    }
  };

  const syncFlowerToSupabase = async (updated: Flower) => {
    try {
      await supabase.from('hannia_garden').upsert({
        flower_slot: updated.slot,
        flower_name: updated.name,
        growth_stage: updated.stage,
        water_count: updated.waterCount,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Graceful fallback
    }
  };

  const handleWaterFlower = (slot: number) => {
    setFlowers((prev) =>
      prev.map((f) => {
        if (f.slot === slot) {
          const nextWater = f.waterCount + 1;
          let nextStage = f.stage;
          if (nextWater >= 3 && f.stage < 4) {
            nextStage = f.stage + 1;
          }
          const updated = { ...f, waterCount: nextWater >= 3 ? 0 : nextWater, stage: nextStage };
          syncFlowerToSupabase(updated);
          return updated;
        }
        return f;
      })
    );

    triggerPiboAction();
  };

  const triggerPiboAction = () => {
    setPiboBouncing(true);
    setTimeout(() => setPiboBouncing(false), 800);

    const quotes = [
      '¡Bzz! Las lilis de Hannia están creciendo hermosas 🌸✨',
      '¡Pibo abejita aprueba esta alta costura botánica! 🐝👗',
      '¡Tus diseños y tus lilis llenan el jardín de magia! 💖',
      '¡Un toque más de agua y florecerán las lilis victorianas! 🥀',
      '¡Hannia, eres la diseñadora más increíble del universo! 👑',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setPiboTalking(randomQuote);
  };

  const bloomedCount = flowers.filter((f) => f.stage === 4).length;

  return (
    <div className="min-h-screen bg-[#07080C] text-[#F3E8EE] flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* 🌹 Victorian Gothic Mesh Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#FF2E93]/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#8B0046]/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#FF85C0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* 👑 Victorian Lace Header Bar */}
      <header className="w-full max-w-md text-center pt-4 pb-2 z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12141F]/80 border border-[#FF85C0]/30 shadow-lg backdrop-blur-md">
          <span className="text-xs">🧵</span>
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#FF85C0]">Alta Costura & Amor</span>
          <span className="text-xs">✂️</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif drop-shadow-[0_2px_10px_rgba(255,46,147,0.4)]">
          El Jardín de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF85C0] via-[#FF2E93] to-[#F472B6]">Hannia</span>
        </h1>
        <p className="font-sans text-xs text-[#C4B5FD]/70 font-light tracking-wide">
          Estética Gótica Victoriana • Diseñado con Amor
        </p>
      </header>

      {/* 🐝 Pibo Mascot Card (Cerdo Abeja Victoriano) */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 my-3"
      >
        <div className="bg-[#0F111A]/90 rounded-3xl p-5 border border-[#FF2E93]/30 shadow-2xl backdrop-blur-xl relative overflow-hidden flex items-center gap-4">
          <motion.div 
            animate={piboBouncing ? { y: [-6, 0, -6], scale: [1, 1.08, 1] } : {}}
            onClick={() => triggerPiboAction()}
            className="relative cursor-pointer shrink-0 group"
          >
            {/* Pibo Bee-Pig Avatar */}
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#FF85C0]/20 to-[#FF2E93]/40 border border-[#FF85C0]/40 flex items-center justify-center text-4xl shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform">
              <span className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">🐷🐝</span>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider text-center text-[#FF85C0]">
                Pibo
              </div>
            </div>
            <div className="absolute -top-1 -right-1 size-5 bg-[#FF2E93] rounded-full flex items-center justify-center text-[10px] shadow-lg animate-bounce">
              👑
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#FF85C0] flex items-center gap-1">
                <span>🐝</span> Pibo Abejita
              </span>
              <span className="text-[9px] font-sans text-gray-400">Toca a Pibo</span>
            </div>
            <p className="font-serif italic text-xs sm:text-sm text-gray-200 leading-snug">
              "{piboTalking}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* 🌸 Digital Lily Garden Grid */}
      <main className="w-full max-w-md z-10 my-2 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#FF85C0] flex items-center gap-2">
            <span>🥀</span>
            <span>Tus Lilis Marianas ({bloomedCount}/5 Florecidas)</span>
          </h2>
          <span className="font-sans text-[10px] text-gray-400">Toca la maceta para regar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {flowers.map((f) => (
            <motion.div
              key={f.slot}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWaterFlower(f.slot)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-between min-h-[140px] shadow-lg ${
                f.stage === 4
                  ? 'bg-gradient-to-b from-[#1C1226] to-[#0F111A] border-[#FF2E93]/60 shadow-[0_0_20px_rgba(255,46,147,0.2)]'
                  : 'bg-[#0F111A]/80 border-[#2A2438] hover:border-[#FF85C0]/40'
              }`}
            >
              <div className="w-full flex items-center justify-between text-[10px] font-sans text-gray-400">
                <span className="font-bold uppercase tracking-wider text-[#FF85C0]">#{f.slot}</span>
                <span>💧 {f.waterCount}/3</span>
              </div>

              {/* Flower Stage Icon & Animation */}
              <div className="my-2 text-4xl filter drop-shadow-[0_4px_12px_rgba(255,46,147,0.5)] transition-all">
                {f.stage === 1 && '🌱'}
                {f.stage === 2 && '🌿'}
                {f.stage === 3 && '🌷'}
                {f.stage === 4 && (
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="inline-block"
                  >
                    🌺
                  </motion.span>
                )}
              </div>

              <div className="text-center w-full">
                <p className="font-serif font-bold text-xs text-white truncate">{f.name}</p>
                <p className="font-sans text-[9px] text-[#FF85C0] mt-0.5">
                  {f.stage === 1 && 'Semilla'}
                  {f.stage === 2 && 'Brote Verde'}
                  {f.stage === 3 && 'Capullo'}
                  {f.stage === 4 && '✨ ¡Florecida!'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* 📜 Secret Poem Wax Seal Trigger */}
      <footer className="w-full max-w-md z-10 mt-4 mb-2 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPoem(true)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8B0046] via-[#FF2E93] to-[#8B0046] text-white font-sans text-xs font-bold uppercase tracking-widest shadow-[0_0_25px_rgba(255,46,147,0.4)] border border-[#FF85C0]/50 flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <span className="text-lg">📜</span>
          <span>Revelar Mensaje Secreto de Amor</span>
          <span className="text-lg animate-pulse">📌</span>
        </motion.button>
      </footer>

      {/* 📜 Secret Gothic Poem Modal / Parchment */}
      <AnimatePresence>
        {showPoem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPoem(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, rotateX: -20 }}
              className="relative w-full max-w-sm bg-[#16121E] border-2 border-[#FF85C0]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,46,147,0.3)] z-10 text-center space-y-6 overflow-hidden"
            >
              {/* Victorian Filigree Border Accent */}
              <div className="absolute top-2 inset-x-0 text-center text-xs text-[#FF85C0]/40 font-serif">
                ⚜️ 📜 ⚜️
              </div>

              <div className="space-y-2 pt-2">
                <div className="inline-block p-3 rounded-full bg-[#FF2E93]/20 border border-[#FF85C0]/40 text-2xl">
                  🐝🌸
                </div>
                <h3 className="font-serif font-bold text-2xl text-white tracking-wide">
                  Poema para <span className="text-[#FF85C0]">Hannia</span>
                </h3>
                <p className="font-sans text-[10px] uppercase tracking-widest text-gray-400">
                  De Andrés • Con amor gótico & victoriano
                </p>
              </div>

              {/* 4-Line Rhyming Victorian Poem */}
              <div className="bg-[#0A0812]/80 p-6 rounded-2xl border border-[#FF85C0]/20 space-y-3 font-serif italic text-sm text-[#F3E8EE] leading-relaxed shadow-inner">
                <p>"Entre encajes oscuros y seda de alta moda,</p>
                <p>florecen sombras finas bajo un velo de tul,</p>
                <p>mientras Pibo abejita feliz la noche mece,</p>
                <p>tus lilis y tu encanto llenan mi alma de luz."</p>
              </div>

              <div className="flex justify-center items-center gap-2 text-xs text-[#FF85C0]">
                <span>🐷🐝</span>
                <span className="font-serif italic text-gray-300">Pibo & Andrés te aman por siempre</span>
                <span>🌸</span>
              </div>

              <button
                onClick={() => setShowPoem(false)}
                className="w-full py-3 bg-[#FF2E93] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#FF85C0] transition-colors shadow-lg"
              >
                Cerrar Pergamino 💖
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
