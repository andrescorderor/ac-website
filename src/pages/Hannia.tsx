import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Entity = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'thread' | 'lace' | 'lily' | 'enemy' | 'projectile';
  speedY?: number;
  speedX?: number;
};

export default function Hannia() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game Status
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'victory'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [threadCount, setThreadCount] = useState(0);
  const [laceCount, setLaceCount] = useState(0);
  const [lilyCount, setLilyCount] = useState(0);
  const [showPoem, setShowPoem] = useState(false);

  // Character Position & Physics
  const playerRef = useRef({
    x: 180,
    y: 350,
    radius: 20,
    vy: 0,
    vx: 0,
  });

  const keysRef = useRef<{ left: boolean; right: boolean; up: boolean; down: boolean }>({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const entitiesRef = useRef<Entity[]>([]);
  const projectilesRef = useRef<Entity[]>([]);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const { data } = await supabase
        .from('hannia_game_save')
        .select('xp, thread_count')
        .eq('user_tag', 'hannia_main')
        .single();
      if (data) {
        setHighScore(data.xp || 0);
      }
    } catch {
      // Fallback local
    }
  };

  const saveHighScore = async (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        await supabase.from('hannia_game_save').upsert({
          user_tag: 'hannia_main',
          xp: finalScore,
          thread_count: threadCount,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Fallback
      }
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setThreadCount(0);
    setLaceCount(0);
    setLilyCount(0);
    setShowPoem(false);
    playerRef.current = { x: 180, y: 350, radius: 20, vy: 0, vx: 0 };
    entitiesRef.current = [];
    projectilesRef.current = [];
    setGameState('playing');
  };

  // Main 60FPS Canvas Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let frameCount = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateAndDraw = () => {
      frameCount++;
      const p = playerRef.current;

      // 1. Move Player
      if (keysRef.current.left) p.x -= 5;
      if (keysRef.current.right) p.x += 5;
      if (keysRef.current.up) p.y -= 5;
      if (keysRef.current.down) p.y += 5;

      // Boundary clamp
      p.x = Math.max(25, Math.min(canvas.width - 25, p.x));
      p.y = Math.max(25, Math.min(canvas.height - 25, p.y));

      // 2. Spawn Collectibles & Enemies
      if (frameCount % 60 === 0) {
        const types: ('thread' | 'lace' | 'lily' | 'enemy')[] = ['thread', 'lace', 'lily', 'enemy'];
        const chosenType = types[Math.floor(Math.random() * (frameCount > 300 ? 4 : 3))];
        entitiesRef.current.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -20,
          width: 26,
          height: 26,
          type: chosenType,
          speedY: Math.random() * 2 + 1.5,
        });
      }

      // 3. Clear Background (Dark Victorian Theme)
      ctx.fillStyle = '#07080C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Pattern
      ctx.strokeStyle = 'rgba(255, 133, 192, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 4. Update & Draw Projectiles
      projectilesRef.current.forEach((proj, index) => {
        proj.y -= 7;
        ctx.fillStyle = '#FF2E93';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Check collision with Enemies
        entitiesRef.current.forEach((e, eIndex) => {
          if (e.type === 'enemy') {
            const dist = Math.hypot(proj.x - e.x, proj.y - e.y);
            if (dist < 20) {
              // Destroy Enemy!
              entitiesRef.current.splice(eIndex, 1);
              projectilesRef.current.splice(index, 1);
              setScore((s) => s + 20);
            }
          }
        });

        if (proj.y < 0) projectilesRef.current.splice(index, 1);
      });

      // 5. Update & Draw Entities
      entitiesRef.current.forEach((e, index) => {
        e.y += e.speedY || 2;

        // Draw Entity
        ctx.font = '20px serif';
        if (e.type === 'thread') ctx.fillText('🧵', e.x - 10, e.y + 8);
        else if (e.type === 'lace') ctx.fillText('🕸️', e.x - 10, e.y + 8);
        else if (e.type === 'lily') ctx.fillText('🌸', e.x - 10, e.y + 8);
        else if (e.type === 'enemy') ctx.fillText('🕷️', e.x - 10, e.y + 8);

        // Player Collision Detection
        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist < p.radius + 12) {
          if (e.type === 'thread') {
            setThreadCount((t) => t + 1);
            setScore((s) => s + 10);
          } else if (e.type === 'lace') {
            setLaceCount((l) => l + 1);
            setScore((s) => s + 15);
          } else if (e.type === 'lily') {
            setLilyCount((l) => l + 1);
            setScore((s) => s + 25);
          } else if (e.type === 'enemy') {
            setLives((l) => {
              const nextLives = l - 1;
              if (nextLives <= 0) {
                setGameState('gameover');
              }
              return nextLives;
            });
          }

          entitiesRef.current.splice(index, 1);
        }

        // Remove offscreen
        if (e.y > canvas.height + 30) {
          entitiesRef.current.splice(index, 1);
        }
      });

      // 6. Draw Player (Pibo Mascot 🐷🐝)
      ctx.save();
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 15;
      ctx.font = '32px serif';
      ctx.fillText('🐷🐝', p.x - 18, p.y + 12);
      ctx.restore();

      // Check Victory Condition (500 pts or 5 lilies)
      if (score >= 300 && gameState === 'playing') {
        saveHighScore(score);
        setGameState('victory');
        setShowPoem(true);
      } else {
        animId = requestAnimationFrame(updateAndDraw);
      }
    };

    animId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score]);

  const shootMagic = () => {
    if (gameState !== 'playing') return;
    projectilesRef.current.push({
      x: playerRef.current.x,
      y: playerRef.current.y - 15,
      width: 10,
      height: 10,
      type: 'projectile',
    });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E2DCE7] flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* 👑 HUD Top Header */}
      <header className="w-full max-w-md z-10 space-y-2 text-center">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0D0E16] rounded-2xl border border-[#FF85C0]/20 shadow-xl font-sans text-xs">
          <div className="flex items-center gap-1 text-[#FF85C0] font-bold">
            <span>❤️</span>
            <span>{Array(lives).fill('❤️').join('')}</span>
          </div>

          <div className="font-bold text-white uppercase tracking-wider">
            Score: <span className="text-[#FF85C0]">{score}</span>
          </div>

          <div className="text-[10px] text-gray-400">
            Máx: <span className="text-amber-400 font-bold">{highScore}</span>
          </div>
        </div>

        {/* Resources Inventory */}
        <div className="flex items-center justify-around bg-[#0A0C14] px-4 py-1.5 rounded-xl border border-white/5 font-sans text-[11px]">
          <span>🧵 {threadCount}</span>
          <span>🕸️ {laceCount}</span>
          <span>🌸 {lilyCount}</span>
        </div>
      </header>

      {/* 🕹️ 2D CANVAS GAME SCREEN */}
      <main className="w-full max-w-md z-10 my-2 flex-1 flex flex-col items-center justify-center relative">
        <div className="relative border-2 border-[#FF85C0]/40 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(255,46,147,0.3)] bg-[#07080C]">
          <canvas
            ref={canvasRef}
            width={360}
            height={420}
            className="w-full h-auto block"
          />

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="size-16 rounded-2xl bg-[#FF2E93]/20 border border-[#FF85C0] flex items-center justify-center text-4xl shadow-xl">
                🐷🐝
              </div>
              <h2 className="font-serif font-bold text-2xl text-white">
                Pibo's Atelier Quest
              </h2>
              <p className="font-sans text-xs text-gray-300 max-w-xs leading-relaxed">
                Ayuda a Pibo a recolectar hilos 🧵, encajes 🕸️ y lilis 🌸 evitando las arañas 🕷️. ¡Alcanza 300 pts para ganar!
              </p>
              <button
                onClick={startGame}
                className="py-3.5 px-8 bg-[#FF2E93] hover:bg-[#FF85C0] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-95"
              >
                🎮 Iniciar Videojuego
              </button>
            </div>
          )}

          {/* Gameover Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
              <span className="text-4xl">🕷️</span>
              <h3 className="font-serif font-bold text-2xl text-red-500">Game Over</h3>
              <p className="font-sans text-xs text-gray-300">Puntaje logrado: {score} pts</p>
              <button
                onClick={startGame}
                className="py-3 px-6 bg-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg"
              >
                🔄 Reintentar
              </button>
            </div>
          )}
        </div>

        {/* 🎮 ON-SCREEN TOUCH CONTROLS (Mobile Gamepad) */}
        {gameState === 'playing' && (
          <div className="w-full max-w-md mt-3 grid grid-cols-2 gap-4 z-20 font-sans select-none">
            {/* D-Pad Touch Joystick */}
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
              <div />
              <button
                onMouseDown={() => (keysRef.current.up = true)}
                onMouseUp={() => (keysRef.current.up = false)}
                onTouchStart={() => (keysRef.current.up = true)}
                onTouchEnd={() => (keysRef.current.up = false)}
                className="p-3 bg-[#12141F] active:bg-[#FF2E93] border border-white/10 rounded-xl text-center font-bold text-white shadow-md"
              >
                ▲
              </button>
              <div />

              <button
                onMouseDown={() => (keysRef.current.left = true)}
                onMouseUp={() => (keysRef.current.left = false)}
                onTouchStart={() => (keysRef.current.left = true)}
                onTouchEnd={() => (keysRef.current.left = false)}
                className="p-3 bg-[#12141F] active:bg-[#FF2E93] border border-white/10 rounded-xl text-center font-bold text-white shadow-md"
              >
                ◀
              </button>
              <div className="p-3 bg-[#0A0C14] rounded-xl flex items-center justify-center text-[10px] text-gray-500">
                Pibo
              </div>
              <button
                onMouseDown={() => (keysRef.current.right = true)}
                onMouseUp={() => (keysRef.current.right = false)}
                onTouchStart={() => (keysRef.current.right = true)}
                onTouchEnd={() => (keysRef.current.right = false)}
                className="p-3 bg-[#12141F] active:bg-[#FF2E93] border border-white/10 rounded-xl text-center font-bold text-white shadow-md"
              >
                ▶
              </button>

              <div />
              <button
                onMouseDown={() => (keysRef.current.down = true)}
                onMouseUp={() => (keysRef.current.down = false)}
                onTouchStart={() => (keysRef.current.down = true)}
                onTouchEnd={() => (keysRef.current.down = false)}
                className="p-3 bg-[#12141F] active:bg-[#FF2E93] border border-white/10 rounded-xl text-center font-bold text-white shadow-md"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Action Buttons: Disparar Aguja / Polen */}
            <div className="flex flex-col justify-center items-center gap-2">
              <button
                onClick={shootMagic}
                className="w-full py-4 bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,46,147,0.5)] border border-[#FF85C0]/40 active:scale-95"
              >
                🪡 Disparar Aguja
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 📜 VICTORY POEM RELIC MODAL */}
      <AnimatePresence>
        {(showPoem || gameState === 'victory') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative w-full max-w-sm bg-[#0E0F17] border-2 border-[#FF85C0]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,46,147,0.4)] z-10 text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#FF85C0]">
                  🏆 ¡VICTORIA! Manuscrito Desbloqueado
                </span>
                <h3 className="font-serif font-bold text-2xl text-white">
                  Para Hannia
                </h3>
              </div>

              <div className="bg-[#050508] p-6 rounded-2xl border border-white/10 space-y-3 font-serif italic text-sm text-[#E2DCE7] leading-relaxed text-left shadow-inner">
                <p>"Entre agujas de plata y seda victoriana,</p>
                <p>florecen lirios negros en tu oscuro jardín,</p>
                <p>Pibo guarda el secreto que tu diseño emana,</p>
                <p>donde la alta costura y el misterio no tienen fin."</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-sans text-gray-400 pt-2 border-t border-white/10">
                <span>Atelier Hannia</span>
                <span>Puntaje: {score} pts</span>
              </div>

              <button
                onClick={() => { setShowPoem(false); setGameState('menu'); }}
                className="w-full py-3.5 bg-[#FF2E93] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#FF85C0] transition-colors shadow-lg"
              >
                Volver al Menú 🎮
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
