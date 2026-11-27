import { useTranslation } from 'react-i18next';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { openContactModal } from './ContactModal';

export default function ExpertiseSectionQAModalContent() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const sections = isSpanish
    ? [
        {
          code: '01 // ESTRATEGIA & COBERTURA',
          title: 'Ecosistemas de Pruebas de Punta a Punta',
          points: [
            'Diseño y coordinación de matrices de regresión, integración, APIs y UAT basadas en riesgo de negocio.',
            'Liderazgo de departamento QA estableciendo protocolos reproducibles desde desarrollo hasta producción.',
          ],
        },
        {
          code: '02 // AUTOMATIZACIÓN & TOOLING',
          title: 'Pipelines CI/CD & Validación Inteligente',
          points: [
            'Automatización con Selenium, JUnit y suites en Postman integradas al ciclo de entrega continua.',
            'Uso de análisis asistido por IA para priorizar casos críticos y acelerar la detección de defectos.',
          ],
        },
        {
          code: '03 // CONFIABILIDAD COMPROBADA',
          title: 'Reducción de Defectos en Producción',
          points: [
            'Reducción comprobada de hasta un 40% en errores de despliegue mediante quality gates estrictos.',
            'Prevención de incidentes críticos en plataformas e-commerce, industriales y gubernamentales.',
          ],
        },
      ]
    : [
        {
          code: '01 // STRATEGY & COVERAGE',
          title: 'End-to-End QA Ecosystems',
          points: [
            'Designing and coordinating risk-based regression, API integration, and UAT verification frameworks.',
            'Leading QA teams with reproducible quality standards spanning development through release sign-off.',
          ],
        },
        {
          code: '02 // AUTOMATION & TOOLING',
          title: 'CI/CD Pipelines & Smart Validation',
          points: [
            'Automated regression suites using Selenium, JUnit, and Postman integrated cleanly into CI/CD.',
            'AI-assisted triage and edge-case prioritization accelerating defect discovery prior to launch.',
          ],
        },
        {
          code: '03 // PROVEN RELIABILITY',
          title: 'Production Defect Prevention',
          points: [
            'Demonstrated 40% reduction in deployment errors through disciplined automated release gates.',
            'Zero-critical-defect track record across B2B e-commerce, enterprise, and GovTech systems.',
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
            {isSpanish ? 'Calidad verificable antes de cada release' : 'Verifiable quality before every release'}
          </h3>
        </div>
        <button
          type="button"
          onClick={openContactModal}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <span>{isSpanish ? 'Blindar tu Software' : 'Audit Your Quality'}</span>
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
