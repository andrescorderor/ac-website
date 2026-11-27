import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineCode,
  HiOutlineChip,
  HiOutlineClipboardCheck,
  HiOutlineBeaker,
  HiOutlineExternalLink,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import Hero from './Hero';
import Modal from '@components/common/modals/Modal';
import SignatureMark from '@components/common/SignatureMark';
import { openContactModal } from '@components/common/modals/ContactModal';
import { expertiseCards, ExpertiseCards } from '@mocks/HomeMocks';
import { knowledgeCarouselImageMocks } from '@mocks/KnowledgeCarouselMocks';
import { projectsSectionMocks } from '@mocks/ProjectsSectionMocks';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { loadPortfolioCms, CmsExperience, CmsProject, CmsCertification } from '@/lib/portfolioCms';
import './portfolio-home.css';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Shared pointer spotlight updater writing directly to CSS vars (--cx, --cy) with zero React re-renders. */
function handleCardSpotlight(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--cx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--cy', `${e.clientY - rect.top}px`);
}

type WorkbenchPillarId = 'dev' | 'ai' | 'process' | 'qa';
type StackDomain = 'all' | 'frontend' | 'backend' | 'qa' | 'process';
type ProjectFilter = 'all' | 'ai' | 'fullstack' | 'enterprise';

function classifyTechDomain(alt: string): Exclude<StackDomain, 'all'> {
  const name = alt.toLowerCase();
  if (name.includes('react') || name.includes('flutter') || name.includes('dart') || name.includes('swift') || name.includes('typescript') || name.includes('javascript') || name.includes('html') || name.includes('css') || name.includes('figma') || name.includes('android')) {
    return 'frontend';
  }
  if (name.includes('aws') || name.includes('node') || name.includes('sql') || name.includes('mysql') || name.includes('git') || name.includes('vscode') || name.includes('visual')) {
    return 'backend';
  }
  if (name.includes('selenium') || name.includes('junit') || name.includes('postman')) {
    return 'qa';
  }
  return 'process';
}

function classifyProjectCategory(tags: string[], title: string): Exclude<ProjectFilter, 'all'>[] {
  const blob = `${title} ${tags.join(' ')}`.toLowerCase();
  const categories: Exclude<ProjectFilter, 'all'>[] = [];
  if (blob.includes('ia') || blob.includes('ai') || blob.includes('hipaa') || blob.includes('analítica') || blob.includes('predictive')) {
    categories.push('ai');
  }
  if (blob.includes('react') || blob.includes('next') || blob.includes('vue') || blob.includes('typescript') || blob.includes('node')) {
    categories.push('fullstack');
  }
  if (blob.includes('gov') || blob.includes('volkswagen') || blob.includes('b2b') || blob.includes('stripe') || blob.includes('empresa') || blob.includes('estatal')) {
    categories.push('enterprise');
  }
  if (categories.length === 0) categories.push('fullstack');
  return categories;
}

export default function PortfolioHome() {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const reducedMotion = useReducedMotion();

  // Dynamic CMS state synced with PortafolioCMS
  const [cmsProjects, setCmsProjects] = useState<CmsProject[] | null>(null);
  const [cmsExperiences, setCmsExperiences] = useState<CmsExperience[] | null>(null);
  const [cmsCerts, setCmsCerts] = useState<CmsCertification[] | null>(null);

  // Interactive Section States
  const [activePillar, setActivePillar] = useState<WorkbenchPillarId>('dev');
  const [modalExpertise, setModalExpertise] = useState<ExpertiseCards | null>(null);
  const [stackDomain, setStackDomain] = useState<StackDomain>('all');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');
  const [activeSectionId, setActiveSectionId] = useState('hero-section');

  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineRef,
    offset: ['start 75%', 'end 65%'],
  });
  const timelineScaleY = useSpring(timelineScroll, { stiffness: 180, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      if (source !== 'default') {
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setCmsProjects(data.projects.filter((p) => p.visible !== false));
        }
        if (Array.isArray(data.experiences) && data.experiences.length > 0) {
          setCmsExperiences(data.experiences.filter((e) => e.visible !== false));
        }
        if (Array.isArray(data.certifications) && data.certifications.length > 0) {
          setCmsCerts(data.certifications.filter((c) => c.visible !== false));
        }
      }
    });
  }, []);

  // Section Telemetry Rail Observer
  useEffect(() => {
    const ids = [
      'hero-section',
      'capabilities-section',
      'stack-section',
      'experience-section',
      'portfolio-section',
      'credentials-section',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0.1, 0.3, 0.6] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const sectionRail = [
    { id: 'hero-section', code: '01', label: isSpanish ? 'Inicio' : 'Overview' },
    { id: 'capabilities-section', code: '02', label: isSpanish ? 'Capacidades' : 'Capabilities' },
    { id: 'stack-section', code: '03', label: 'Stack' },
    { id: 'experience-section', code: '04', label: isSpanish ? 'Trayectoria' : 'Career' },
    { id: 'portfolio-section', code: '05', label: isSpanish ? 'Proyectos' : 'Projects' },
    { id: 'credentials-section', code: '06', label: isSpanish ? 'Credenciales' : 'Credentials' },
  ];

  // Workbench 4-Pillar Data
  const pillars = useMemo(
    () => [
      {
        id: 'dev' as WorkbenchPillarId,
        code: 'SYS // 01',
        title: isSpanish ? 'Desarrollo Full-Stack' : 'Full-Stack Engineering',
        subtitle: isSpanish
          ? 'Construcción de aplicaciones web, PWAs y plataformas escalables listas para usuarios reales.'
          : 'Building scalable web platforms, PWAs, and APIs engineered for real production workloads.',
        icon: HiOutlineCode,
        modalKey: 'sd' as const,
        metrics: isSpanish
          ? [
              { k: 'Arquitectura', v: 'React 18 · TypeScript · Node' },
              { k: 'Datos & Auth', v: 'PostgreSQL · Supabase RLS' },
              { k: 'Resiliencia', v: 'PWA Offline & Lazy Chunks' },
            ]
          : [
              { k: 'Architecture', v: 'React 18 · TypeScript · Node' },
              { k: 'Data & Auth', v: 'PostgreSQL · Supabase RLS' },
              { k: 'Resilience', v: 'Offline PWA & Code-Splitting' },
            ],
        blueprintLines: isSpanish
          ? [
              { tag: 'UI/UX', text: 'Design systems bimodales accesibles (WAI-ARIA & 44px táctil)' },
              { tag: 'CORE', text: 'Estado desacoplado, caché en memoria y consultas proyectadas' },
              { tag: 'PROD', text: 'Build estricto TypeScript con despliegue automatizado en Netlify' },
            ]
          : [
              { tag: 'UI/UX', text: 'Accessible bimodal design systems (WAI-ARIA & touch-first)' },
              { tag: 'CORE', text: 'Decoupled state, memory caching, and projected queries' },
              { tag: 'PROD', text: 'Strict TypeScript compilation and automated CI/CD releases' },
            ],
      },
      {
        id: 'ai' as WorkbenchPillarId,
        code: 'AI // 02',
        title: isSpanish ? 'Integración de IA Aplicada' : 'Applied AI Systems',
        subtitle: isSpanish
          ? 'Transformo modelos LLM y visión computacional en flujos útiles integrados al negocio.'
          : 'Turning LLMs and computer vision into practical, measurable product workflows.',
        icon: HiOutlineChip,
        modalKey: 'sd' as const,
        metrics: isSpanish
          ? [
              { k: 'Modelos', v: 'Gemini Vision · LLMs · JSON estricto' },
              { k: 'Flujos', v: 'Extracción OCR & Asistentes contextuales' },
              { k: 'Eficiencia', v: 'Procesamiento directo sin fricción' },
            ]
          : [
              { k: 'Models', v: 'Gemini Vision · LLMs · Structured JSON' },
              { k: 'Pipelines', v: 'OCR extraction & Context Assistants' },
              { k: 'Efficiency', v: 'Low-latency client & API orchestration' },
            ],
        blueprintLines: isSpanish
          ? [
              { tag: 'DISCOVERY', text: 'Selección dinámica de modelos activos y fallbacks resilientes' },
              { tag: 'VISION', text: 'Compresión en cliente + análisis multimodal en memoria' },
              { tag: 'ACTIONS', text: 'Prompts estructurados con validación previa antes de persistir' },
            ]
          : [
              { tag: 'DISCOVERY', text: 'Dynamic active model discovery and graceful fallback chains' },
              { tag: 'VISION', text: 'Client-side compression + zero-storage multimodal parsing' },
              { tag: 'ACTIONS', text: 'Deterministic schema outputs with human review gates' },
            ],
      },
      {
        id: 'process' as WorkbenchPillarId,
        code: 'OPS // 03',
        title: isSpanish ? 'Procesos & Project Management' : 'Process & Project Management',
        subtitle: isSpanish
          ? 'Estructuro ideas, coordino equipos técnicos y optimizo el flujo operativo de principio a fin.'
          : 'Structuring ideas, orchestrating cross-functional teams, and optimizing delivery.',
        icon: HiOutlineClipboardCheck,
        modalKey: 'pm' as const,
        metrics: isSpanish
          ? [
              { k: 'Marcos', v: 'Scrum · Kanban · Roadmaps claros' },
              { k: 'Gobernanza', v: 'Alineación Negocio ↔ Ingeniería' },
              { k: 'Enfoque', v: 'Eliminación de cuellos de botella' },
            ]
          : [
              { k: 'Frameworks', v: 'Scrum · Kanban · Clear Roadmaps' },
              { k: 'Governance', v: 'Business ↔ Engineering alignment' },
              { k: 'Focus', v: 'Blocker removal & Predictable pacing' },
            ],
        blueprintLines: isSpanish
          ? [
              { tag: 'SCOPE', text: 'De necesidad de negocio a historias técnicas priorizadas' },
              { tag: 'SYNC', text: 'Rituales cortos, documentación viva y visibilidad para stakeholders' },
              { tag: 'FLOW', text: 'Reglas operativas estandarizadas que reducen retrabajo' },
            ]
          : [
              { tag: 'SCOPE', text: 'From business needs to prioritized technical specifications' },
              { tag: 'SYNC', text: 'Tight feedback loops, living documentation & stakeholder clarity' },
              { tag: 'FLOW', text: 'Standardized operating playbooks that cut rework' },
            ],
      },
      {
        id: 'qa' as WorkbenchPillarId,
        code: 'QA // 04',
        title: isSpanish ? 'Coordinación de Pruebas & Calidad' : 'QA Coordination & Quality Control',
        subtitle: isSpanish
          ? 'Lidero estrategias de aseguramiento de calidad para prevenir regresiones antes de llegar al usuario.'
          : 'Leading QA strategies and automated test suites to guarantee release confidence.',
        icon: HiOutlineBeaker,
        modalKey: 'qa' as const,
        metrics: isSpanish
          ? [
              { k: 'Cobertura', v: 'Regresión · Integración · UAT' },
              { k: 'Automatización', v: 'Selenium · JUnit · Postman · CI' },
              { k: 'Impacto', v: '−40% errores en despliegue' },
            ]
          : [
              { k: 'Coverage', v: 'Regression · Integration · UAT' },
              { k: 'Automation', v: 'Selenium · JUnit · Postman · CI' },
              { k: 'Impact', v: '−40% deployment defect rate' },
            ],
        blueprintLines: isSpanish
          ? [
              { tag: 'STRATEGY', text: 'Pruebas basadas en riesgo sobre rutas críticas de negocio' },
              { tag: 'GATES', text: 'Validación TypeScript, smoke tests y criterios de aceptación' },
              { tag: 'AUDIT', text: 'Trazabilidad completa de incidentes de reporte a resolución' },
            ]
          : [
              { tag: 'STRATEGY', text: 'Risk-based test planning focused on revenue-critical flows' },
              { tag: 'GATES', text: 'Automated build checks, API suites & release sign-off gates' },
              { tag: 'AUDIT', text: 'Full defect traceability from discovery through verification' },
            ],
      },
    ],
    [isSpanish]
  );

  const activePillarData = pillars.find((p) => p.id === activePillar) || pillars[0];

  const openModalForKey = (key: 'pm' | 'sd' | 'qa') => {
    const found = expertiseCards.find((c) => c.id === key);
    if (found) setModalExpertise(found);
  };

  // Localized Experience & CMS binding
  const defaultExperiences: CmsExperience[] = [
    {
      id: 'exp1',
      year: '2023 - Present',
      title: t('experience.exp1_title'),
      company: t('experience.exp1_company'),
      description: t('experience.exp1_desc'),
      visible: true,
    },
    {
      id: 'exp2',
      year: '2023 - Present',
      title: t('experience.exp2_title'),
      company: t('experience.exp2_company'),
      description: t('experience.exp2_desc'),
      visible: true,
    },
    {
      id: 'exp3',
      year: '2023 - 2024',
      title: t('experience.exp3_title'),
      company: t('experience.exp3_company'),
      description: t('experience.exp3_desc'),
      visible: true,
    },
    {
      id: 'exp4',
      year: '2020 - 2024',
      title: t('experience.exp4_title'),
      company: t('experience.exp4_company'),
      description: t('experience.exp4_desc'),
      visible: true,
    },
  ];
  const experiences = cmsExperiences ?? defaultExperiences;

  // Localized Projects & CMS binding
  const displayedProjects = useMemo(() => {
    if (cmsProjects) {
      return cmsProjects.map((p) => ({
        id: p.id,
        image: p.image,
        title: p.title,
        description: p.description,
        tags: Array.isArray(p.tags) ? p.tags : [],
      }));
    }
    return projectsSectionMocks.map((project) => {
      const rawTags = t(`projects_data.${project.id}_tags`, { returnObjects: true }) as unknown;
      return {
        id: project.id,
        image: project.image,
        title: t(`projects_data.${project.id}_title`),
        description: t(`projects_data.${project.id}_desc`),
        tags: Array.isArray(rawTags) ? (rawTags as string[]) : [],
      };
    });
  }, [cmsProjects, t]);

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return displayedProjects;
    return displayedProjects.filter((p) => classifyProjectCategory(p.tags, p.title).includes(projectFilter));
  }, [displayedProjects, projectFilter]);

  // Localized Certifications & CMS binding
  const displayedCertifications = useMemo(() => {
    if (cmsCerts) {
      return cmsCerts.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        link: c.link,
      }));
    }
    return certificationsSectionMocks.map((cert) => ({
      id: cert.id,
      title: t(`certifications_data.${cert.id}_title`),
      subtitle: t(`certifications_data.${cert.id}_subtitle`),
      link: cert.link,
    }));
  }, [cmsCerts, t]);

  // Stack items split into dual marquee rows or domain grid
  const techItems = useMemo(
    () =>
      knowledgeCarouselImageMocks.map((item) => ({
        ...item,
        cleanName: item.alt.replace(/\s*logo$/i, '').trim(),
        domain: classifyTechDomain(item.alt),
      })),
    []
  );

  const rowOneTech = techItems.slice(0, Math.ceil(techItems.length / 2));
  const rowTwoTech = techItems.slice(Math.ceil(techItems.length / 2));
  const filteredTech = stackDomain === 'all' ? techItems : techItems.filter((i) => i.domain === stackDomain);

  return (
    <div className="relative overflow-x-clip bg-[var(--pub-bg)] text-[var(--black)] selection:bg-[var(--vibrant-sky-blue)] selection:text-white">
      {/* Floating Section Telemetry Rail (Desktop XL) */}
      <aside
        aria-label={isSpanish ? 'Navegación de secciones' : 'Section navigation'}
        className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1.5 p-2 rounded-2xl glass"
      >
        {sectionRail.map((sec) => {
          const isCurrent = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() =>
                document.getElementById(sec.id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
              }
              title={sec.label}
              aria-label={sec.label}
              className="relative min-w-[44px] min-h-[36px] px-2.5 rounded-xl flex items-center justify-center font-mono-tech text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {isCurrent && (
                <motion.span
                  layoutId="railActiveIndicator"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-[var(--vibrant-sky-blue)]/15 border border-[var(--vibrant-sky-blue)]/40"
                />
              )}
              <span className={`relative z-10 ${isCurrent ? 'text-[var(--vibrant-sky-blue)]' : 'text-[var(--dark-gray)]'}`}>
                {sec.code}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ═══ 01. HERO + INTERACTIVE PIPELINE ═══ */}
      <Hero />

      {/* ═══ 02. CAPABILITIES WORKBENCH ═══ */}
      <section id="capabilities-section" className="relative py-20 lg:py-28 border-t border-[var(--pub-border)]">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vibrant-sky-blue)] block">
                02 // {t('expertise.title')}
              </span>
              <h2 className="font-dm-sans text-3xl sm:text-5xl font-bold tracking-tight leading-[1.02] text-[var(--black)]">
                {t('expertise.core_title')} <span className="text-gradient">{t('expertise.core_title_bold')}</span>
              </h2>
            </div>
            <p className="font-inter text-sm sm:text-base text-[var(--dark-gray)] max-w-md leading-relaxed">
              {t('expertise.intro')}
            </p>
          </div>

          {/* Workbench Layout: Left Pillar Tabs + Right Interactive Architecture Sheet */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 flex flex-col gap-3" role="tablist" aria-label={t('expertise.title')}>
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                const selected = pillar.id === activePillar;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActivePillar(pillar.id)}
                    onPointerMove={handleCardSpotlight}
                    className={`spotlight-card relative w-full text-left p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex items-start gap-4 ${
                      selected
                        ? 'border-[var(--vibrant-sky-blue)] ring-1 ring-[var(--vibrant-sky-blue)]/30 shadow-md'
                        : ''
                    }`}
                  >
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        selected
                          ? 'bg-[var(--vibrant-sky-blue)] text-white border-transparent'
                          : 'bg-[var(--pub-bg)] text-[var(--vibrant-sky-blue)] border-[var(--pub-border)]'
                      }`}
                    >
                      <Icon className="text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
                        {pillar.code}
                      </span>
                      <h3 className="font-dm-sans font-bold text-base sm:text-lg text-[var(--black)] mt-0.5">
                        {pillar.title}
                      </h3>
                      <p className="font-inter text-xs text-[var(--dark-gray)] mt-1 line-clamp-2">
                        {pillar.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 flex">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillarData.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onPointerMove={handleCardSpotlight}
                  className="spotlight-card corner-ticks w-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--pub-border)]">
                      <div>
                        <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
                          {activePillarData.code}
                        </span>
                        <h3 className="font-dm-sans text-2xl sm:text-3xl font-bold text-[var(--black)] mt-1">
                          {activePillarData.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModalForKey(activePillarData.modalKey)}
                        className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <span>{isSpanish ? 'Ver Inmersión y Stack' : 'Deep Dive & Tools'}</span>
                        <HiOutlineArrowUpRight className="text-sm" />
                      </button>
                    </div>

                    <p className="font-inter text-sm sm:text-base text-[var(--dark-gray)] leading-relaxed">
                      {activePillarData.subtitle}
                    </p>

                    {/* Architectural Blueprint Log */}
                    <div className="rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] p-4 space-y-2.5">
                      {activePillarData.blueprintLines.map((line) => (
                        <div key={line.tag} className="flex items-start gap-3 text-xs sm:text-sm">
                          <span className="font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--vibrant-sky-blue)]/12 text-[var(--vibrant-sky-blue)] border border-[var(--vibrant-sky-blue)]/25 shrink-0 mt-0.5">
                            {line.tag}
                          </span>
                          <span className="font-inter text-[var(--black)] leading-relaxed">{line.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {activePillarData.metrics.map((m) => (
                      <div
                        key={m.k}
                        className="p-3.5 rounded-xl bg-[var(--pub-bg)] border border-[var(--pub-border)]"
                      >
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--dark-gray)] block">
                          {m.k}
                        </span>
                        <span className="font-dm-sans font-bold text-xs sm:text-sm text-[var(--black)] mt-1 block">
                          {m.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 03. DUAL-ROW KINETIC TECH STACK ═══ */}
      <section id="stack-section" className="relative py-20 lg:py-24 bg-[var(--deep-navy-blue-light)] border-y border-[var(--pub-border)]">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="space-y-2">
              <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vibrant-sky-blue)] block">
                03 // ECOSYSTEM
              </span>
              <h2 className="font-dm-sans text-3xl sm:text-5xl font-bold tracking-tight text-[var(--black)]">
                {t('expertise.knowledge_title')}
              </h2>
            </div>

            {/* Domain Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-[var(--pub-surface)] p-1.5 rounded-2xl border border-[var(--pub-border)]">
              {[
                { id: 'all', label: isSpanish ? 'Flujo Completo' : 'Full Stream' },
                { id: 'frontend', label: 'Frontend & Mobile' },
                { id: 'backend', label: 'Cloud & Data' },
                { id: 'qa', label: 'QA & Testing' },
                { id: 'process', label: isSpanish ? 'Procesos' : 'Process' },
              ].map((tab) => {
                const active = stackDomain === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStackDomain(tab.id as StackDomain)}
                    className={`relative px-3.5 min-h-[38px] rounded-xl font-mono-tech text-[11px] font-semibold transition-colors cursor-pointer ${
                      active ? 'text-[var(--white)]' : 'text-[var(--dark-gray)] hover:text-[var(--black)]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="stackDomainPill"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        className="absolute inset-0 rounded-xl bg-[var(--black)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {stackDomain === 'all' ? (
            <div className="space-y-4">
              {/* Row 1 -> Left */}
              <div className="marquee-viewport">
                <div className="marquee-row-left gap-4 py-1">
                  {[...rowOneTech, ...rowOneTech].map((item, idx) => (
                    <div
                      key={`r1-${item.cleanName}-${idx}`}
                      className={`${idx >= rowOneTech.length ? 'marquee-dup ' : ''}inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--pub-surface)] border border-[var(--pub-border)] shadow-2xs shrink-0`}
                    >
                      <img src={item.src} alt={item.cleanName} className="size-7 object-contain" />
                      <span className="font-mono-tech text-xs font-semibold text-[var(--black)] whitespace-nowrap">
                        {item.cleanName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2 -> Right */}
              <div className="marquee-viewport">
                <div className="marquee-row-right gap-4 py-1">
                  {[...rowTwoTech, ...rowTwoTech].map((item, idx) => (
                    <div
                      key={`r2-${item.cleanName}-${idx}`}
                      className={`${idx >= rowTwoTech.length ? 'marquee-dup ' : ''}inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--pub-surface)] border border-[var(--pub-border)] shadow-2xs shrink-0`}
                    >
                      <img src={item.src} alt={item.cleanName} className="size-7 object-contain" />
                      <span className="font-mono-tech text-xs font-semibold text-[var(--black)] whitespace-nowrap">
                        {item.cleanName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
            >
              {filteredTech.map((item) => (
                <motion.div
                  key={item.cleanName}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  onPointerMove={handleCardSpotlight}
                  className="spotlight-card rounded-2xl p-4 flex items-center gap-3"
                >
                  <img src={item.src} alt={item.cleanName} className="size-8 object-contain shrink-0" />
                  <span className="font-mono-tech text-xs font-semibold text-[var(--black)] truncate">
                    {item.cleanName}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══ 04. SCROLL-ENERGIZED EXPERIENCE TIMELINE ═══ */}
      <section id="experience-section" className="relative py-20 lg:py-28">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 space-y-12">
          <div className="space-y-3">
            <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vibrant-sky-blue)] block">
              04 // {isSpanish ? 'TRAYECTORIA' : 'CAREER PATH'}
            </span>
            <h2 className="font-dm-sans text-3xl sm:text-5xl font-bold tracking-tight text-[var(--black)]">
              {t('experience.title')}
            </h2>
          </div>

          <div ref={timelineRef} className="relative pl-7 sm:pl-10 space-y-6">
            {/* Base Timeline Line */}
            <div
              aria-hidden="true"
              className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-px bg-[var(--pub-border)]"
            />
            {/* Scroll-Energized Line */}
            <motion.div
              aria-hidden="true"
              style={{ scaleY: reducedMotion ? 1 : timelineScaleY, transformOrigin: 'top' }}
              className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-[2px] -ml-[0.5px] bg-gradient-to-b from-[var(--vibrant-sky-blue)] via-[var(--magenta-pink)] to-[var(--vibrant-sky-blue)]"
            />

            {experiences.map((exp, idx) => (
              <motion.article
                key={exp.id || idx}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: EASE }}
                onPointerMove={handleCardSpotlight}
                className="spotlight-card relative rounded-2xl sm:rounded-3xl p-5 sm:p-7"
              >
                {/* Node Dot */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[25px] sm:-left-[33px] top-7 size-3.5 rounded-full bg-[var(--vibrant-sky-blue)] border-[3px] border-[var(--pub-bg)] shadow-xs"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--pub-border)]">
                  <div>
                    <h3 className="font-dm-sans text-xl sm:text-2xl font-bold text-[var(--black)]">
                      {exp.title}
                    </h3>
                    <p className="font-syne text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)] mt-1">
                      {exp.company}
                    </p>
                  </div>
                  <span className="self-start sm:self-auto font-mono-tech text-xs font-semibold px-3 py-1 rounded-lg bg-[var(--pub-bg)] border border-[var(--pub-border)] text-[var(--dark-gray)] shrink-0">
                    {exp.year}
                  </span>
                </div>

                <p className="font-inter text-sm sm:text-base text-[var(--dark-gray)] leading-relaxed pt-3">
                  {exp.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 05. FILTERABLE TECHNICAL CASE STUDIES ═══ */}
      <section id="portfolio-section" className="relative py-20 lg:py-28 bg-[var(--deep-navy-blue-light)] border-y border-[var(--pub-border)]">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vibrant-sky-blue)] block">
                05 // {isSpanish ? 'CASOS DE INGENIERÍA' : 'ENGINEERING CASES'}
              </span>
              <h2 className="font-dm-sans text-3xl sm:text-5xl font-bold tracking-tight text-[var(--black)]">
                {t('portfolio.title')}
              </h2>
              <p className="font-inter text-sm sm:text-base text-[var(--dark-gray)] max-w-xl">
                {t('portfolio.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-[var(--pub-surface)] p-1.5 rounded-2xl border border-[var(--pub-border)] self-start lg:self-auto">
              {[
                { id: 'all', label: isSpanish ? 'Todos' : 'All' },
                { id: 'ai', label: isSpanish ? 'IA & Datos' : 'AI & Data' },
                { id: 'fullstack', label: 'Full-Stack' },
                { id: 'enterprise', label: 'GovTech & B2B' },
              ].map((tab) => {
                const active = projectFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProjectFilter(tab.id as ProjectFilter)}
                    className={`relative px-3.5 min-h-[38px] rounded-xl font-mono-tech text-[11px] font-semibold transition-colors cursor-pointer ${
                      active ? 'text-[var(--white)]' : 'text-[var(--dark-gray)] hover:text-[var(--black)]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="projectFilterPill"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        className="absolute inset-0 rounded-xl bg-[var(--black)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <motion.article
                key={project.id}
                layout
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE }}
                onPointerMove={handleCardSpotlight}
                className="spotlight-card corner-ticks rounded-3xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-[var(--pub-surface-muted)] border-b border-[var(--pub-border)]">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
                    />
                    <span className="absolute top-3 left-3 font-mono-tech text-[10px] font-semibold px-2.5 py-1 rounded-md bg-black/70 text-white border border-white/15 backdrop-blur-md">
                      CASE // 0{idx + 1}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <h3 className="font-dm-sans text-xl font-bold text-[var(--black)] leading-snug">
                      {project.title}
                    </h3>
                    <p className="font-inter text-xs sm:text-sm text-[var(--dark-gray)] leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-[var(--pub-bg)] border border-[var(--pub-border)] font-mono-tech text-[10px] font-semibold text-[var(--black)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={openContactModal}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--pub-bg)] hover:bg-[var(--black)] text-[var(--black)] hover:text-[var(--white)] border border-[var(--pub-border)] font-syne text-[11px] font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer touch-reveal"
                  >
                    <span>{isSpanish ? 'Solicitar arquitectura similar' : 'Discuss similar system'}</span>
                    <HiOutlineArrowUpRight className="text-base" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 06. CREDENTIALS VAULT & EXECUTIVE CLOSURE ═══ */}
      <section id="credentials-section" className="relative py-20 lg:py-28">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 space-y-14">
          <div className="space-y-3">
            <span className="font-mono-tech text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vibrant-sky-blue)] block">
              06 // {isSpanish ? 'VALIDACIÓN TÉCNICA' : 'VERIFIED CREDENTIALS'}
            </span>
            <h2 className="font-dm-sans text-3xl sm:text-5xl font-bold tracking-tight text-[var(--black)]">
              {t('certifications.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedCertifications.map((cert, idx) => (
              <motion.div
                key={cert.id || idx}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.04, ease: EASE }}
                onPointerMove={handleCardSpotlight}
                className="spotlight-card rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <HiOutlineShieldCheck className="text-sm" />
                      VERIFIED
                    </span>
                    <span className="font-mono-tech text-[10px] text-[var(--dark-gray)]">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-dm-sans font-bold text-base sm:text-lg text-[var(--black)] leading-snug">
                    {cert.title}
                  </h3>
                  <p className="font-inter text-xs text-[var(--dark-gray)]">{cert.subtitle}</p>
                </div>

                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between px-4 min-h-[44px] rounded-xl bg-[var(--pub-bg)] border border-[var(--pub-border)] hover:border-[var(--vibrant-sky-blue)] font-mono-tech text-[11px] font-semibold text-[var(--black)] transition-all cursor-pointer"
                  >
                    <span>{t('certifications.view')}</span>
                    <HiOutlineExternalLink className="text-sm text-[var(--vibrant-sky-blue)]" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          {/* Executive Conversion Banner */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: EASE }}
            onPointerMove={handleCardSpotlight}
            className="spotlight-card corner-ticks rounded-3xl p-7 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
          >
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <SignatureMark size="md" />
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)]">
                  <HiOutlineSparkles className="text-sm" />
                  {isSpanish ? 'Disponible para proyectos estratégicos' : 'Open for high-impact engineering'}
                </span>
              </div>
              <h3 className="font-dm-sans text-2xl sm:text-4xl font-bold tracking-tight text-[var(--black)]">
                {t('discussion.title')}
              </h3>
              <p className="font-inter text-sm sm:text-base text-[var(--dark-gray)] leading-relaxed">
                {isSpanish
                  ? 'Ya sea para estructurar procesos técnicos, construir plataformas web integradas con IA o coordinar el aseguramiento de calidad en producción, llevemos tu idea al siguiente nivel.'
                  : 'Whether orchestrating technical processes, engineering AI-powered platforms, or leading production QA, let us turn your roadmap into measurable reality.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={openContactModal}
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span>{t('footer.contact_button')}</span>
                <HiOutlineArrowUpRight className="text-base" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Standardized Expertise Deep-Dive Modal */}
      <Modal
        isOpen={Boolean(modalExpertise)}
        onClose={() => setModalExpertise(null)}
        title={
          modalExpertise
            ? modalExpertise.id === 'pm'
              ? t('expertise.pm_header_title')
              : modalExpertise.id === 'sd'
              ? t('expertise.sd_header_title')
              : t('expertise.qa_header_title')
            : ''
        }
        paragraph={
          modalExpertise
            ? modalExpertise.id === 'pm'
              ? t('expertise.pm_header_paragraph')
              : modalExpertise.id === 'sd'
              ? t('expertise.sd_header_paragraph')
              : t('expertise.qa_header_paragraph')
            : ''
        }
        knowledgeSection={Boolean(modalExpertise)}
        expertiseData={modalExpertise ? { images: modalExpertise.expertiseData } : undefined}
      >
        {modalExpertise?.child}
      </Modal>
    </div>
  );
}
