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
  { slot: 1, name: 'Lili Ébano Victoriano', stage: 1, waterCount: 0 },
  { slot: 2, name: 'Seda Rosa Magenta', stage: 1, waterCount: 0 },
  { slot: 3, name: 'Encaje Gótico Nocturno', stage: 1, waterCount: 0 },
  { slot: 4, name: 'Pibo Haute Couture', stage: 1, waterCount: 0 },
  { slot: 5, name: 'Flor de Terciopelo', stage: 1, waterCount: 0 },
];

export default function Hannia() {
  const [flowers, setFlowers] = useState<Flower[]>(INITIAL_FLOWERS);
  const [piboTalking, setPiboTalking] = useState<string | null>(
    'Pibo en guardia. Cultivemos el atelier secreto de lilis.'
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
      // Fallback local state
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
    setTimeout(() => setPiboBouncing(false), 600);

    const quotes = [
      'Alta costura gótica en proceso... 🖤',
      'Pibo vigilando el corte de seda y encaje.',
      'Sinfonía victoriana en el atelier.',
      'Las lilis de ébano responden al diseño.',
      'Elegancia oscura e inconfundible.',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setPiboTalking(randomQuote);
  };

  const bloomedCount = flowers.filter((f) => f.stage === 4).length;

  return (
    <div className="min-h-screen bg-[#050508] text-[#E2DCE7] flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* 🖤 Subtle Dark Victorian Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-[#FF2E93]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#4A0028]/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#FF85C0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* 👑 Minimalist Victorian Top Bar */}
      <header className="w-full max-w-md text-center pt-4 pb-2 z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0D0E16] border border-[#FF85C0]/20 shadow-md">
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF85C0]">Hannia • Atelier Gótico</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
          Jardín de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF85C0] via-[#FF2E93] to-[#C026D3]">Lilis</span>
        </h1>
        <p className="font-sans text-[11px] text-gray-400 tracking-wider">
          Diseño • Victoriano • Alta Costura
        </p>
      </header>

      {/* 🐝 Pibo Mascot (Cerdo Abeja Victoriano Chic) */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 my-3"
      >
        <div className="bg-[#0A0C14]/90 rounded-3xl p-5 border border-white/10 shadow-2xl backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <motion.div 
            animate={piboBouncing ? { y: [-4, 0, -4], scale: [1, 1.05, 1] } : {}}
            onClick={triggerPiboAction}
            className="relative cursor-pointer shrink-0"
          >
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#FF85C0]/15 to-[#FF2E93]/25 border border-[#FF85C0]/30 flex items-center justify-center text-4xl shadow-lg relative overflow-hidden">
              <span className="filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🐷🐝</span>
              <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest text-center text-[#FF85C0]">
                Pibo
              </div>
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF85C0]">
                Guardian Pibo
              </span>
              <span className="text-[9px] font-sans text-gray-500">Toca para interactuar</span>
            </div>
            <p className="font-serif italic text-xs text-gray-300 leading-snug">
              "{piboTalking}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* 🌸 Digital Lily Botanical Grid */}
      <main className="w-full max-w-md z-10 my-2 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
            <span>🥀</span>
            <span>Especímenes Botanical ({bloomedCount}/5 Florecidas)</span>
          </h2>
          <span className="font-sans text-[9px] text-gray-500">Regar x3 para florecer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {flowers.map((f) => (
            <motion.div
              key={f.slot}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleWaterFlower(f.slot)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-between min-h-[140px] shadow-md ${
                f.stage === 4
                  ? 'bg-gradient-to-b from-[#181024] to-[#0A0C14] border-[#FF2E93]/50 shadow-[0_0_15px_rgba(255,46,147,0.15)]'
                  : 'bg-[#0A0C14] border-white/5 hover:border-[#FF85C0]/30'
              }`}
            >
              <div className="w-full flex items-center justify-between text-[9px] font-sans text-gray-500">
                <span className="font-bold text-[#FF85C0]">0{f.slot}</span>
                <span>💧 {f.waterCount}/3</span>
              </div>

              <div className="my-2 text-3xl transition-all">
                {f.stage === 1 && '🌱'}
                {f.stage === 2 && '🌿'}
                {f.stage === 3 && '🌷'}
                {f.stage === 4 && (
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="inline-block"
                  >
                    🌺
                  </motion.span>
                )}
              </div>

              <div className="text-center w-full">
                <p className="font-serif font-bold text-xs text-gray-200 truncate">{f.name}</p>
                <p className="font-sans text-[8px] text-[#FF85C0] tracking-wider uppercase mt-0.5">
                  {f.stage === 1 && 'Semilla'}
                  {f.stage === 2 && 'Brote'}
                  {f.stage === 3 && 'Capullo'}
                  {f.stage === 4 && 'Florecida'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* 📜 Secret Poem Seal Trigger */}
      <footer className="w-full max-w-md z-10 mt-4 mb-2 text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPoem(true)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#12141F] via-[#241026] to-[#12141F] text-white font-sans text-xs font-bold uppercase tracking-[0.2em] border border-[#FF85C0]/30 shadow-xl flex items-center justify-center gap-3"
        >
          <span>📜</span>
          <span>Desplegar Manuscrito Secreto</span>
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-sm bg-[#0E0F17] border border-[#FF85C0]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-center space-y-6 overflow-hidden"
            >
              <div className="space-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#FF85C0]">
                  Manuscrito Victoriano
                </span>
                <h3 className="font-serif font-bold text-2xl text-white">
                  Para Hannia
                </h3>
              </div>

              {/* 4-Line Refined Sophisticated Gothic Poem */}
              <div className="bg-[#050508] p-6 rounded-2xl border border-white/5 space-y-3 font-serif italic text-sm text-[#E2DCE7] leading-relaxed text-left shadow-inner">
                <p>"Entre agujas de plata y seda victoriana,</p>
                <p>florecen lirios negros en tu oscuro jardín,</p>
                <p>Pibo guarda el secreto que tu diseño emana,</p>
                <p>donde la alta costura y el misterio no tienen fin."</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-sans text-gray-500 pt-2 border-t border-white/5">
                <span>Atelier Hannia</span>
                <span>Pibo & Andrés</span>
              </div>

              <button
                onClick={() => setShowPoem(false)}
                className="w-full py-3 bg-[#FF2E93] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#FF85C0] transition-colors"
              >
                Cerrar Manuscrito
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
