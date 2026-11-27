import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineLightBulb,
  HiOutlineTemplate,
  HiOutlineChip,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlinePlay,
  HiOutlinePause,
} from 'react-icons/hi';

interface PipelineStage {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  summary: string;
  deliverables: string[];
  telemetryLabel: string;
  telemetryValue: string;
  statusTag: string;
  icon: React.ElementType;
}

export default function PipelineVisualizer() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const reducedMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const stages: PipelineStage[] = isSpanish
    ? [
        {
          id: 'process',
          code: '01',
          label: 'Idea & Diseño de Proceso',
          shortLabel: 'Proceso',
          summary: 'Transformo una idea ambigua en procesos operativos claros, reglas de negocio medibles y alcance priorizado.',
          deliverables: ['Mapa de flujo end-to-end', 'Definición de KPIs', 'Roadmap ágil por entregas'],
          telemetryLabel: 'Alineación Negocio',
          telemetryValue: '100% Trazable',
          statusTag: 'DISCOVERY // OK',
          icon: HiOutlineLightBulb,
        },
        {
          id: 'architecture',
          code: '02',
          label: 'Arquitectura & UX System',
          shortLabel: 'Arquitectura',
          summary: 'Diseño estructura modular, modelos de datos resilientes e interfaces enfocadas en claridad y velocidad de uso.',
          deliverables: ['Design System bimodal', 'Esquema RLS & caché', 'Flujos responsive 390–1440px'],
          telemetryLabel: 'Deuda Técnica',
          telemetryValue: 'Modular & Escalable',
          statusTag: 'BLUEPRINT // VERIFIED',
          icon: HiOutlineTemplate,
        },
        {
          id: 'engineering',
          code: '03',
          label: 'Desarrollo Full-Stack + IA',
          shortLabel: 'Dev + IA',
          summary: 'Construyo aplicaciones React/TypeScript integradas con APIs modernas, automatización y modelos de IA aplicada.',
          deliverables: ['TypeScript estricto', 'Flujos LLM & Visión IA', 'Optimización de bundle'],
          telemetryLabel: 'Automatización IA',
          telemetryValue: 'Zero-Cost / Escalable',
          statusTag: 'BUILD // COMPILED',
          icon: HiOutlineChip,
        },
        {
          id: 'qa',
          code: '04',
          label: 'Coordinación QA & Calidad',
          shortLabel: 'QA Control',
          summary: 'Coordino planes de prueba, validación funcional/E2E y control de regresiones para blindar cada despliegue.',
          deliverables: ['Matriz de pruebas & UAT', 'Suites CI/CD automatizadas', 'Cero defectos críticos'],
          telemetryLabel: 'Tasa de Estabilidad',
          telemetryValue: '99.9% Confiable',
          statusTag: 'QA GATE // PASS',
          icon: HiOutlineShieldCheck,
        },
        {
          id: 'release',
          code: '05',
          label: 'Despliegue & Evolución',
          shortLabel: 'Producción',
          summary: 'Publicación continua con monitoreo real, iteración guiada por datos y soporte de ciclo completo.',
          deliverables: ['CI/CD automatizado', 'Telemetría & PWAs', 'Mejora continua'],
          telemetryLabel: 'Ciclo Completo',
          telemetryValue: 'Idea → Producción',
          statusTag: 'LIVE // ACTIVE',
          icon: HiOutlineLightningBolt,
        },
      ]
    : [
        {
          id: 'process',
          code: '01',
          label: 'Idea & Process Design',
          shortLabel: 'Process',
          summary: 'Turning an early idea into structured workflows, clear business rules, and prioritized delivery milestones.',
          deliverables: ['End-to-end process map', 'KPI instrumentation', 'Agile sprint roadmap'],
          telemetryLabel: 'Business Alignment',
          telemetryValue: '100% Traceable',
          statusTag: 'DISCOVERY // OK',
          icon: HiOutlineLightBulb,
        },
        {
          id: 'architecture',
          code: '02',
          label: 'Architecture & UX System',
          shortLabel: 'Architecture',
          summary: 'Designing modular systems, resilient data models, and accessible interfaces tuned for speed and clarity.',
          deliverables: ['Bimodal Design System', 'RLS & Cache Layer', '390–1440px Responsive UI'],
          telemetryLabel: 'System Hygiene',
          telemetryValue: 'Modular & Scalable',
          statusTag: 'BLUEPRINT // VERIFIED',
          icon: HiOutlineTemplate,
        },
        {
          id: 'engineering',
          code: '03',
          label: 'Full-Stack Dev + AI',
          shortLabel: 'Dev + AI',
          summary: 'Engineering React/TypeScript products connected to modern cloud APIs, automation, and applied AI.',
          deliverables: ['Strict TypeScript', 'LLM & Vision Pipelines', 'Bundle Code-Splitting'],
          telemetryLabel: 'AI Integration',
          telemetryValue: 'Production Ready',
          statusTag: 'BUILD // COMPILED',
          icon: HiOutlineChip,
        },
        {
          id: 'qa',
          code: '04',
          label: 'QA Coordination & Control',
          shortLabel: 'QA Gate',
          summary: 'Leading test strategies, cross-team QA orchestration, and automated regression gates before every release.',
          deliverables: ['Test Plans & UAT', 'CI/CD Automated Suites', 'Zero Critical Defects'],
          telemetryLabel: 'Release Reliability',
          telemetryValue: '99.9% Uptime Target',
          statusTag: 'QA GATE // PASS',
          icon: HiOutlineShieldCheck,
        },
        {
          id: 'release',
          code: '05',
          label: 'Release & Scale',
          shortLabel: 'Production',
          summary: 'Zero-downtime deployment pipelines backed by telemetry, PWA resilience, and continuous improvement.',
          deliverables: ['Automated CI/CD', 'PWA Offline Support', 'Iterative Telemetry'],
          telemetryLabel: 'Delivery Scope',
          telemetryValue: 'Concept → Production',
          statusTag: 'LIVE // ACTIVE',
          icon: HiOutlineLightningBolt,
        },
      ];

  useEffect(() => {
    if (reducedMotion || !isAutoPlaying) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stages.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, reducedMotion, stages.length]);

  const activeStage = stages[activeIndex];
  const ActiveIcon = activeStage.icon;

  return (
    <div className="telemetry-panel corner-ticks rounded-3xl p-5 sm:p-6 w-full space-y-5 relative overflow-hidden">
      {/* Console Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--pub-border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex size-2.5 shrink-0">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
          </span>
          <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--black)] truncate">
            {isSpanish ? 'SISTEMA DE EJECUCIÓN // 0 → PROD' : 'EXECUTION ENGINE // 0 → PROD'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAutoPlaying((prev) => !prev)}
          aria-label={isAutoPlaying ? (isSpanish ? 'Pausar secuencia' : 'Pause sequence') : isSpanish ? 'Reanudar secuencia' : 'Resume sequence'}
          title={isAutoPlaying ? (isSpanish ? 'Pausar ciclo' : 'Pause cycle') : isSpanish ? 'Reanudar ciclo' : 'Resume cycle'}
          className="min-w-[36px] min-h-[36px] px-2.5 rounded-lg bg-[var(--pub-surface-muted)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--dark-gray)] hover:text-[var(--black)] font-mono-tech text-[10px] font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isAutoPlaying ? <HiOutlinePause className="text-sm" /> : <HiOutlinePlay className="text-sm" />}
          <span className="hidden sm:inline">{isAutoPlaying ? 'AUTO' : 'MANUAL'}</span>
        </button>
      </div>

      {/* SVG Animated Pipeline Nodes & Beams */}
      <div className="relative">
        {/* Animated SVG Track connecting stages */}
        <svg
          aria-hidden="true"
          viewBox="0 0 500 24"
          className="hidden sm:block w-full h-6 mb-2 overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1="40"
            y1="12"
            x2="460"
            y2="12"
            stroke="var(--pub-border-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.line
            x1="40"
            y1="12"
            x2={40 + activeIndex * 105}
            y2="12"
            stroke="var(--vibrant-sky-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={false}
            animate={{ x2: 40 + activeIndex * 105 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
          <line
            x1="40"
            y1="12"
            x2="460"
            y2="12"
            stroke="var(--magenta-pink)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="pipeline-beam opacity-50"
          />
          {stages.map((st, idx) => {
            const cx = 40 + idx * 105;
            const isPastOrCurrent = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <g key={st.id}>
                {isCurrent && (
                  <circle
                    cx={cx}
                    cy="12"
                    r="9"
                    fill="color-mix(in srgb, var(--vibrant-sky-blue) 22%, transparent)"
                  />
                )}
                <circle
                  cx={cx}
                  cy="12"
                  r={isCurrent ? 5 : 4}
                  fill={isPastOrCurrent ? 'var(--vibrant-sky-blue)' : 'var(--pub-surface)'}
                  stroke={isPastOrCurrent ? 'var(--vibrant-sky-blue)' : 'var(--pub-border-strong)'}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Stage Selector Tabs */}
        <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label={isSpanish ? 'Etapas del flujo' : 'Pipeline stages'}>
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const selected = index === activeIndex;
            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                className={`relative min-h-[56px] sm:min-h-[60px] p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selected
                    ? 'border-[var(--vibrant-sky-blue)] text-[var(--black)] shadow-xs'
                    : 'bg-[var(--pub-bg)] border-[var(--pub-border)] text-[var(--dark-gray)] hover:border-[var(--pub-border-strong)] hover:text-[var(--black)]'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="pipelineActiveStageBg"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-[var(--vibrant-sky-blue)]/10 -z-0"
                  />
                )}
                <Icon
                  className={`relative z-10 text-base sm:text-lg ${
                    selected ? 'text-[var(--vibrant-sky-blue)]' : ''
                  }`}
                />
                <span className="relative z-10 font-mono-tech text-[9px] sm:text-[10px] font-semibold leading-tight truncate max-w-full">
                  {stage.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Telemetry Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.id}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-xl bg-[var(--vibrant-sky-blue)]/12 border border-[var(--vibrant-sky-blue)]/25 flex items-center justify-center text-[var(--vibrant-sky-blue)] shrink-0">
                <ActiveIcon className="text-lg" />
              </div>
              <div className="min-w-0">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
                  PHASE {activeStage.code}
                </span>
                <h3 className="font-dm-sans font-bold text-sm sm:text-base text-[var(--black)] truncate">
                  {activeStage.label}
                </h3>
              </div>
            </div>

            <span className="font-mono-tech text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
              {activeStage.statusTag}
            </span>
          </div>

          <p className="font-inter text-xs sm:text-sm text-[var(--dark-gray)] leading-relaxed">
            {activeStage.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeStage.deliverables.map((item) => (
              <div
                key={item}
                className="px-3 py-2 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] font-mono-tech text-[11px] text-[var(--black)] flex items-center gap-2"
              >
                <span className="size-1.5 rounded-full bg-[var(--vibrant-sky-blue)] shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--pub-border)] flex items-center justify-between gap-3 text-xs">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--dark-gray)]">
              {activeStage.telemetryLabel}
            </span>
            <span className="font-mono-tech text-xs font-bold text-[var(--vibrant-sky-blue)]">
              {activeStage.telemetryValue}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
