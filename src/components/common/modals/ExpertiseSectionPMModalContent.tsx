import { useTranslation } from 'react-i18next';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { openContactModal } from './ContactModal';

export default function ExpertiseSectionPMModalContent() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const sections = isSpanish
    ? [
        {
          code: '01 // COORDINACIÓN & LIDERAZGO',
          title: 'Orquestación de Equipos Multidisciplinarios',
          points: [
            'Dirección de equipos de desarrollo, diseño y QA alineados a objetivos comerciales claros y fechas reales.',
            'Negociación con stakeholders y clientes públicos/privados para transformar requerimientos complejos en entregables accionables.',
          ],
        },
        {
          code: '02 // PROCESOS & AGILIDAD',
          title: 'Metodologías Ágiles & Optimización',
          points: [
            'Implementación práctica de Scrum y Kanban, planeación de sprints y detección temprana de bloqueos.',
            'Estandarización de flujos técnicos, documentación viva y gobernanza de bases de datos y DevOps.',
          ],
        },
        {
          code: '03 // RESULTADOS OPERATIVOS',
          title: 'Control de Alcance & Entregas Predecibles',
          points: [
            'Despliegues puntuales dentro de presupuesto con trazabilidad ejecutiva de avances, riesgos y métricas.',
            'Integración continua entre desarrollo y calidad para evitar cuellos de botella antes de salir a producción.',
          ],
        },
      ]
    : [
        {
          code: '01 // COORDINATION & LEADERSHIP',
          title: 'Cross-Functional Orchestration',
          points: [
            'Leading engineering, UX, and QA teams around measurable business milestones and realistic delivery schedules.',
            'Stakeholder alignment across private and public sectors, turning complex requirements into actionable backlogs.',
          ],
        },
        {
          code: '02 // PROCESSES & AGILITY',
          title: 'Agile Methodologies & Flow Design',
          points: [
            'Pragmatic Scrum & Kanban execution, sprint planning, capacity balancing, and proactive blocker resolution.',
            'Standardized engineering workflows, living documentation, and DevOps release governance.',
          ],
        },
        {
          code: '03 // OPERATIONAL OUTCOMES',
          title: 'Predictable On-Time Delivery',
          points: [
            'Consistent on-time and on-budget launches with transparent executive reporting and risk mitigation.',
            'Seamless handoff between engineering and QA gates eliminating last-minute release bottlenecks.',
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
            {isSpanish ? 'Procesos claros que aceleran al equipo' : 'Clear processes that accelerate delivery'}
          </h3>
        </div>
        <button
          type="button"
          onClick={openContactModal}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <span>{isSpanish ? 'Conversar sobre Gestión' : 'Discuss Project Scope'}</span>
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
