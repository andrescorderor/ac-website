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
};

const GARMENTS: Garment[] = [
  { id: 'gown_pink', name: 'Vestido Lili Magenta', category: 'Vestido', color: '#FF2E93', metalness: 0.4, roughness: 0.2 },
  { id: 'corset_black', name: 'Corsé Victoriano Ébano', category: 'Corsé', color: '#16161F', metalness: 0.3, roughness: 0.5 },
  { id: 'robe_velvet', name: 'Túnica de Terciopelo Gótico', category: 'Túnica', color: '#4A0025', metalness: 0.1, roughness: 0.8 },
  { id: 'gold_gala', name: 'Traje Real Oro Victoriano', category: 'Gala', color: '#FFD700', metalness: 0.85, roughness: 0.15 },
];

export default function Hannia() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rpgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab State: 'atelier3d' | 'pasarela' | 'rpg'
  const [activeTab, setActiveTab] = useState<'atelier3d' | 'pasarela' | 'rpg'>('atelier3d');

  // Customizer State
  const [selectedGarment, setSelectedGarment] = useState<Garment>(GARMENTS[0]);
  const [currentColor, setCurrentColor] = useState<string>(GARMENTS[0].color);
  const [hasLilies, setHasLilies] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // RPG Interactive Canvas State
  const [rpgRoom, setRpgRoom] = useState<'atelier' | 'greenhouse' | 'boss'>('atelier');
  const [xp, setXp] = useState(60);
  const [lives] = useState(3);
  const [bossHp, setBossHp] = useState(100);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Pibo listo para el Atelier 3D y la exploración gótica.');

  // Three.js References
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const dressMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const liliesGroupRef = useRef<THREE.Group | null>(null);
  
  // Touch / Mouse Drag Rotation State
  const isDraggingRef = useRef(false);
  const previousTouchX = useRef(0);

  // RPG 2D Canvas Animation Engine
  const rpgPlayerRef = useRef({ x: 180, y: 220, targetX: 180, targetY: 220 });
  const rpgSparksRef = useRef<{ x: number; y: number; life: number; color: string }[]>([]);

  // ════════════════════════════════════════════════════════════
  // 🎨 THREE.JS 3D WEBGL STUDIO SETUP
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab === 'rpg') return;

    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(300, container.clientWidth || 360);
    const height = Math.max(340, container.clientHeight || 340);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080c);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const pinkSpotlight = new THREE.SpotLight(0xff2e93, 3, 10, Math.PI / 3, 0.5);
    pinkSpotlight.position.set(2.5, 3, 2.5);
    scene.add(pinkSpotlight);

    const goldSpotlight = new THREE.SpotLight(0xffd700, 2.2, 10, Math.PI / 3, 0.5);
    goldSpotlight.position.set(-2.5, 2, -2);
    scene.add(goldSpotlight);

    // Main Model Group
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.15, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x121420, roughness: 0.3, metalness: 0.8 });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.0;
    modelGroup.add(pedestal);

    // Mannequin Core & Head
    const mannequinGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.9, 32);
    const mannequinMat = new THREE.MeshStandardMaterial({ color: 0x1f2233, roughness: 0.4 });
    const mannequin = new THREE.Mesh(mannequinGeo, mannequinMat);
    mannequin.position.y = 0.2;
    modelGroup.add(mannequin);

    const headGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1f2233, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.72;
    modelGroup.add(head);

    const crownGeo = new THREE.ConeGeometry(0.1, 0.16, 5);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.88;
    crown.rotation.z = Math.PI;
    modelGroup.add(crown);

    // Dress Mesh
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
    modelGroup.add(dress);

    // Lilies Group
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

    // Animation Loop
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

  // Touch Drag
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

  // ════════════════════════════════════════════════════════════
  // 🎮 RPG 2D CANVAS ACTION ENGINE (REAL-TIME ANIMATED STAGE)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab !== 'rpg') return;

    const canvas = rpgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const renderRpgFrame = () => {
      frame++;
      const p = rpgPlayerRef.current;

      // Smooth Pibo Movement towards target
      p.x += (p.targetX - p.x) * 0.1;
      p.y += (p.targetY - p.y) * 0.1;

      // 1. Draw Room Background
      ctx.fillStyle = '#07080C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient Floor Grid & Glow
      ctx.strokeStyle = 'rgba(255, 133, 192, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 2. Room Content Render
      if (rpgRoom === 'atelier') {
        // Draw Mannequin Stand
        ctx.font = '40px serif';
        ctx.fillText('👗', canvas.width / 2 - 20, 140);
        ctx.font = '24px serif';
        ctx.fillText('🧵', 60, 180 + Math.sin(frame * 0.05) * 5);
        ctx.fillText('🪡', canvas.width - 80, 180 + Math.cos(frame * 0.05) * 5);

        ctx.fillStyle = '#FF85C0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Atelier de Seda: Toca la pantalla para mover a Pibo', canvas.width / 2, 40);
      } else if (rpgRoom === 'greenhouse') {
        // Floating Lilies & Pollen Spores
        ctx.font = '42px serif';
        ctx.fillText('🥀', 70, 150);
        ctx.fillText('🌸', canvas.width - 100, 150);
        ctx.fillText('🌺', canvas.width / 2 - 20, 180 + Math.sin(frame * 0.08) * 8);

        ctx.fillStyle = '#FF85C0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Invernadero: Pibo recolecta polen mariano', canvas.width / 2, 40);
      } else if (rpgRoom === 'boss') {
        // Animated Boss Spider
        const spiderY = 130 + Math.sin(frame * 0.06) * 10;
        ctx.font = '54px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕷️', canvas.width / 2, spiderY);

        // Boss Crown
        ctx.font = '20px serif';
        ctx.fillText('👑', canvas.width / 2, spiderY - 35);

        // Boss HP Bar Above Spider
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(canvas.width / 2 - 60, spiderY - 60, 120, 8);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(canvas.width / 2 - 60, spiderY - 60, (120 * bossHp) / 100, 8);
      }

      // 3. Render Sparks Particles
      rpgSparksRef.current.forEach((sp, idx) => {
        sp.y -= 2;
        sp.life -= 0.04;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (sp.life <= 0) rpgSparksRef.current.splice(idx, 1);
      });

      // 4. Render Player Pibo (🐷🐝)
      ctx.save();
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 18;
      ctx.font = '34px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐷🐝', p.x, p.y);
      ctx.restore();

      animId = requestAnimationFrame(renderRpgFrame);
    };

    animId = requestAnimationFrame(renderRpgFrame);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, rpgRoom, bossHp]);

  // Touch Rpg Canvas Tap
  const handleRpgCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = rpgCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    rpgPlayerRef.current.targetX = clickX;
    rpgPlayerRef.current.targetY = clickY;

    // Spawn sparks
    for (let i = 0; i < 5; i++) {
      rpgSparksRef.current.push({
        x: clickX + (Math.random() * 20 - 10),
        y: clickY + (Math.random() * 20 - 10),
        life: 1,
        color: '#FF85C0',
      });
    }

    if (rpgRoom === 'atelier') {
      setXp((x) => x + 15);
      setStatusMsg('🧵 Pibo hiló seda victoriana en el atelier (+15 XP).');
    } else if (rpgRoom === 'greenhouse') {
      setXp((x) => x + 20);
      setStatusMsg('🌸 Pibo regó las lilis marianas (+20 XP).');
    }
  };

  // Boss Attack Action
  const handleAttackSpider = () => {
    if (bossHp <= 0) return;

    // Move Pibo to Boss & Spawn Magic Sparks
    rpgPlayerRef.current.targetX = 180;
    rpgPlayerRef.current.targetY = 160;

    for (let i = 0; i < 12; i++) {
      rpgSparksRef.current.push({
        x: 180 + (Math.random() * 40 - 20),
        y: 130 + (Math.random() * 40 - 20),
        life: 1,
        color: '#FF2E93',
      });
    }

    const dmg = 25;
    const nextHp = Math.max(0, bossHp - dmg);
    setBossHp(nextHp);
    setXp((x) => x + 35);

    if (nextHp === 0) {
      setStatusMsg('🏆 ¡REINA ARAÑA DERROTADA! Se desbloqueó el manuscrito secreto.');
      setShowScrollModal(true);
    } else {
      setStatusMsg(`🪡 Disparo de Aguja de Plata: -${dmg} HP a la Reina Araña.`);
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

        {/* Navigation Tabs */}
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

      {/* 👗 TAB 1 & 2: THREE.JS 3D WEBGL STUDIO */}
      {(activeTab === 'atelier3d' || activeTab === 'pasarela') && (
        <main className="w-full max-w-md z-10 my-1 flex-1 flex flex-col items-center justify-between space-y-3">
          {/* 3D Canvas Box */}
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

      {/* ⚔️ TAB 3: REAL-TIME 2D CANVAS ACTION RPG */}
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

          {/* 🎮 2D Canvas Stage */}
          <div className="w-full h-80 bg-[#07080C] rounded-3xl border-2 border-[#FF85C0]/40 relative overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-[#0D0E16]/80 backdrop-blur-md flex items-center justify-between text-xs font-sans border-b border-white/10 z-10">
              <span className="font-bold text-red-400">Pibo HP: {Array(lives).fill('❤️').join('')}</span>
              <span className="font-bold text-[#FF85C0]">XP: {xp} pts</span>
            </div>

            <canvas
              ref={rpgCanvasRef}
              width={360}
              height={220}
              onClick={handleRpgCanvasClick}
              className="w-full h-full cursor-pointer"
            />
          </div>

          {/* Interactive RPG Action Bar */}
          <div className="w-full space-y-2">
            {rpgRoom === 'boss' ? (
              <button
                onClick={handleAttackSpider}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-[#FF2E93] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,46,147,0.5)] border border-[#FF85C0]/40 active:scale-95"
              >
                🪡 Disparar Aguja de Plata a la Araña
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 font-sans text-xs font-bold uppercase">
                <button
                  onClick={() => { setXp((x) => x + 25); setStatusMsg('🧵 Pibo hila encaje gótico en el atelier.'); }}
                  className="py-3 bg-[#121420] hover:bg-[#FF2E93] text-white border border-[#FF85C0]/30 rounded-xl transition-all shadow-md active:scale-95"
                >
                  🧵 Hilvanar Seda
                </button>
                <button
                  onClick={() => { setXp((x) => x + 25); setStatusMsg('💧 Lilis regadas y polen cosechado.'); }}
                  className="py-3 bg-[#121420] hover:bg-[#FF2E93] text-white border border-[#FF85C0]/30 rounded-xl transition-all shadow-md active:scale-95"
                >
                  💧 Regar Lilis
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
