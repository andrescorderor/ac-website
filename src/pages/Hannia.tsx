import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Dress = {
  id: string;
  name: string;
  reqThread: number;
  reqLace: number;
  reqPollen: number;
  crafted: boolean;
  icon: string;
};

type Lily = {
  id: number;
  name: string;
  stage: number; // 1: Semilla, 2: Brote, 3: Botón, 4: Florecida
  water: number;
};

const INITIAL_DRESSES: Dress[] = [
  { id: 'corset', name: 'Corsé Ébano Victoriano', reqThread: 3, reqLace: 2, reqPollen: 1, crafted: false, icon: '👗' },
  { id: 'gown', name: 'Vestido Lili de Noche', reqThread: 5, reqLace: 4, reqPollen: 3, crafted: false, icon: '👑' },
  { id: 'cloak', name: 'Túnica de Seda y Plata', reqThread: 4, reqLace: 3, reqPollen: 2, crafted: false, icon: '🧥' },
];

const INITIAL_LILIES: Lily[] = [
  { id: 1, name: 'Lili Ébano Victoriano', stage: 1, water: 0 },
  { id: 2, name: 'Seda Rosa Magenta', stage: 1, water: 0 },
  { id: 3, name: 'Encaje Gótico Nocturno', stage: 1, water: 0 },
  { id: 4, name: 'Pibo Haute Couture', stage: 1, water: 0 },
];

export default function Hannia() {
  // Game State
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [thread, setThread] = useState(6);
  const [lace, setLace] = useState(4);
  const [pollen, setPollen] = useState(3);
  const [dresses, setDresses] = useState<Dress[]>(INITIAL_DRESSES);
  const [lilies, setLilies] = useState<Lily[]>(INITIAL_LILIES);
  
  // Pibo Character Position & Dialog
  const [piboPos, setPiboPos] = useState({ x: 50, y: 50 }); // percentage
  const [piboDialog, setPiboDialog] = useState<string>('¡Bzz! Pibo listo para confeccionar y cuidar el jardín.');
  const [piboAction, setPiboAction] = useState<string | null>(null);

  // Active Mini-Game & Modals
  const [activeTab, setActiveTab] = useState<'room' | 'craft' | 'garden'>('room');
  const [craftingTarget, setCraftingTarget] = useState<Dress | null>(null);
  const [stitchingRhythm, setStitchingRhythm] = useState(0); // 0..100
  const [isStitching, setIsStitching] = useState(false);
  const [showPoemRelic, setShowPoemRelic] = useState(false);

  useEffect(() => {
    loadGameSave();
  }, []);

  const loadGameSave = async () => {
    try {
      const { data, error } = await supabase
        .from('hannia_game_save')
        .select('*')
        .eq('user_tag', 'hannia_main')
        .single();

      if (!error && data) {
        setLevel(data.atelier_level || 1);
        setXp(data.xp || 0);
        setThread(data.thread_count ?? 6);
        setLace(data.lace_count ?? 4);
        setPollen(data.pollen_count ?? 3);
        if (data.crafted_dresses && Array.isArray(data.crafted_dresses)) {
          setDresses((prev) =>
            prev.map((d) => ({
              ...d,
              crafted: data.crafted_dresses.includes(d.id),
            }))
          );
        }
      }
    } catch {
      // Fallback to local default state
    }
  };

  const saveGameToSupabase = async (
    newLevel = level,
    newXp = xp,
    newThread = thread,
    newLace = lace,
    newPollen = pollen,
    updatedDresses = dresses
  ) => {
    try {
      const craftedIds = updatedDresses.filter((d) => d.crafted).map((d) => d.id);
      await supabase.from('hannia_game_save').upsert({
        user_tag: 'hannia_main',
        atelier_level: newLevel,
        xp: newXp,
        thread_count: newThread,
        lace_count: newLace,
        pollen_count: newPollen,
        crafted_dresses: craftedIds,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Graceful fallback
    }
  };

  const addXp = (amount: number) => {
    const nextXp = xp + amount;
    if (nextXp >= 100) {
      const nextLvl = level + 1;
      const remXp = nextXp - 100;
      setLevel(nextLvl);
      setXp(remXp);
      setPiboDialog(`🌟 ¡NIVEL DE ATELIER SUBIÓ A LVL ${nextLvl}! Se desbloquearon nuevos patrones.`);
      saveGameToSupabase(nextLvl, remXp);
    } else {
      setXp(nextXp);
      saveGameToSupabase(level, nextXp);
    }
  };

  // Move Pibo in Room
  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(90, Math.max(10, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.min(85, Math.max(15, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    
    setPiboPos({ x: xPct, y: yPct });
    setPiboAction('fly');
    setTimeout(() => setPiboAction(null), 600);
  };

  // Collect Materials in Room
  const collectResource = (type: 'thread' | 'lace' | 'pollen') => {
    if (type === 'thread') {
      const n = thread + 2;
      setThread(n);
      setPiboDialog('🧵 +2 Hilos de seda victoriana recolectados.');
      saveGameToSupabase(level, xp, n, lace, pollen);
    } else if (type === 'lace') {
      const n = lace + 2;
      setLace(n);
      setPiboDialog('🕸️ +2 Encajes góticos recolectados.');
      saveGameToSupabase(level, xp, thread, n, pollen);
    } else {
      const n = pollen + 2;
      setPollen(n);
      setPiboDialog('🌸 +2 Polen de Lili marianas recolectados.');
      saveGameToSupabase(level, xp, thread, lace, n);
    }
    addXp(15);
  };

  // Stitching Mini-Game Logic
  const startCrafting = (dress: Dress) => {
    if (thread < dress.reqThread || lace < dress.reqLace || pollen < dress.reqPollen) {
      setPiboDialog('⚠️ Faltan materiales. Cose o recolecta más hilos, encajes o polen.');
      return;
    }
    setCraftingTarget(dress);
    setStitchingRhythm(10);
    setIsStitching(true);
  };

  const handleStitchTap = () => {
    const nextRhythm = stitchingRhythm + 25;
    if (nextRhythm >= 100) {
      // Craft complete!
      setIsStitching(false);
      if (craftingTarget) {
        const nextThread = thread - craftingTarget.reqThread;
        const nextLace = lace - craftingTarget.reqLace;
        const nextPollen = pollen - craftingTarget.reqPollen;
        
        setThread(nextThread);
        setLace(nextLace);
        setPollen(nextPollen);

        const updatedDresses = dresses.map((d) =>
          d.id === craftingTarget.id ? { ...d, crafted: true } : d
        );
        setDresses(updatedDresses);
        setPiboDialog(`✨ ¡CONFECCIONADO CON ÉXITO! ${craftingTarget.name}`);
        addXp(40);
        saveGameToSupabase(level, xp, nextThread, nextLace, nextPollen, updatedDresses);
      }
      setCraftingTarget(null);
    } else {
      setStitchingRhythm(nextRhythm);
    }
  };

  // Water Lily in Garden
  const waterLily = (id: number) => {
    setLilies((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextW = l.water + 1;
          let nextS = l.stage;
          if (nextW >= 3 && l.stage < 4) {
            nextS = l.stage + 1;
            setPollen((p) => p + 3);
            setPiboDialog('🌸 ¡Lili floreció! Cosechaste +3 Polen de Lili.');
            addXp(25);
          }
          return { ...l, water: nextW >= 3 ? 0 : nextW, stage: nextS };
        }
        return l;
      })
    );
  };

  const totalCrafted = dresses.filter((d) => d.crafted).length;

  return (
    <div className="min-h-screen bg-[#050508] text-[#E2DCE7] flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* 🖤 Ambient Gothic Mesh Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-[#FF2E93]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#3B001F]/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#FF85C0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* 🎮 RPG Top HUD Status Bar */}
      <header className="w-full max-w-md z-10 space-y-2">
        <div className="bg-[#0D0E16]/90 p-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-between text-xs font-sans">
          {/* Level & XP */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#FF2E93] to-[#8B0046] text-white flex items-center justify-center font-bold text-xs shadow-md">
              Lvl {level}
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#FF85C0]">
                <span>Atelier XP</span>
                <span>{xp}/100</span>
              </div>
              <div className="w-24 sm:w-28 h-2 bg-gray-800 rounded-full overflow-hidden mt-1 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF85C0] to-[#FF2E93] transition-all duration-300" 
                  style={{ width: `${xp}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Inventory Quick Bar */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-300">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">🧵 {thread}</span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">🕸️ {lace}</span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">🌸 {pollen}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 font-sans text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('room')}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'room'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            🏛️ Atelier
          </button>
          <button
            onClick={() => setActiveTab('craft')}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'craft'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            ✂️ Costura ({totalCrafted}/3)
          </button>
          <button
            onClick={() => setActiveTab('garden')}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'garden'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            🥀 Jardín
          </button>
        </div>
      </header>

      {/* 💬 Pibo Live Dialog */}
      <section className="w-full max-w-md z-10 my-2">
        <div className="bg-[#0A0C14]/90 p-3 rounded-2xl border border-[#FF85C0]/20 flex items-center gap-3 backdrop-blur-md shadow-lg">
          <span className="text-2xl animate-bounce shrink-0">🐷🐝</span>
          <p className="font-serif italic text-xs text-gray-200 truncate">
            "{piboDialog}"
          </p>
        </div>
      </section>

      {/* 🏛️ TAB 1: INTERACTIVE ROOM CANVAS */}
      {activeTab === 'room' && (
        <main className="w-full max-w-md z-10 my-2 flex-1 flex flex-col">
          <div 
            onClick={handleRoomClick}
            className="w-full h-72 sm:h-80 bg-[#0A0C14] rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl cursor-pointer select-none group"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #161224 0%, #050508 100%)',
            }}
          >
            {/* Victorian Room Decorative Elements */}
            <div className="absolute top-3 left-4 font-serif text-[10px] text-gray-500 uppercase tracking-widest">
              Toca la habitación para mover a Pibo
            </div>

            {/* Station 1: Crafting Table Node */}
            <motion.div 
              whileHover={{ scale: 1.1 }}
              onClick={(e) => { e.stopPropagation(); setActiveTab('craft'); }}
              className="absolute top-10 left-8 bg-[#181024] p-3 rounded-2xl border border-[#FF85C0]/40 text-center shadow-lg cursor-pointer"
            >
              <span className="text-2xl block">🧵</span>
              <span className="font-sans text-[8px] font-bold text-[#FF85C0] uppercase tracking-wider">Mesa Costura</span>
            </motion.div>

            {/* Station 2: Garden Node */}
            <motion.div 
              whileHover={{ scale: 1.1 }}
              onClick={(e) => { e.stopPropagation(); setActiveTab('garden'); }}
              className="absolute top-10 right-8 bg-[#181024] p-3 rounded-2xl border border-[#FF85C0]/40 text-center shadow-lg cursor-pointer"
            >
              <span className="text-2xl block">🥀</span>
              <span className="font-sans text-[8px] font-bold text-[#FF85C0] uppercase tracking-wider">Lilis</span>
            </motion.div>

            {/* Station 3: Relic Chest Node */}
            <motion.div 
              whileHover={{ scale: 1.1 }}
              onClick={(e) => { e.stopPropagation(); setShowPoemRelic(true); }}
              className="absolute bottom-6 right-8 bg-[#181024] p-3 rounded-2xl border border-amber-500/40 text-center shadow-lg cursor-pointer"
            >
              <span className="text-2xl block animate-pulse">📜</span>
              <span className="font-sans text-[8px] font-bold text-amber-400 uppercase tracking-wider">Manuscrito</span>
            </motion.div>

            {/* Interactive Collectible Items spawning in Room */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); collectResource('thread'); }}
              className="absolute top-36 left-12 bg-black/60 p-2 rounded-xl border border-white/20 text-xs shadow-md animate-bounce"
            >
              🧵 +Hilo
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); collectResource('lace'); }}
              className="absolute bottom-16 left-16 bg-black/60 p-2 rounded-xl border border-white/20 text-xs shadow-md animate-bounce"
              style={{ animationDelay: '1s' }}
            >
              🕸️ +Encaje
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); collectResource('pollen'); }}
              className="absolute top-32 right-14 bg-black/60 p-2 rounded-xl border border-white/20 text-xs shadow-md animate-bounce"
              style={{ animationDelay: '1.5s' }}
            >
              🌸 +Polen
            </motion.button>

            {/* Playable Character: Pibo Bee-Pig */}
            <motion.div
              animate={{ 
                left: `${piboPos.x}%`, 
                top: `${piboPos.y}%`,
                scale: piboAction === 'fly' ? [1, 1.2, 1] : 1 
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 size-12 bg-[#FF2E93]/20 border border-[#FF85C0] rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,46,147,0.6)] pointer-events-none"
            >
              🐷🐝
            </motion.div>
          </div>
        </main>
      )}

      {/* ✂️ TAB 2: HAUTE-COUTURE CRAFTING SYSTEM */}
      {activeTab === 'craft' && (
        <main className="w-full max-w-md z-10 my-2 space-y-3 flex-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#FF85C0]">
              Atelier de Alta Costura Gótica
            </h2>
            <span className="font-sans text-[10px] text-gray-400">Patrones disponibles</span>
          </div>

          <div className="space-y-3">
            {dresses.map((d) => (
              <div
                key={d.id}
                className="bg-[#0A0C14] p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                    {d.icon}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">{d.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-sans text-gray-400 mt-1">
                      <span>🧵 {d.reqThread}</span>
                      <span>🕸️ {d.reqLace}</span>
                      <span>🌸 {d.reqPollen}</span>
                    </div>
                  </div>
                </div>

                {d.crafted ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-sans text-[10px] font-bold uppercase tracking-wider">
                    ✨ Confeccionado
                  </span>
                ) : (
                  <button
                    onClick={() => startCrafting(d)}
                    className="px-4 py-2 bg-[#FF2E93] hover:bg-[#FF85C0] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Cosere
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 🥀 TAB 3: BOTANICAL LILY GARDEN */}
      {activeTab === 'garden' && (
        <main className="w-full max-w-md z-10 my-2 space-y-3 flex-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#FF85C0]">
              Cultivo de Lilis Marianas
            </h2>
            <span className="font-sans text-[10px] text-gray-400">Riega 3 veces para cosechar polen</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {lilies.map((l) => (
              <div
                key={l.id}
                onClick={() => waterLily(l.id)}
                className="bg-[#0A0C14] p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-between min-h-[130px] shadow-lg cursor-pointer hover:border-[#FF85C0]/40 transition-all"
              >
                <div className="w-full flex items-center justify-between text-[9px] font-sans text-gray-400">
                  <span className="font-bold text-[#FF85C0]">Lili 0{l.id}</span>
                  <span>💧 {l.water}/3</span>
                </div>

                <div className="my-2 text-3xl">
                  {l.stage === 1 && '🌱'}
                  {l.stage === 2 && '🌿'}
                  {l.stage === 3 && '🌷'}
                  {l.stage === 4 && '🌺'}
                </div>

                <div className="text-center w-full">
                  <p className="font-serif font-bold text-xs text-white truncate">{l.name}</p>
                  <p className="font-sans text-[8px] text-[#FF85C0] uppercase mt-0.5">
                    {l.stage === 4 ? '✨ Florecida (+3 Polen)' : `Riegos: ${l.water}/3`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 🪡 STITCHING RHYTHM MINI-GAME MODAL */}
      <AnimatePresence>
        {isStitching && craftingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-[#0E0F17] border border-[#FF85C0]/40 rounded-3xl p-6 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#FF85C0]">
                  Mini-Juego de Costura
                </span>
                <h3 className="font-serif font-bold text-xl text-white">
                  Confeccionando {craftingTarget.name}
                </h3>
              </div>

              {/* Progress Needle Bar */}
              <div className="space-y-2">
                <div className="flex justify-between font-sans text-xs font-bold text-gray-300">
                  <span>Progreso de Puntada</span>
                  <span>{stitchingRhythm}%</span>
                </div>
                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF85C0] via-[#FF2E93] to-[#C026D3] rounded-full transition-all duration-200" 
                    style={{ width: `${stitchingRhythm}%` }} 
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleStitchTap}
                className="w-full py-5 bg-[#FF2E93] hover:bg-[#FF85C0] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,46,147,0.5)] border border-[#FF85C0]/50"
              >
                🪡 ¡Dar Puntada Perfecta!
              </motion.button>

              <button
                onClick={() => setIsStitching(false)}
                className="text-xs font-sans text-gray-500 hover:text-gray-300 underline"
              >
                Cancelar costura
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📜 SECRET POEM RELIC MODAL */}
      <AnimatePresence>
        {showPoemRelic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPoemRelic(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-[#0E0F17] border border-[#FF85C0]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#FF85C0]">
                  Manuscrito Victoriano Secreto
                </span>
                <h3 className="font-serif font-bold text-2xl text-white">
                  Para Hannia
                </h3>
              </div>

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
                onClick={() => setShowPoemRelic(false)}
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
