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
  shape: 'corset' | 'gown' | 'robe' | 'gala';
};

const GARMENTS: Garment[] = [
  { id: 'gown_pink', name: 'Vestido Lili Magenta', category: 'Vestido', color: '#FF2E93', metalness: 0.4, roughness: 0.2, shape: 'gown' },
  { id: 'corset_black', name: 'Corsé Victoriano Ébano', category: 'Corsé', color: '#16161F', metalness: 0.3, roughness: 0.5, shape: 'corset' },
  { id: 'robe_velvet', name: 'Túnica de Terciopelo Gótico', category: 'Túnica', color: '#4A0025', metalness: 0.1, roughness: 0.8, shape: 'robe' },
  { id: 'gold_gala', name: 'Traje Real Oro Victoriano', category: 'Gala', color: '#FFD700', metalness: 0.85, roughness: 0.15, shape: 'gala' },
];

export default function Hannia() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'atelier3d' | 'pasarela' | 'rpg'>('atelier3d');

  // Customizer State
  const [selectedGarment, setSelectedGarment] = useState<Garment>(GARMENTS[0]);
  const [currentColor, setCurrentColor] = useState<string>(GARMENTS[0].color);
  const [hasLilies, setHasLilies] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // RPG State
  const [rpgRoom, setRpgRoom] = useState<'atelier' | 'greenhouse' | 'boss'>('atelier');
  const [bossHp, setBossHp] = useState(100);
  const [xp, setXp] = useState(40);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Pibo en el Atelier 3D: Desliza con tu dedo para rotar el vestido 3D.');

  // Three.js References
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const dressMeshRef = useRef<THREE.Mesh | null>(null);
  const dressMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const liliesGroupRef = useRef<THREE.Group | null>(null);
  
  // Touch / Mouse Drag Rotation State
  const isDraggingRef = useRef(false);
  const previousTouchX = useRef(0);

  // ════════════════════════════════════════════════════════════
  // 🎨 THREE.JS 3D WEBGL STUDIO SETUP (PERFECT CAMERA & MESH FIT)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab === 'rpg') return;

    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(300, container.clientWidth || 360);
    const height = Math.max(340, container.clientHeight || 340);

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080c);

    // 2. Camera (Positioned to fit full mannequin + dress from top to bottom)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const pinkSpotlight = new THREE.SpotLight(0xff2e93, 3, 10, Math.PI / 3, 0.5);
    pinkSpotlight.position.set(2.5, 3, 2.5);
    scene.add(pinkSpotlight);

    const goldSpotlight = new THREE.SpotLight(0xffd700, 2.2, 10, Math.PI / 3, 0.5);
    goldSpotlight.position.set(-2.5, 2, -2);
    scene.add(goldSpotlight);

    // 5. Main Model Group (Centered at 0,0,0)
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Victorian Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.15, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x121420, roughness: 0.3, metalness: 0.8 });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.0;
    modelGroup.add(pedestal);

    // Mannequin Upper Torso
    const mannequinGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.9, 32);
    const mannequinMat = new THREE.MeshStandardMaterial({ color: 0x1f2233, roughness: 0.4 });
    const mannequin = new THREE.Mesh(mannequinGeo, mannequinMat);
    mannequin.position.y = 0.2;
    modelGroup.add(mannequin);

    // Mannequin Neck / Head Stand
    const headGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1f2233, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.72;
    modelGroup.add(head);

    // Crown on top of head
    const crownGeo = new THREE.ConeGeometry(0.1, 0.16, 5);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.88;
    crown.rotation.z = Math.PI;
    modelGroup.add(crown);

    // Victorian Dress Geometry (Elegant Skirt & Bodice Silhouette)
    const dressGeo = new THREE.CylinderGeometry(0.22, 0.65, 1.1, 32);
    const dressMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentColor),
      metalness: selectedGarment.metalness,
      roughness: selectedGarment.roughness,
      side: THREE.DoubleSide,
    });
    dressMaterialRef.current = dressMat;

    const dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.y = -0.3;
    dressMeshRef.current = dress;
    modelGroup.add(dress);

    // 3D Lilies Ring around waist
    const liliesGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const lGeo = new THREE.DodecahedronGeometry(0.065);
      const lMat = new THREE.MeshStandardMaterial({ color: 0xff85c0, roughness: 0.1 });
      const lMesh = new THREE.Mesh(lGeo, lMat);
      const angle = (i / 6) * Math.PI * 2;
      lMesh.position.set(Math.cos(angle) * 0.35, -0.05, Math.sin(angle) * 0.35);
      liliesGroup.add(lMesh);
    }
    liliesGroupRef.current = liliesGroup;
    modelGroup.add(liliesGroup);

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (isAutoRotating || activeTab === 'pasarela') {
        modelGroup.rotation.y += 0.012;
      } else if (!isDraggingRef.current) {
        modelGroup.position.y = Math.sin(elapsed * 2) * 0.02;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(340, container.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeTab, selectedGarment, isAutoRotating]);

  // Sync Color and Lilies visibility live
  useEffect(() => {
    if (dressMaterialRef.current) {
      dressMaterialRef.current.color.set(currentColor);
      dressMaterialRef.current.metalness = selectedGarment.metalness;
      dressMaterialRef.current.roughness = selectedGarment.roughness;
      dressMaterialRef.current.needsUpdate = true;
    }
    if (liliesGroupRef.current) {
      liliesGroupRef.current.visible = hasLilies;
    }
  }, [currentColor, selectedGarment, hasLilies]);

  // Touch & Mouse Drag 360 Controls
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    previousTouchX.current = pageX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const deltaX = pageX - previousTouchX.current;
    modelGroupRef.current.rotation.y += deltaX * 0.015;
    previousTouchX.current = pageX;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // RPG Boss Attack
  const handleAttackSpider = () => {
    if (bossHp <= 0) return;
    const dmg = 25;
    const nextHp = Math.max(0, bossHp - dmg);
    setBossHp(nextHp);
    setXp((x) => x + 35);

    if (nextHp === 0) {
      setStatusMsg('🏆 ¡REINA ARAÑA DERROTADA! Se desbloqueó el manuscrito secreto.');
      setShowScrollModal(true);
    } else {
      setStatusMsg(`🪡 Disparo de Aguja de Plata: -${dmg} HP. Quedan ${nextHp} HP.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E2DCE7] flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-serif selection:bg-[#FF2E93] selection:text-white">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-[#FF2E93]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#3B001F]/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#FF85C0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Header Bar */}
      <header className="w-full max-w-md z-10 space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0D0E16] border border-[#FF85C0]/30 shadow-lg">
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF85C0]">
            Hannia • Atelier 3D & RPG
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 font-sans text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('atelier3d'); setIsAutoRotating(false); }}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'atelier3d'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            👗 Atelier 3D
          </button>
          <button
            onClick={() => { setActiveTab('pasarela'); setIsAutoRotating(true); }}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'pasarela'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            👑 Pasarela 360°
          </button>
          <button
            onClick={() => setActiveTab('rpg')}
            className={`py-2.5 rounded-xl border transition-all ${
              activeTab === 'rpg'
                ? 'bg-[#FF2E93] text-white border-[#FF85C0] shadow-[0_0_15px_rgba(255,46,147,0.4)]'
                : 'bg-[#0D0E16] text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            ⚔️ RPG Gótico
          </button>
        </div>
      </header>

      {/* Status Bar */}
      <section className="w-full max-w-md z-10 my-2">
        <div className="bg-[#0A0C14]/90 p-3 rounded-2xl border border-[#FF85C0]/20 flex items-center gap-3 shadow-lg">
          <span className="text-2xl animate-bounce shrink-0">🐷🐝</span>
          <p className="font-serif italic text-xs text-gray-200 truncate">
            "{statusMsg}"
          </p>
        </div>
      </section>

      {/* 👗 TAB 1 & 2: THREE.JS 3D WEBGL STUDIO & RUNWAY */}
      {(activeTab === 'atelier3d' || activeTab === 'pasarela') && (
        <main className="w-full max-w-md z-10 my-1 flex-1 flex flex-col items-center justify-between space-y-3">
          {/* 3D Canvas Container */}
          <div
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-80 rounded-3xl border-2 border-[#FF85C0]/40 shadow-2xl relative overflow-hidden bg-[#07080C] cursor-grab active:cursor-grabbing select-none"
          >
            <div ref={mountRef} className="w-full h-full" />

            <div className="absolute top-3 left-4 font-sans text-[10px] font-bold uppercase tracking-widest text-[#FF85C0] bg-black/70 px-3 py-1 rounded-full backdrop-blur-md">
              {activeTab === 'pasarela' ? '✨ Pasarela 360° en Vivo' : '👈 Desliza para rotar 3D 👉'}
            </div>
          </div>

          {/* 3D Customizer Panel */}
          {activeTab === 'atelier3d' && (
            <div className="w-full bg-[#0A0C14] p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-sans text-gray-400">
                <span className="font-bold text-[#FF85C0] uppercase tracking-wider">Diseños Haute Couture</span>
                <span>Telas & Flores</span>
              </div>

              {/* Garment Selector */}
              <div className="grid grid-cols-2 gap-2">
                {GARMENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGarment(g);
                      setCurrentColor(g.color);
                      setStatusMsg(`Diseño aplicado: ${g.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-serif text-xs transition-all ${
                      selectedGarment.id === g.id
                        ? 'bg-[#FF2E93]/25 border-[#FF2E93] text-white shadow-md'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-bold">{g.name}</p>
                    <p className="font-sans text-[9px] text-[#FF85C0] uppercase">{g.category}</p>
                  </button>
                ))}
              </div>

              {/* Color & Lily Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[10px] uppercase text-gray-400">Color:</span>
                  {['#FF2E93', '#16161F', '#4A0025', '#FFD700', '#2E004F'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrentColor(c)}
                      className="size-6 rounded-full border-2 border-white/20 shadow-md transition-transform active:scale-90"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setHasLilies(!hasLilies)}
                  className={`px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    hasLilies
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

      {/* ⚔️ TAB 3: GOTHIC ACTION RPG */}
      {activeTab === 'rpg' && (
        <main className="w-full max-w-md z-10 my-1 flex-1 flex flex-col items-center justify-between space-y-3">
          {/* Room Selector */}
          <div className="w-full grid grid-cols-3 gap-2 font-sans text-[10px] font-bold uppercase tracking-wider">
            {[
              { id: 'atelier', name: 'Atelier' },
              { id: 'greenhouse', name: 'Invernadero' },
              { id: 'boss', name: 'Reina Araña' },
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

          {/* RPG Canvas Area */}
          <div className="w-full h-80 bg-[#07080C] rounded-3xl border-2 border-[#FF85C0]/40 p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-red-400">Pibo HP: ❤️❤️❤️</span>
              <span className="font-bold text-[#FF85C0]">XP: {xp} pts</span>
            </div>

            {rpgRoom === 'atelier' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block">🧵👗</span>
                <h3 className="font-serif font-bold text-lg text-white">Taller de Costura Victoriana</h3>
                <p className="font-sans text-xs text-gray-400">Confecciona vestidos góticos para aumentar tus estadísticas.</p>
                <button
                  onClick={() => { setXp((x) => x + 30); setStatusMsg('🧵 +30 XP por confeccionar encajes góticos.'); }}
                  className="py-2.5 px-6 bg-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg active:scale-95"
                >
                  🪡 Confeccionar Prenda (+30 XP)
                </button>
              </div>
            )}

            {rpgRoom === 'greenhouse' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block">🥀🌸</span>
                <h3 className="font-serif font-bold text-lg text-white">Invernadero de Lilis Marianas</h3>
                <p className="font-sans text-xs text-gray-400">Riega las flores de ébano para recargar la energía del castillo.</p>
                <button
                  onClick={() => { setXp((x) => x + 25); setStatusMsg('💧 Lilis regadas. +25 XP cosechados.'); }}
                  className="py-2.5 px-6 bg-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg active:scale-95"
                >
                  💧 Regar Lilis (+25 XP)
                </button>
              </div>
            )}

            {rpgRoom === 'boss' && (
              <div className="text-center space-y-3 my-auto">
                <span className="text-5xl block animate-pulse">🕷️👑</span>
                <h3 className="font-serif font-bold text-lg text-red-400">Jefe: Reina Araña de la Seda</h3>
                
                <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${bossHp}%` }} />
                </div>
                <p className="font-sans text-[10px] text-gray-400">Boss HP: {bossHp}/100</p>

                <button
                  onClick={handleAttackSpider}
                  className="py-3 px-8 bg-gradient-to-r from-red-600 to-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg active:scale-95"
                >
                  🪡 Disparar Aguja de Plata
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Secret Poem Modal */}
      <AnimatePresence>
        {showScrollModal && (
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
                onClick={() => setShowScrollModal(false)}
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
