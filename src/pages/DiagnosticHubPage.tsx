import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowUpRight,
  HiOutlineCheckCircle,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { IoLogoWhatsapp } from 'react-icons/io';
import { submitPublicLead, LeadSource } from '@/lib/leads';
import { usePageSeo } from '@/lib/usePageSeo';
import '@components/home/portfolio-home.css';

type ToolTab = 'diagnostico' | 'estimador' | 'checklist_qa';

interface DiagnosticQuestion {
  id: string;
  es: string;
  en: string;
  options: { labelEs: string; labelEn: string; score: number }[];
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'ops',
    es: '¿Cómo controlan hoy pedidos, tareas o seguimiento operativo?',
    en: 'How do you track orders, tasks, or daily operations today?',
    options: [
      { labelEs: 'Excel y WhatsApp', labelEn: 'Spreadsheets & chat', score: 20 },
      { labelEs: 'Herramientas sueltas', labelEn: 'Disconnected tools', score: 55 },
      { labelEs: 'Sistema centralizado', labelEn: 'Centralized system', score: 95 },
    ],
  },
  {
    id: 'hours',
    es: '¿Cuántas horas semanales pierde el equipo en captura manual o retrabajo?',
    en: 'How many weekly hours go to manual data entry or rework?',
    options: [
      { labelEs: 'Más de 10 h/sem', labelEn: '10+ hrs/week', score: 15 },
      { labelEs: '4 a 10 h/sem', labelEn: '4–10 hrs/week', score: 55 },
      { labelEs: 'Menos de 4 h/sem', labelEn: 'Under 4 hrs/week', score: 95 },
    ],
  },
  {
    id: 'visibility',
    es: '¿Qué tan rápido ves indicadores clave sin pedir reportes manuales?',
    en: 'How fast can leadership inspect KPIs without manual reporting?',
    options: [
      { labelEs: 'Hasta cierre de mes', labelEn: 'Month-end only', score: 20 },
      { labelEs: 'Reporte semanal', labelEn: 'Weekly manual report', score: 55 },
      { labelEs: 'Tablero en tiempo real', labelEn: 'Real-time dashboard', score: 95 },
    ],
  },
  {
    id: 'ai',
    es: '¿Aprovechan automatización o IA para documentos, tickets o consultas?',
    en: 'Do you use automation or AI for documents, receipts, or triage?',
    options: [
      { labelEs: 'Todo es manual', labelEn: 'Fully manual', score: 20 },
      { labelEs: 'Uso ocasional', labelEn: 'Ad-hoc usage', score: 55 },
      { labelEs: 'Integrado al flujo', labelEn: 'Embedded in workflow', score: 95 },
    ],
  },
  {
    id: 'qa',
    es: 'Cuando actualizan software o procesos digitales, ¿qué ocurre?',
    en: 'When you ship software or workflow changes, what happens?',
    options: [
      { labelEs: 'Fallas frecuentes', labelEn: 'Frequent regressions', score: 20 },
      { labelEs: 'Revisión manual básica', labelEn: 'Basic manual checks', score: 60 },
      { labelEs: 'QA y compuertas CI', labelEn: 'QA & CI release gates', score: 95 },
    ],
  },
  {
    id: 'scale',
    es: '¿Tu operación actual soportaría duplicar clientes sin sumar carga manual?',
    en: 'Could your current workflow handle 2x volume without extra manual staff?',
    options: [
      { labelEs: 'Se saturaría rápido', labelEn: 'Would bottleneck fast', score: 20 },
      { labelEs: 'Con ajustes parciales', labelEn: 'With manual workarounds', score: 55 },
      { labelEs: 'Escalaría sin fricción', labelEn: 'Scales cleanly', score: 95 },
    ],
  },
];

const QA_CHECKLIST_ITEMS = [
  { id: 'auth', es: 'Control de accesos por rol y seguridad RLS validada', en: 'Role-based permissions & database RLS verified' },
  { id: 'critical', es: 'Flujos críticos de ingreso y registro probados de extremo a extremo', en: 'Revenue and onboarding critical paths tested end-to-end' },
  { id: 'api', es: 'Validación de respuestas de API, errores de red y estados vacíos', en: 'API contract validation, network failures & empty states covered' },
  { id: 'types', es: 'Compilación estricta (TypeScript / lint) como compuerta previa a despliegue', en: 'Strict build/type checks enforced before production deploys' },
  { id: 'mobile', es: 'Usabilidad comprobada en móvil (sin desbordes y objetivos táctiles ≥ 44px)', en: 'Mobile usability verified (no overflow & ≥44px touch targets)' },
  { id: 'backup', es: 'Respaldos automáticos verificados y plan de reversión rápida', en: 'Automated backups verified with clear rollback procedure' },
  { id: 'uat', es: 'Criterios de aceptación firmados con negocio antes de liberar', en: 'Business acceptance criteria (UAT) signed off pre-release' },
  { id: 'perf', es: 'Caché, compresión de recursos y monitoreo básico de incidentes', en: 'Caching, asset optimization & incident observability active' },
] as const;

export default function DiagnosticHubPage() {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const spanish = i18n.language?.startsWith('es') ?? true;
  const lang = spanish ? 'es' : 'en';
  const reduceMotion = useReducedMotion();

  const initialTabParam = searchParams.get('tab');
  const validInitialTab: ToolTab =
    initialTabParam === 'estimador' || initialTabParam === 'checklist_qa'
      ? initialTabParam
      : 'diagnostico';

  const [activeTab, setActiveTab] = useState<ToolTab>(validInitialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'diagnostico' || t === 'estimador' || t === 'checklist_qa') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tab: ToolTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    setSubmitStatus('idle');
  };

  // Tab 1: Diagnostic answers
  const [answers, setAnswers] = useState<Record<string, number>>({
    ops: 20,
    hours: 15,
    visibility: 20,
    ai: 20,
    qa: 60,
    scale: 20,
  });

  // Tab 2: Estimator state
  const [solutionType, setSolutionType] = useState<'portal' | 'webapp' | 'ai' | 'qa'>('portal');
  const [scopeSize, setScopeSize] = useState<'mvp' | 'core' | 'enterprise'>('core');
  const [addons, setAddons] = useState<string[]>(['ai_flow']);

  // Tab 3: QA Checklist state
  const [checkedQa, setCheckedQa] = useState<string[]>(['types', 'mobile']);

  // Lead Capture Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: spanish
        ? 'Diagnóstico Digital, Estimador de Alcance y Checklist QA — Andrés Cordero'
        : 'Digital Diagnostic, Scope Estimator & QA Checklist — Andrés Cordero',
      url: 'https://andresmcorderor.netlify.app/diagnostico',
      applicationCategory: 'BusinessApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
      author: { '@type': 'Person', name: 'Andrés Cordero' },
    }),
    [spanish]
  );

  usePageSeo({
    title: spanish
      ? 'Diagnóstico Digital, Estimador de Alcance y Checklist QA Gratis | Andrés Cordero'
      : 'Free Process Diagnostic, Scope Estimator & QA Readiness Checklist | Andrés Cordero',
    description: spanish
      ? 'Evalúa gratis la madurez digital de tus procesos, estima las fases de tu proyecto de software/IA o audita tu preparación QA en 2 minutos.'
      : 'Free interactive tools: audit digital workflow maturity, estimate custom software/AI delivery phases, or verify QA release readiness in 2 minutes.',
    path: '/diagnostico',
    jsonLd,
  });

  // Computed Tool 1 Result
  const diagnosticResult = useMemo(() => {
    const vals = Object.values(answers);
    const score = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const hoursSavedPerMonth = score < 40 ? 48 : score < 70 ? 28 : 12;
    const tier =
      score < 40
        ? spanish
          ? 'Operación Manual (Alto Potencial de Ahorro)'
          : 'Manual Operation (High Optimization ROI)'
        : score < 75
        ? spanish
          ? 'En Transición Digital (Brechas de Trazabilidad)'
          : 'Digital Transition (Traceability Gaps)'
        : spanish
        ? 'Operación Madura (Lista para IA y Escala)'
        : 'Mature Operation (Ready for AI & Scale)';

    const recommendations =
      score < 40
        ? spanish
          ? [
              'Centralizar el proceso principal en un portal web ligero con permisos y respaldo automático.',
              'Eliminar captura duplicada entre Excel y chats mediante formularios móviles rápidos.',
              'Activar tablero diario de indicadores y alertas de pendientes críticos.',
            ]
          : [
              'Centralize your primary workflow into a lightweight web portal with permissions and backups.',
              'Eliminate double entry across spreadsheets and chats with fast mobile forms.',
              'Enable real-time executive KPIs and automated blocker alerts.',
            ]
        : score < 75
        ? spanish
          ? [
              'Conectar herramientas aisladas en una fuente única de datos trazable.',
              'Incorporar lectura inteligente con IA para acelerar captura de documentos y reportes.',
              'Establecer compuertas QA para evitar regresiones al lanzar mejoras.',
            ]
          : [
              'Consolidate disconnected tools into a single traceable data backbone.',
              'Embed applied AI parsing for documents and operational summaries.',
              'Add automated QA release gates to eliminate regression surprises.',
            ]
        : spanish
        ? [
            'Automatizar flujos de decisión y asistencia operativa con modelos IA controlados.',
            'Blindar CI/CD con suites E2E automatizadas sobre rutas críticas.',
            'Optimizar rendimiento y métricas para escalar volumen sin crecer costos.',
          ]
        : [
            'Automate operational workflows with human-reviewed applied AI pipelines.',
            'Harden CI/CD with automated E2E suites covering critical journeys.',
            'Optimize architecture efficiency to scale volume without growing headcount.',
          ];

    return { score, hoursSavedPerMonth, tier, recommendations };
  }, [answers, spanish]);

  // Computed Tool 2 Result
  const estimatorResult = useMemo(() => {
    const baseWeeks: Record<typeof scopeSize, [number, number]> = {
      mvp: [3, 5],
      core: [5, 8],
      enterprise: [9, 14],
    };
    const typeDelta = solutionType === 'qa' ? -1 : solutionType === 'ai' ? 1 : 0;
    const addonWeeks = addons.length * 1;
    const minWeeks = Math.max(2, baseWeeks[scopeSize][0] + typeDelta + Math.floor(addonWeeks / 2));
    const maxWeeks = Math.max(minWeeks + 2, baseWeeks[scopeSize][1] + typeDelta + addonWeeks);

    const solutionLabels: Record<typeof solutionType, { es: string; en: string }> = {
      portal: { es: 'Portal / Sistema Interno', en: 'Internal Portal / Operations System' },
      webapp: { es: 'Aplicación Web / PWA Comercial', en: 'Commercial Web App / PWA' },
      ai: { es: 'Flujo con IA Aplicada', en: 'Applied AI Workflow' },
      qa: { es: 'Estrategia y Automatización QA', en: 'QA Strategy & Automation' },
    };

    const phases = spanish
      ? [
          '01 · Discovery y mapa de proceso',
          '02 · Arquitectura, datos y seguridad RLS',
          '03 · Construcción iterativa e integraciones',
          '04 · Pruebas QA, UAT y salida a producción',
        ]
      : [
          '01 · Discovery & workflow mapping',
          '02 · Architecture, data & RLS security',
          '03 · Iterative engineering & integrations',
          '04 · QA validation, UAT & production launch',
        ];

    return {
      weeksRange: spanish ? `${minWeeks} – ${maxWeeks} semanas` : `${minWeeks} – ${maxWeeks} weeks`,
      solutionLabel: solutionLabels[solutionType][lang],
      phases,
      score: Math.min(100, 45 + addons.length * 12 + (scopeSize === 'enterprise' ? 20 : scopeSize === 'core' ? 10 : 0)),
    };
  }, [solutionType, scopeSize, addons, spanish, lang]);

  // Computed Tool 3 Result
  const qaResult = useMemo(() => {
    const pct = Math.round((checkedQa.length / QA_CHECKLIST_ITEMS.length) * 100);
    const missingItems = QA_CHECKLIST_ITEMS.filter((item) => !checkedQa.includes(item.id));
    const readinessLabel =
      pct >= 80
        ? spanish
          ? 'Alta Confianza de Liberación'
          : 'High Release Confidence'
        : pct >= 50
        ? spanish
          ? 'Riesgo Moderado en Despliegues'
          : 'Moderate Deployment Risk'
        : spanish
        ? 'Riesgo Alto de Regresiones en Producción'
        : 'High Production Regression Risk';

    return { pct, missingItems, readinessLabel };
  }, [checkedQa, spanish]);

  const activeSummaryPayload = useMemo(() => {
    if (activeTab === 'diagnostico') {
      return {
        source: 'diagnostico' as LeadSource,
        serviceInterest: spanish ? 'Digitalización y Optimización de Procesos' : 'Process Digitization & Optimization',
        score: diagnosticResult.score,
        summary: `${diagnosticResult.tier} · Score ${diagnosticResult.score}/100 · ~${diagnosticResult.hoursSavedPerMonth}h/mes recuperables`,
      };
    }
    if (activeTab === 'estimador') {
      return {
        source: 'estimador' as LeadSource,
        serviceInterest: estimatorResult.solutionLabel,
        score: estimatorResult.score,
        summary: `${estimatorResult.solutionLabel} (${scopeSize.toUpperCase()}) · ${estimatorResult.weeksRange} · Addons: ${addons.join(', ') || 'base'}`,
      };
    }
    return {
      source: 'checklist_qa' as LeadSource,
      serviceInterest: spanish ? 'Pruebas de Software y QA' : 'Software Testing & QA',
      score: qaResult.pct,
      summary: `QA Readiness ${qaResult.pct}% (${qaResult.readinessLabel}) · Brechas: ${qaResult.missingItems.length}`,
    };
  }, [activeTab, diagnosticResult, estimatorResult, qaResult, scopeSize, addons, spanish]);

  const whatsappResultUrl = `https://wa.me/524777037913?text=${encodeURIComponent(
    spanish
      ? `Hola Andrés, acabo de completar tu herramienta interactiva:\n• ${activeSummaryPayload.summary}\nMe gustaría revisar el plan recomendado.`
      : `Hi Andrés, I just completed your interactive assessment:\n• ${activeSummaryPayload.summary}\nI would like to review the recommended roadmap.`
  )}`;

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSending(true);
    setSubmitStatus('idle');
    const res = await submitPublicLead({
      fullName,
      email,
      company,
      phone,
      serviceInterest: activeSummaryPayload.serviceInterest,
      source: activeSummaryPayload.source,
      message: activeSummaryPayload.summary,
      metadata: {
        tool: activeTab,
        score: activeSummaryPayload.score,
        summary: activeSummaryPayload.summary,
        language: lang,
      },
    });
    setSending(false);
    if (res.savedToSupabase || res.emailSent) {
      setSubmitStatus('success');
      setFullName('');
      setEmail('');
      setCompany('');
      setPhone('');
    } else {
      setSubmitStatus('error');
    }
  };

  const toggleAddon = (id: string) => {
    setAddons((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleQaItem = (id: string) => {
    setCheckedQa((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const tabs: { id: ToolTab; labelEs: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'diagnostico', labelEs: 'Diagnóstico de Procesos', labelEn: 'Process Diagnostic', icon: HiOutlineSquares2X2 },
    { id: 'estimador', labelEs: 'Estimador de Alcance', labelEn: 'Scope Estimator', icon: HiOutlineCpuChip },
    { id: 'checklist_qa', labelEs: 'Checklist QA Producción', labelEn: 'QA Readiness Checklist', icon: HiOutlineShieldCheck },
  ];

  return (
    <div className="portfolio" lang={lang}>
      <section className="relative pt-32 pb-20 sm:pt-36 bg-[var(--site-canvas)] min-h-screen">
        <div className="portfolio-grid-bg" aria-hidden="true" />
        <div className="portfolio-shell relative z-10 space-y-10">
          {/* Header */}
          <div className="space-y-4 max-w-3xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 min-h-[44px] font-mono-tech text-xs text-[var(--site-muted)] hover:text-[var(--site-ink)] cursor-pointer"
            >
              <HiOutlineArrowLeft />
              <span>{spanish ? 'Volver al portafolio' : 'Back to portfolio'}</span>
            </Link>

            <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[var(--site-accent)] block">
              {spanish ? 'HERRAMIENTAS INTERACTIVAS GRATUITAS' : 'FREE INTERACTIVE ENGINEERING TOOLS'}
            </span>
            <h1
              className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.04] text-[var(--site-ink)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {spanish ? 'Diagnostica, estima y' : 'Diagnose, scope, and'}{' '}
              <span className="text-[var(--site-accent)]">
                {spanish ? 'toma mejores decisiones.' : 'ship with clarity.'}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--site-muted)] leading-relaxed max-w-2xl">
              {spanish
                ? 'Obtén en menos de 2 minutos un diagnóstico claro de tus procesos, una ruta estimada de desarrollo o tu índice de confiabilidad QA.'
                : 'Get an actionable process score, phased software delivery estimate, or QA release readiness check in under 2 minutes.'}
            </p>
          </div>

          {/* Tool Selector Tabs */}
          <div
            role="tablist"
            aria-label={spanish ? 'Seleccionar herramienta interactiva' : 'Select interactive tool'}
            className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] w-fit max-w-full"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg font-mono-tech text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--site-ink)] text-[var(--site-canvas)] shadow-sm'
                      : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'
                  }`}
                >
                  <Icon className="text-base shrink-0" />
                  <span>{spanish ? tab.labelEs : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Interactive Controls */}
            <div className="lg:col-span-7 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] p-5 sm:p-7">
              <AnimatePresence mode="wait">
                {activeTab === 'diagnostico' && (
                  <motion.div
                    key="diagnostico"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
                      <div key={q.id} className="space-y-2.5 pb-5 border-b border-[var(--site-line)] last:border-b-0 last:pb-0">
                        <p className="font-semibold text-sm text-[var(--site-ink)]">
                          <span className="font-mono-tech text-xs text-[var(--site-accent)] mr-2">0{idx + 1}</span>
                          {spanish ? q.es : q.en}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {q.options.map((opt) => {
                            const selected = answers[q.id] === opt.score;
                            return (
                              <button
                                key={opt.labelEs}
                                type="button"
                                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.score }))}
                                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                                  selected
                                    ? 'bg-[var(--site-accent-soft)] border-[var(--site-accent)] text-[var(--site-ink)] font-semibold'
                                    : 'bg-[var(--site-canvas)] border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'
                                }`}
                              >
                                {spanish ? opt.labelEs : opt.labelEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'estimador' && (
                  <motion.div
                    key="estimador"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2.5">
                      <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--site-accent)] block">
                        01 · {spanish ? 'Tipo de solución principal' : 'Primary solution type'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'portal', es: 'Portal / Sistema Interno', en: 'Internal Portal / Ops' },
                          { id: 'webapp', es: 'Web App / PWA Comercial', en: 'Commercial Web App / PWA' },
                          { id: 'ai', es: 'Automatización con IA', en: 'Applied AI Workflow' },
                          { id: 'qa', es: 'Estrategia y Suite QA', en: 'QA Strategy & Automation' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSolutionType(opt.id as typeof solutionType)}
                            className={`min-h-[48px] px-4 rounded-lg text-sm font-medium border text-left transition-all cursor-pointer ${
                              solutionType === opt.id
                                ? 'bg-[var(--site-accent-soft)] border-[var(--site-accent)] text-[var(--site-ink)] font-semibold'
                                : 'bg-[var(--site-canvas)] border-[var(--site-line)] text-[var(--site-muted)]'
                            }`}
                          >
                            {spanish ? opt.es : opt.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--site-accent)] block">
                        02 · {spanish ? 'Alcance inicial' : 'Initial scope'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'mvp', es: 'MVP Enfocado', en: 'Focused MVP' },
                          { id: 'core', es: 'Sistema Operativo', en: 'Full Core System' },
                          { id: 'enterprise', es: 'Plataforma Multi-Rol', en: 'Enterprise Multi-Role' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setScopeSize(opt.id as typeof scopeSize)}
                            className={`min-h-[48px] px-3.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                              scopeSize === opt.id
                                ? 'bg-[var(--site-accent-soft)] border-[var(--site-accent)] text-[var(--site-ink)] font-semibold'
                                : 'bg-[var(--site-canvas)] border-[var(--site-line)] text-[var(--site-muted)]'
                            }`}
                          >
                            {spanish ? opt.es : opt.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--site-accent)] block">
                        03 · {spanish ? 'Capacidades adicionales' : 'Additional capabilities'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'ai_flow', es: 'IA (Visión / Asistente)', en: 'AI (Vision / Assistant)' },
                          { id: 'qa_ci', es: 'Suite QA + Compuertas CI', en: 'QA Suite + CI Gates' },
                          { id: 'migration', es: 'Migración desde Excel/Legacy', en: 'Legacy / Sheet Migration' },
                          { id: 'bilingual', es: 'Interfaz Bilingüe ES / EN', en: 'Bilingual ES / EN UI' },
                        ].map((opt) => {
                          const active = addons.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleAddon(opt.id)}
                              className={`min-h-[44px] px-3.5 rounded-lg text-xs font-medium border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                active
                                  ? 'bg-[var(--site-accent-soft)] border-[var(--site-accent)] text-[var(--site-ink)] font-semibold'
                                  : 'bg-[var(--site-canvas)] border-[var(--site-line)] text-[var(--site-muted)]'
                              }`}
                            >
                              <span>{spanish ? opt.es : opt.en}</span>
                              <span className="font-mono-tech text-[10px]">{active ? '✓' : '+'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'checklist_qa' && (
                  <motion.div
                    key="checklist_qa"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--site-accent)] pb-1">
                      {spanish ? 'Marca lo que tu equipo ya valida hoy antes de desplegar:' : 'Check what your team consistently verifies before deploying:'}
                    </p>
                    {QA_CHECKLIST_ITEMS.map((item) => {
                      const checked = checkedQa.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleQaItem(item.id)}
                          aria-pressed={checked}
                          className={`w-full min-h-[48px] p-3.5 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            checked
                              ? 'bg-[var(--site-accent-soft)] border-[var(--site-accent)] text-[var(--site-ink)]'
                              : 'bg-[var(--site-canvas)] border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'
                          }`}
                        >
                          <span
                            className={`size-5 rounded flex items-center justify-center text-xs shrink-0 border ${
                              checked
                                ? 'bg-[var(--site-accent)] text-white border-transparent'
                                : 'border-[var(--site-line)] bg-[var(--site-paper)]'
                            }`}
                          >
                            {checked ? '✓' : ''}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-snug">
                            {spanish ? item.es : item.en}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Live Readout + Automated Lead Capture */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] p-6 space-y-5">
                {activeTab === 'diagnostico' && (
                  <>
                    <div className="flex items-end justify-between gap-4 border-b border-[var(--site-line)] pb-4">
                      <div>
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-accent)] block">
                          {spanish ? 'ÍNDICE DE MADUREZ OPERATIVA' : 'OPERATIONAL MATURITY INDEX'}
                        </span>
                        <p className="font-semibold text-base text-[var(--site-ink)] mt-1">
                          {diagnosticResult.tier}
                        </p>
                      </div>
                      <span
                        className="text-4xl font-semibold text-[var(--site-accent)] shrink-0"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {diagnosticResult.score}
                        <small className="text-sm text-[var(--site-code)]">/100</small>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] flex items-center justify-between">
                      <span className="text-xs text-[var(--site-muted)]">
                        {spanish ? 'Ahorro operativo estimado' : 'Estimated monthly time saved'}
                      </span>
                      <span className="font-mono-tech text-sm font-semibold text-[var(--site-accent)]">
                        ~{diagnosticResult.hoursSavedPerMonth} h / {spanish ? 'mes' : 'mo'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-code)] block">
                        {spanish ? 'PRIORIDADES RECOMENDADAS' : 'RECOMMENDED PRIORITIES'}
                      </span>
                      {diagnosticResult.recommendations.map((rec) => (
                        <div key={rec} className="flex items-start gap-2.5 text-xs text-[var(--site-ink)]">
                          <HiOutlineCheckCircle className="text-base text-[var(--site-accent)] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'estimador' && (
                  <>
                    <div className="border-b border-[var(--site-line)] pb-4 space-y-1">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-accent)] block">
                        {spanish ? 'VENTANA ESTIMADA DE ENTREGA' : 'ESTIMATED DELIVERY WINDOW'}
                      </span>
                      <p
                        className="text-3xl font-semibold text-[var(--site-ink)]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {estimatorResult.weeksRange}
                      </p>
                      <p className="text-xs text-[var(--site-muted)]">{estimatorResult.solutionLabel}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-code)] block">
                        {spanish ? 'HOJA DE RUTA PROPUESTA' : 'PROPOSED EXECUTION ROADMAP'}
                      </span>
                      {estimatorResult.phases.map((phase) => (
                        <div
                          key={phase}
                          className="p-2.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] font-mono-tech text-xs text-[var(--site-ink)]"
                        >
                          {phase}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'checklist_qa' && (
                  <>
                    <div className="flex items-end justify-between gap-4 border-b border-[var(--site-line)] pb-4">
                      <div>
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-accent)] block">
                          {spanish ? 'CONFIANZA DE LIBERACIÓN' : 'RELEASE READINESS'}
                        </span>
                        <p className="font-semibold text-base text-[var(--site-ink)] mt-1">
                          {qaResult.readinessLabel}
                        </p>
                      </div>
                      <span
                        className="text-4xl font-semibold text-[var(--site-accent)] shrink-0"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {qaResult.pct}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-code)] block">
                        {qaResult.missingItems.length > 0
                          ? spanish
                            ? `BRECHAS PRIORITARIAS (${qaResult.missingItems.length})`
                            : `PRIORITY GAPS (${qaResult.missingItems.length})`
                          : spanish
                          ? 'COBERTURA BASE COMPLETA'
                          : 'BASELINE COVERAGE COMPLETE'}
                      </span>
                      {qaResult.missingItems.slice(0, 4).map((m) => (
                        <div key={m.id} className="text-xs text-[var(--site-muted)] flex items-start gap-2">
                          <span className="text-[var(--site-warm)] font-mono-tech">!</span>
                          <span>{spanish ? m.es : m.en}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Automated Lead Capture for the computed result */}
              <div className="rounded-xl bg-[var(--site-paper)] border border-[var(--site-accent)]/40 p-6 space-y-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--site-accent)]">
                    <HiOutlineSparkles />
                    {spanish ? 'RECIBE PLAN DE ACCIÓN PERSONALIZADO' : 'GET A TAILORED ACTION PLAN'}
                  </span>
                  <p className="text-xs text-[var(--site-muted)]">
                    {spanish
                      ? 'Guarda tu resultado para recibir una propuesta técnica aterrizada a tu operación.'
                      : 'Save your result to receive a tailored technical roadmap for your team.'}
                  </p>
                </div>

                {submitStatus === 'success' && (
                  <div role="status" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                    {spanish
                      ? 'Resultado registrado con éxito. Te escribiré con el plan sugerido.'
                      : 'Assessment saved. I will follow up with your tailored plan.'}
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                    {spanish
                      ? 'No se pudo enviar. Puedes compartir tu resultado directo por WhatsApp.'
                      : 'Could not submit right now. Share your result directly on WhatsApp.'}
                  </div>
                )}

                <form onSubmit={handleSaveAssessment} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={spanish ? 'Tu nombre *' : 'Your name *'}
                    className="w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={spanish ? 'Correo profesional *' : 'Work email *'}
                    className="w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={spanish ? 'Empresa (opcional)' : 'Company (optional)'}
                      className="w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp (opcional)"
                      className="w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={sending}
                      className="portfolio-button portfolio-button-primary flex-1 disabled:opacity-50"
                    >
                      <span>{sending ? (spanish ? 'Guardando...' : 'Saving...') : spanish ? 'Solicitar plan' : 'Request plan'}</span>
                      <HiOutlineArrowUpRight aria-hidden="true" />
                    </button>
                    <a
                      href={whatsappResultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="portfolio-button portfolio-button-quiet"
                    >
                      <IoLogoWhatsapp aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
