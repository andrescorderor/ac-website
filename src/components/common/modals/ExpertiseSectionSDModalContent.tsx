import { useTranslation } from 'react-i18next';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { openContactModal } from './ContactModal';

export default function ExpertiseSectionSDModalContent() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const sections = isSpanish
    ? [
        {
          code: '01 // PRODUCTOS & ARQUITECTURA',
          title: 'Plataformas Web & PWAs Resilientes',
          points: [
            'Desarrollo de aplicaciones interactivas full-stack y PWAs con funcionamiento offline para sector privado y gubernamental.',
            'Código modular estrictamente tipado con TypeScript, optimización de chunks y políticas RLS en PostgreSQL / Supabase.',
          ],
        },
        {
          code: '02 // INTEGRACIÓN IA & AUTOMATIZACIÓN',
          title: 'Sistemas Inteligentes Aplicados',
          points: [
            'Integración de Gemini Vision, flujos con LLMs y validación JSON determinista en flujos de negocio reales.',
            'Automatización de procesos operativos, lectura documental/tickets en cliente y asistentes contextuales.',
          ],
        },
        {
          code: '03 // IMPACTO MEDIBLE',
          title: 'Resultados en Producción',
          points: [
            'Entregas end-to-end que reducen tiempos operativos y elevan la experiencia UX/UI en escritorio y móvil.',
            'Sistemas preparados para escalar sin comprometer mantenibilidad ni presupuestos iniciales.',
          ],
        },
      ]
    : [
        {
          code: '01 // PRODUCTS & ARCHITECTURE',
          title: 'Resilient Web Platforms & PWAs',
          points: [
            'Engineered interactive full-stack apps and offline-ready PWAs across private enterprise and GovTech sectors.',
            'Strictly typed modular TypeScript architectures, code-splitting, and PostgreSQL / Supabase RLS security.',
          ],
        },
        {
          code: '02 // APPLIED AI & AUTOMATION',
          title: 'AI-Integrated Engineering',
          points: [
            'Production integrations with Gemini Vision, LLM workflows, and deterministic JSON validation.',
            'Client-side image/data processing and context-aware operational assistants with zero friction.',
          ],
        },
        {
          code: '03 // MEASURABLE IMPACT',
          title: 'Production Outcomes',
          points: [
            'End-to-end delivery cutting operational bottlenecks while maintaining accessible desktop and mobile UX.',
            'Maintainable, scalable codebases built cleanly from prototype to live deployment.',
          ],
        },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] p-5 space-y-5">
        <div>
          <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
            {isSpanish ? 'ESPECIALIDAD' : 'DISCIPLINE'}
          </span>
          <h3 className="font-dm-sans text-xl font-bold text-[var(--black)] mt-1">
            {isSpanish ? 'De la idea al código en producción' : 'From concept to production code'}
          </h3>
        </div>
        <button
          type="button"
          onClick={openContactModal}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <span>{isSpanish ? 'Iniciar Proyecto' : 'Start a Project'}</span>
          <HiOutlineArrowUpRight className="text-base" />
        </button>
      </div>

      <div className="lg:col-span-8 space-y-4">
        {sections.map((sec) => (
          <div
            key={sec.code}
            className="rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] p-5 space-y-2.5"
          >
            <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
              {sec.code}
            </span>
            <h4 className="font-dm-sans font-bold text-lg text-[var(--black)]">{sec.title}</h4>
            <ul className="space-y-1.5 text-sm font-inter text-[var(--dark-gray)]">
              {sec.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-[var(--vibrant-sky-blue)] shrink-0 mt-2" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
