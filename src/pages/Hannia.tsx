import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

type Garment = {
  id: string;
  name: string;
  category: string;
  color: string;
  metalness: number;
  roughness: number;
  pattern: 'lace' | 'velvet' | 'silk' | 'gold';
};

const GARMENTS: Garment[] = [
  { id: 'corset_black', name: 'Corsé Victoriano Ébano', category: 'Corsé', color: '#0A0A0E', metalness: 0.2, roughness: 0.6, pattern: 'lace' },
  { id: 'gown_pink', name: 'Vestido Lili de Noche', category: 'Vestido', color: '#FF2E93', metalness: 0.5, roughness: 0.2, pattern: 'silk' },
  { id: 'robe_velvet', name: 'Túnica de Terciopelo Gótico', category: 'Túnica', color: '#3A0025', metalness: 0.1, roughness: 0.8, pattern: 'velvet' },
  { id: 'gold_gala', name: 'Traje Real de Oro Victoriano', category: 'Gala', color: '#FFD700', metalness: 0.9, roughness: 0.1, pattern: 'gold' },
];

export default function Hannia() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mode Selection: 'studio3d' | 'runway3d' | 'rpg'
  const [mode, setMode] = useState<'studio3d' | 'runway3d' | 'rpg'>('studio3d');
  
  // 3D Customizer State
  const [selectedGarment, setSelectedGarment] = useState<Garment>(GARMENTS[0]);
  const [garmentColor, setGarmentColor] = useState<string>(GARMENTS[0].color);
  const [showLiliesOnDress, setShowLiliesOnDress] = useState(true);
  const [isRotatingRunway, setIsRotatingRunway] = useState(false);

  // RPG Game State
  const [rpgRoom, setRpgRoom] = useState<'atelier' | 'greenhouse' | 'crypt' | 'throne'>('atelier');
  const [bossHp, setBossHp] = useState(100);
  const [rpgScore, setRpgScore] = useState(0);
  const [showPoemScroll, setShowPoemScroll] = useState(false);
  const [piboMsg, setPiboMsg] = useState('Pibo listo para el atelier 3D y la exploración gótica.');

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const mannequinMeshRef = useRef<THREE.Mesh | null>(null);
  const dressMeshRef = useRef<THREE.Mesh | null>(null);
  const liliesGroupRef = useRef<THREE.Group | null>(null);

  // ════════════════════════════════════════════════════════════
  // 🎨 THREE.JS 3D WEBGL STUDIO SETUP
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mode === 'rpg') return;

    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080c);

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear previous canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting (Victorian Studio Spotlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pinkSpotlight = new THREE.SpotLight(0xff2e93, 3, 10, Math.PI / 4, 0.5);
    pinkSpotlight.position.set(2, 4, 2);
    scene.add(pinkSpotlight);

    const goldSpotlight = new THREE.SpotLight(0xffd700, 2, 10, Math.PI / 4, 0.5);
    goldSpotlight.position.set(-2, 3, -2);
    scene.add(goldSpotlight);

    // 3. Create 3D Victorian Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.2, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x12141f, roughness: 0.3, metalness: 0.8 });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.8;
    scene.add(pedestal);

    // 4. Create 3D Mannequin Core Body
    const mannequinGeo = new THREE.CylinderGeometry(0.25, 0.2, 1.4, 32);
    const mannequinMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.4 });
    const mannequin = new THREE.Mesh(mannequinGeo, mannequinMat);
    mannequin.position.y = 0.1;
    mannequinMeshRef.current = mannequin;
    scene.add(mannequin);

    // 5. Create 3D Dress Garment Mesh
    const dressGeo = new THREE.ConeGeometry(0.5, 1.1, 32, 1, true);
    const dressMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(garmentColor),
      metalness: selectedGarment.metalness,
      roughness: selectedGarment.roughness,
      side: THREE.DoubleSide,
    });
    const dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.y = -0.1;
    dressMeshRef.current = dress;
    scene.add(dress);

    // 6. Create 3D Lily Accents Group
    const liliesGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const lilyGeo = new THREE.DodecahedronGeometry(0.08);
      const lilyMat = new THREE.MeshStandardMaterial({ color: 0xff85c0, roughness: 0.1 });
      const lilyMesh = new THREE.Mesh(lilyGeo, lilyMat);
      const angle = (i / 5) * Math.PI * 2;
      lilyMesh.position.set(Math.cos(angle) * 0.42, -0.4, Math.sin(angle) * 0.42);
      liliesGroup.add(lilyMesh);
    }
    liliesGroupRef.current = liliesGroup;
    scene.add(liliesGroup);

    // 7. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (isRotatingRunway || mode === 'runway3d') {
        mannequin.rotation.y += 0.015;
        dress.rotation.y += 0.015;
        liliesGroup.rotation.y += 0.015;
        pedestal.rotation.y += 0.015;
      } else {
        // Floating ambient movement
        dress.position.y = -0.1 + Math.sin(elapsedTime * 2) * 0.02;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [mode, selectedGarment, isRotatingRunway]);

  // Update Material Properties Live
  useEffect(() => {
    if (dressMeshRef.current) {
      const mat = dressMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(garmentColor);
      mat.metalness = selectedGarment.metalness;
      mat.roughness = selectedGarment.roughness;
      mat.needsUpdate = true;
    }
    if (liliesGroupRef.current) {
      liliesGroupRef.current.visible = showLiliesOnDress;
    }
  }, [garmentColor, selectedGarment, showLiliesOnDress]);

  // ════════════════════════════════════════════════════════════
  // ⚔️ ACTION RPG COMBAT SYSTEM LOGIC
  // ════════════════════════════════════════════════════════════
  const handleAttackBoss = () => {
    if (bossHp <= 0) return;
    const damage = Math.floor(Math.random() * 20) + 15;
    const nextBossHp = Math.max(0, bossHp - damage);
    setBossHp(nextBossHp);
    setRpgScore((s) => s + 50);

    if (nextBossHp === 0) {
      setPiboMsg('🏆 ¡REINA ARAÑA DERROTADA! El Velo Oscuro ha sido liberado.');
      setShowPoemScroll(true);
    } else {
      setPiboMsg(`🪡 Disparo de Aguja de Plata: -${damage} HP a la Reina Araña.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E2DCE7] flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* 🖤 Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-[#FF2E93]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#3B001F]/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#FF85C0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* 👑 Mode Switcher Top Bar */}
      <header className="w-full max-w-md z-10 space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0D0E16] border border-[#FF85C0]/30 shadow-lg">
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF85C0]">
            Hannia • Atelier 3D & RPG
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 font-sans text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => { setMode('studio3d'); setIsRotatingRunway(false); }}
            className={`py-2.5 rounded-xl border transition-all ${
              mode === 'studio3d'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            👗 Atelier 3D
          </button>
          <button
            onClick={() => { setMode('runway3d'); setIsRotatingRunway(true); }}
            className={`py-2.5 rounded-xl border transition-all ${
              mode === 'runway3d'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            👑 Pasarela 3D
          </button>
          <button
            onClick={() => setMode('rpg')}
            className={`py-2.5 rounded-xl border transition-all ${
              mode === 'rpg'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            ⚔️ RPG Gótico
          </button>
        </div>
      </header>

      {/* 💬 Pibo Assistant */}
      <section className="w-full max-w-md z-10 my-2">
        <div className="bg-[#0A0C14]/90 p-3 rounded-2xl border border-[#FF85C0]/20 flex items-center gap-3 shadow-lg">
          <span className="text-2xl animate-bounce shrink-0">🐷🐝</span>
          <p className="font-serif italic text-xs text-gray-200 truncate">
            "{piboMsg}"
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 👗 MODE 1 & 2: THREE.JS 3D WEBGL STUDIO & RUNWAY MODE */}
      {/* ════════════════════════════════════════════════════════════ */}
      {(mode === 'studio3d' || mode === 'runway3d') && (
        <main className="w-full max-w-md z-10 my-1 flex-1 flex flex-col items-center justify-between space-y-3">
          {/* 3D WebGL Canvas Container */}
          <div className="w-full h-72 sm:h-80 rounded-3xl border-2 border-[#FF85C0]/30 shadow-2xl relative overflow-hidden bg-[#07080C]">
            <div ref={mountRef} className="w-full h-full" />

            {mode === 'runway3d' && (
              <div className="absolute top-3 left-4 font-sans text-[10px] font-bold uppercase tracking-widest text-[#FF85C0] bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                ✨ Pasarela 3D en Vivo • Cámara 360°
              </div>
            )}
          </div>

          {/* 🎨 3D Customizer Controls */}
          {mode === 'studio3d' && (
            <div className="w-full bg-[#0A0C14] p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-sans text-gray-400">
                <span className="font-bold text-[#FF85C0] uppercase tracking-wider">Diseños 3D</span>
                <span>Telas & Flores</span>
              </div>

              {/* Garment Selector */}
              <div className="grid grid-cols-2 gap-2">
                {GARMENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGarment(g);
                      setGarmentColor(g.color);
                      setPiboMsg(`Seleccionado: ${g.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-serif text-xs transition-all ${
                      selectedGarment.id === g.id
                        ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-white'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-bold">{g.name}</p>
                    <p className="font-sans text-[9px] text-[#FF85C0] uppercase">{g.category}</p>
                  </button>
                ))}
              </div>

              {/* Color Picker & Lily Accent Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[10px] uppercase text-gray-400">Color:</span>
                  {['#0A0A0E', '#FF2E93', '#3A0025', '#FFD700', '#4A0033'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setGarmentColor(c)}
                      className="size-6 rounded-full border-2 border-white/20 shadow-md transition-transform active:scale-90"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setShowLiliesOnDress(!showLiliesOnDress)}
                  className={`px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    showLiliesOnDress
                      ? 'bg-[#FF2E93] text-white border-[#FF85C0]'
                      : 'bg-white/5 text-gray-400 border-white/5'
                  }`}
                >
                  🌸 Lilis 3D
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ⚔️ MODE 3: GOTHIC ACTION RPG & BOSS FIGHT */}
      {/* ════════════════════════════════════════════════════════════ */}
      {mode === 'rpg' && (
        <main className="w-full max-w-md z-10 my-1 flex-1 flex flex-col items-center justify-between space-y-3">
          {/* RPG Room Selector */}
          <div className="w-full grid grid-cols-4 gap-1.5 font-sans text-[10px] font-bold uppercase tracking-wider">
            {[
              { id: 'atelier', name: 'Atelier' },
              { id: 'greenhouse', name: 'Invernadero' },
              { id: 'crypt', name: 'Cripta Araña' },
              { id: 'throne', name: 'Trono Velo' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRpgRoom(r.id as any)}
                className={`py-2 rounded-xl border transition-all ${
                  rpgRoom === r.id
                    ? 'bg-[#FF2E93] text-white border-[#FF85C0]'
                    : 'bg-[#0A0C14] text-gray-400 border-white/5'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* RPG Screen Area */}
          <div className="w-full h-72 sm:h-80 bg-[#07080C] rounded-3xl border-2 border-[#FF85C0]/40 p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl">
            {/* Header: Player HP & Score */}
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-red-400">Pibo HP: ❤️❤️❤️</span>
              <span className="font-bold text-[#FF85C0]">XP Score: {rpgScore} pts</span>
            </div>

            {/* Room 1: Atelier */}
            {rpgRoom === 'atelier' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block">🧵👗</span>
                <h3 className="font-serif font-bold text-lg text-white">El Taller de Seda Negra</h3>
                <p className="font-sans text-xs text-gray-400">Pibo está trazando los patrones victorianos sobre el maniquí.</p>
                <button
                  onClick={() => { setRpgScore((s) => s + 30); setPiboMsg('🧵 +30 XP por confeccionar encajes góticos.'); }}
                  className="py-2.5 px-6 bg-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg"
                >
                  🪡 Confeccionar Prenda (+30 XP)
                </button>
              </div>
            )}

            {/* Room 2: Invernadero */}
            {rpgRoom === 'greenhouse' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block">🥀🌸</span>
                <h3 className="font-serif font-bold text-lg text-white">Invernadero de Lilis Marianas</h3>
                <p className="font-sans text-xs text-gray-400">Riega las flores de ébano para recargar tu magia gótica.</p>
                <button
                  onClick={() => { setRpgScore((s) => s + 25); setPiboMsg('💧 Lilis regadas. +25 XP cosechados.'); }}
                  className="py-2.5 px-6 bg-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg"
                >
                  💧 Regar Lilis (+25 XP)
                </button>
              </div>
            )}

            {/* Room 3: Cripta & Boss Fight */}
            {rpgRoom === 'crypt' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block animate-pulse">🕷️👑</span>
                <h3 className="font-serif font-bold text-lg text-red-400">Jefe: Reina Araña de la Seda</h3>
                
                {/* Boss Health Bar */}
                <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${bossHp}%` }} />
                </div>
                <p className="font-sans text-[10px] text-gray-400">Boss HP: {bossHp}/100</p>

                <button
                  onClick={handleAttackBoss}
                  className="py-3 px-8 bg-gradient-to-r from-red-600 to-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg active:scale-95"
                >
                  🪡 Disparar Aguja de Plata
                </button>
              </div>
            )}

            {/* Room 4: Sala del Trono */}
            {rpgRoom === 'throne' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block">📜⚜️</span>
                <h3 className="font-serif font-bold text-lg text-amber-400">La Sala del Velo Oscuro</h3>
                <p className="font-sans text-xs text-gray-400">El manuscrito secreto reposa sobre el pedestal de oro.</p>
                <button
                  onClick={() => setShowPoemScroll(true)}
                  className="py-3 px-6 bg-gradient-to-r from-amber-500 to-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
                >
                  📜 Leer Manuscrito Secreto
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* 📜 SECRET POEM RELIC MODAL */}
      <AnimatePresence>
        {showPoemScroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#050508]/85 backdrop-blur-md" />

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative w-full max-w-sm bg-[#0E0F17] border-2 border-[#FF85C0]/60 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="space-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#FF85C0]">
                  Manuscrito Victoriano Secreto
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
                <span>Atelier Hannia 3D</span>
                <span>Pibo & Andrés</span>
              </div>

              <button
                onClick={() => setShowPoemScroll(false)}
                className="w-full py-3.5 bg-[#FF2E93] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#FF85C0] transition-colors shadow-lg"
              >
                Cerrar Manuscrito ✨
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
