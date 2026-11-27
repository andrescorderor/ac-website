import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { FaArrowDown, FaArrowRight, FaGithub, FaLinkedinIn } from 'react-icons/fa';
import { IoLogoWhatsapp } from 'react-icons/io';
import {
  HiOutlineArrowUpRight,
  HiOutlineCheckBadge,
  HiOutlineCodeBracket,
  HiOutlineSquares2X2,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import ContactModal from '@components/common/modals/ContactModal';
import Modal from '@components/common/modals/Modal';
import SignatureMark from '@components/common/SignatureMark';
import PipelineVisualizer from './PipelineVisualizer';
import { expertiseCards } from '@mocks/HomeMocks';
import {
  DEFAULT_CMS_DATA,
  loadPortfolioCms,
  type CmsCertification,
  type CmsExperience,
  type CmsProject,
} from '@/lib/portfolioCms';
import './portfolio-home.css';

const stack = [
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'AWS',
  'Python',
  'CI/CD',
  'Gemini Vision',
  'Playwright',
  'Supabase',
  'Tailwind',
  'Framer Motion',
];

const capabilityCopy = {
  en: [
    {
      title: 'Software development + AI',
      subtitle: 'Build the product and the intelligence around it.',
      detail:
        'Full-stack applications, modern architecture, PWAs, LLM workflows, computer vision and agentic systems—with human oversight where it matters.',
      stack: ['React / TypeScript', 'APIs & data', 'LLM / vision', 'Production delivery'],
      icon: HiOutlineCodeBracket,
      key: 'SD',
    },
    {
      title: 'Process design + PM',
      subtitle: 'Turn operational chaos into an executable system.',
      detail:
        'Translate business goals into clear ownership, roadmaps, measurable milestones and low-friction delivery rituals across teams.',
      stack: ['Discovery', 'Roadmaps', 'Agile delivery', 'Operational metrics'],
      icon: HiOutlineSquares2X2,
      key: 'PM',
    },
    {
      title: 'QA + quality engineering',
      subtitle: 'Build confidence into every release.',
      detail:
        'Risk-based test strategy, automation, CI quality gates and production observability that keep teams moving without sacrificing reliability.',
      stack: ['Test strategy', 'Automation', 'CI / CD', 'Release confidence'],
      icon: HiOutlineShieldCheck,
      key: 'QA',
    },
  ],
  es: [
    {
      title: 'Desarrollo de software + IA',
      subtitle: 'Construir el producto y la inteligencia que lo potencia.',
      detail:
        'Aplicaciones full-stack, arquitecturas modernas, PWA, flujos con LLM, visión computacional y sistemas agénticos con supervisión humana.',
      stack: ['React / TypeScript', 'APIs y datos', 'LLM / visión', 'Entrega a producción'],
      icon: HiOutlineCodeBracket,
      key: 'SD',
    },
    {
      title: 'Diseño de procesos + PM',
      subtitle: 'Transformar el caos operativo en un sistema ejecutable.',
      detail:
        'Convertir objetivos de negocio en responsables claros, roadmaps, hitos medibles y rituales de entrega ágiles entre equipos.',
      stack: ['Discovery', 'Roadmaps', 'Entrega ágil', 'Métricas operativas'],
      icon: HiOutlineSquares2X2,
      key: 'PM',
    },
    {
      title: 'QA + ingeniería de calidad',
      subtitle: 'Incorporar confianza a cada liberación.',
      detail:
        'Estrategia de pruebas basada en riesgo, automatización, controles de CI y observabilidad para avanzar sin sacrificar confiabilidad.',
      stack: ['Estrategia de pruebas', 'Automatización', 'CI / CD', 'Confianza al liberar'],
      icon: HiOutlineShieldCheck,
      key: 'QA',
    },
  ],
} as const;

const sections = ['top', 'capabilities', 'experience', 'projects', 'credentials', 'contact'];

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <motion.div
      className="portfolio-heading"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.span className="portfolio-eyebrow" variants={reveal}>
        {eyebrow}
      </motion.span>
      <motion.h2 variants={reveal}>{title}</motion.h2>
      {detail && <motion.p variants={reveal}>{detail}</motion.p>}
    </motion.div>
  );
}

function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div
      className={`tech-marquee ${reverse ? 'is-reverse' : ''}`}
      role="group"
      tabIndex={0}
      aria-label="Technology stack marquee — focus to pause"
    >
      <div className="tech-marquee-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="tech-marquee-group" key={copy}>
            {stack.map((item) => (
              <span className="tech-chip" key={`${copy}-${item}`}>
                <i />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioHome() {
  const { t, i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;
  const copy = spanish ? capabilityCopy.es : capabilityCopy.en;
  const [activeCapability, setActiveCapability] = useState(0);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState('all');
  const [activeSection, setActiveSection] = useState(0);
  const [cms, setCms] = useState(DEFAULT_CMS_DATA);
  const [cmsSource, setCmsSource] = useState<'default' | 'public_table' | 'system_store'>('default');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTopic, setContactTopic] = useState<string | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: pageRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroParallax = useTransform(scrollYProgress, [0, 0.45], [0, 42]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScroll } = useScroll({ target: timelineRef, offset: ['start 75%', 'end 35%'] });
  const timelineFill = useSpring(timelineScroll, { stiffness: 90, damping: 28, restDelta: 0.001 });

  const openContactWithTopic = (topic?: string) => {
    setContactTopic(topic);
    setContactOpen(true);
  };

  useEffect(() => {
    let active = true;
    loadPortfolioCms().then(({ data, source }) => {
      if (active) {
        setCms(data);
        setCmsSource(source);
      }
    });
    const observed = sections
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(Math.max(0, sections.indexOf(visible.target.id)));
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    );
    observed.forEach((node) => observer.observe(node));
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  const experiences: CmsExperience[] = useMemo(
    () =>
      cmsSource === 'default'
        ? [1, 2, 3, 4].map((number) => ({
            id: `exp${number}`,
            year: number === 4 ? '2020 — 2024' : number === 3 ? '2023 — 2024' : spanish ? '2023 — hoy' : '2023 — now',
            title: t(`experience.exp${number}_title`),
            company: t(`experience.exp${number}_company`),
            description: t(`experience.exp${number}_desc`),
            visible: true,
          }))
        : cms.experiences.filter((item) => item.visible !== false),
    [cms.experiences, cmsSource, spanish, t]
  );

  const projects: CmsProject[] = useMemo(
    () =>
      cmsSource === 'default'
        ? DEFAULT_CMS_DATA.projects.map((item, index) => ({
            ...item,
            title: t(`projects_data.proj${index + 1}_title`),
            description: t(`projects_data.proj${index + 1}_desc`),
            tags: t(`projects_data.proj${index + 1}_tags`, { returnObjects: true }) as string[],
          }))
        : cms.projects.filter((item) => item.visible !== false),
    [cms.projects, cmsSource, t]
  );

  const certifications: CmsCertification[] = useMemo(
    () =>
      cmsSource === 'default'
        ? DEFAULT_CMS_DATA.certifications.map((item, index) => ({
            ...item,
            title: t(`certifications_data.cert${index + 1}_title`),
            subtitle: t(`certifications_data.cert${index + 1}_subtitle`),
          }))
        : cms.certifications.filter((item) => item.visible !== false),
    [cms.certifications, cmsSource, t]
  );

  const filteredProjects = projects.filter((project) => {
    if (activeProjectFilter === 'all') return true;
    const tags = project.tags.join(' ').toLowerCase();
    if (activeProjectFilter === 'ai') return /ai|ia|vision|llm|machine/.test(tags);
    if (activeProjectFilter === 'product') return /react|vue|next|typescript|web|app/.test(tags);
    return /qa|test|quality|process|scrum|automation/.test(tags);
  });

  const filterOptions = spanish
    ? [
        { id: 'all', label: 'Todos' },
        { id: 'product', label: 'Producto' },
        { id: 'ai', label: 'IA' },
        { id: 'quality', label: 'Calidad' },
      ]
    : [
        { id: 'all', label: 'All work' },
        { id: 'product', label: 'Product' },
        { id: 'ai', label: 'AI' },
        { id: 'quality', label: 'Quality' },
      ];

  const expertiseModalIndexes = [1, 0, 2] as const;
  const selectedModal = activeModal === null ? null : expertiseCards[expertiseModalIndexes[activeModal]];
  const modalTitle = selectedModal
    ? selectedModal.id === 'pm'
      ? t('expertise.pm_header_title')
      : selectedModal.id === 'sd'
      ? t('expertise.sd_header_title')
      : t('expertise.qa_header_title')
    : '';
  const modalParagraph = selectedModal
    ? selectedModal.id === 'pm'
      ? t('expertise.pm_header_paragraph')
      : selectedModal.id === 'sd'
      ? t('expertise.sd_header_paragraph')
      : t('expertise.qa_header_paragraph')
    : '';

  const whatsappUrl = useMemo(() => {
    const text = spanish
      ? 'Hola Andrés, visité tu sitio y me interesa conversar sobre desarrollo de software, optimización de procesos o QA.'
      : 'Hi Andrés, I visited your site and would like to discuss software engineering, process optimization, or QA.';
    return `https://wa.me/524777037913?text=${encodeURIComponent(text)}`;
  }, [spanish]);

  return (
    <div ref={pageRef} className="portfolio" lang={spanish ? 'es' : 'en'}>
      <motion.div className="portfolio-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <aside className="portfolio-telemetry" aria-label={spanish ? 'Progreso de navegación' : 'Navigation progress'}>
        <span>{String(activeSection + 1).padStart(2, '0')}</span>
        <i />
        <span>06</span>
      </aside>

      <section id="top" className="portfolio-hero" aria-labelledby="hero-title">
        <div className="portfolio-grid-bg" aria-hidden="true" />
        <div className="hero-glow hero-glow-a" aria-hidden="true" />
        <div className="hero-glow hero-glow-b" aria-hidden="true" />
        <div className="portfolio-shell portfolio-hero-layout">
          <motion.div
            className="portfolio-hero-copy"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
          >
            <motion.div className="portfolio-status" variants={reveal}>
              <span className="status-dot" />
              {t('portfolioRedesign.availability')}
              <span className="status-line" />
              {t('portfolioRedesign.location')}
            </motion.div>
            <motion.div className="hero-brandline" variants={reveal}>
              <SignatureMark size="md" />
              <span>
                INDEPENDENT PRODUCT ENGINEERING
                <br />
                {spanish ? 'DE LA IDEA A PRODUCCIÓN' : 'FROM IDEA TO PRODUCTION'}
              </span>
            </motion.div>
            <motion.p className="portfolio-kicker" variants={reveal}>
              {cms.heroEyebrow.trim() ||
                (spanish ? 'INGENIERÍA · OPERACIONES · INTELIGENCIA' : 'ENGINEERING · OPERATIONS · INTELLIGENCE')}
            </motion.p>
            <motion.h1 id="hero-title" variants={reveal}>
              {cms.heroHeadline.trim() ||
                (spanish ? (
                  <>
                    De la idea
                    <br />
                    <span>a producción.</span>
                  </>
                ) : (
                  <>
                    From idea
                    <br />
                    <span>to production.</span>
                  </>
                ))}
            </motion.h1>
            <motion.p className="portfolio-intro" variants={reveal}>
              {cms.heroBio.trim() ||
                (spanish
                  ? 'Diseño y construyo productos digitales de extremo a extremo: software full-stack, inteligencia aplicada y operaciones listas para escalar.'
                  : 'I design and ship end-to-end digital products: full-stack software, applied intelligence and operations built to scale.')}
            </motion.p>
            <motion.div className="hero-proofline" variants={reveal}>
              <span>
                <i />
                {spanish ? 'ESTRATEGIA' : 'STRATEGY'}
              </span>
              <b>→</b>
              <span>
                <i />
                {spanish ? 'INGENIERÍA' : 'ENGINEERING'}
              </span>
              <b>→</b>
              <span>
                <i />
                {spanish ? 'CONFIANZA' : 'CONFIDENCE'}
              </span>
            </motion.div>
            <motion.div className="portfolio-hero-actions" variants={reveal}>
              <button
                type="button"
                className="portfolio-button portfolio-button-primary"
                onClick={() => openContactWithTopic()}
              >
                {t('portfolioRedesign.contactCta')}
                <FaArrowRight aria-hidden="true" />
              </button>
              <a
                className="portfolio-button portfolio-button-quiet"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('portfolioRedesign.whatsapp')}
              >
                <IoLogoWhatsapp aria-hidden="true" />
                {t('portfolioRedesign.whatsapp')}
              </a>
              <a className="portfolio-button portfolio-button-quiet" href="/assets/Resume.pdf" target="_blank" rel="noreferrer">
                {t('portfolioRedesign.resume')}
                <HiOutlineArrowUpRight aria-hidden="true" />
              </a>
              <a className="portfolio-scroll-link" href="#projects">
                <FaArrowDown aria-hidden="true" />
                <span>{cms.heroCta.trim() || (spanish ? 'Explorar casos' : 'Explore case studies')}</span>
              </a>
            </motion.div>
            <motion.div className="portfolio-socials" variants={reveal}>
              <a href="https://github.com/andrescorderor" target="_blank" rel="noreferrer">
                <FaGithub aria-hidden="true" />
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/andresmcorderor/" target="_blank" rel="noreferrer">
                <FaLinkedinIn aria-hidden="true" />
                LinkedIn
              </a>
              <span className="hero-divider" />
              {spanish ? 'ES / EN' : 'EN / ES'}
            </motion.div>
          </motion.div>
          <motion.div className="hero-visual-wrap" style={{ y: reduceMotion ? 0 : heroParallax }}>
            <PipelineVisualizer spanish={spanish} />
            <div className="hero-visual-caption">
              <span>FIG. 01</span>
              <span>{spanish ? 'CICLO DE ENTREGA DE PRODUCTO' : 'PRODUCT DELIVERY SYSTEM'}</span>
              <SignatureMark size="sm" />
            </div>
          </motion.div>
          <div className="portfolio-scanline">
            <span>SCROLL TO EXPLORE</span>
            <span>↓</span>
            <span>01 — 06</span>
          </div>
        </div>
      </section>

      <section className="portfolio-capabilities portfolio-section" id="capabilities">
        <div className="portfolio-shell">
          <SectionHeading
            eyebrow="WORKBENCH / 01—03"
            title={spanish ? 'Tres disciplinas. Un mismo sistema.' : 'Three disciplines. One connected system.'}
            detail={
              spanish
                ? 'Ingeniería, IA, procesos y calidad coordinados para llevar ideas hasta producción.'
                : 'Engineering, AI, process and quality, orchestrated to take ideas all the way to production.'
            }
          />
          <div className="workbench-layout">
            <div
              className="workbench-selector"
              role="tablist"
              aria-label={spanish ? 'Seleccionar capacidad' : 'Choose a capability'}
            >
              {copy.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    id={`workbench-tab-${item.key}`}
                    role="tab"
                    aria-selected={activeCapability === index}
                    aria-controls="workbench-panel"
                    tabIndex={activeCapability === index ? 0 : -1}
                    type="button"
                    className={`workbench-tab ${activeCapability === index ? 'is-active' : ''}`}
                    onClick={() => setActiveCapability(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                        event.preventDefault();
                        const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + copy.length) % copy.length;
                        setActiveCapability(next);
                        document.getElementById(`workbench-tab-${copy[next].key}`)?.focus();
                      }
                    }}
                  >
                    <span className="workbench-tab-index">0{index + 1}</span>
                    <span className="workbench-tab-icon">
                      <Icon />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.subtitle}</small>
                    </span>
                    <FaArrowRight className="workbench-tab-arrow" />
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.article
                key={activeCapability}
                id="workbench-panel"
                role="tabpanel"
                aria-labelledby={`workbench-tab-${copy[activeCapability].key}`}
                className="workbench-panel"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <div className="workbench-panel-top">
                  <span>MODULE / {copy[activeCapability].key}</span>
                  <span>
                    <i />
                    {spanish ? 'LISTO PARA ENTREGAR' : 'READY TO SHIP'}
                  </span>
                </div>
                <div className="workbench-artifact" aria-hidden="true">
                  {activeCapability === 0 ? (
                    <div className="artifact-architecture">
                      <div className="artifact-node primary">UI / PWA</div>
                      <b>→</b>
                      <div className="artifact-node">API</div>
                      <b>→</b>
                      <div className="artifact-node ai">LLM + VISION</div>
                      <b>→</b>
                      <div className="artifact-node">DATA</div>
                      <span className="artifact-line" />
                    </div>
                  ) : activeCapability === 1 ? (
                    <div className="artifact-roadmap">
                      <span className="roadmap-step done">
                        <i />
                        DISCOVER
                      </span>
                      <span className="roadmap-step done">
                        <i />
                        ALIGN
                      </span>
                      <span className="roadmap-step active">
                        <i />
                        DELIVER
                      </span>
                      <span className="roadmap-step">
                        <i />
                        MEASURE
                      </span>
                    </div>
                  ) : (
                    <div className="artifact-tests">
                      <span className="test-run-label">PIPELINE / E2E</span>
                      {['Auth flows', 'Critical paths', 'Accessibility'].map((test, index) => (
                        <span className="test-run" key={test}>
                          <i>{index < 2 ? '✓' : '···'}</i>
                          {test}
                          <b>{index < 2 ? 'PASS' : 'RUNNING'}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <h3>{copy[activeCapability].subtitle}</h3>
                <p>{copy[activeCapability].detail}</p>
                <div className="workbench-tags">
                  {copy[activeCapability].stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <button type="button" className="workbench-more" onClick={() => setActiveModal(activeCapability)}>
                  {spanish ? 'Explorar disciplina' : 'Explore discipline'}
                  <HiOutlineArrowUpRight />
                </button>
              </motion.article>
            </AnimatePresence>
            <div className="workbench-metric">
              <span>{spanish ? 'DEL CONCEPTO A PRODUCCIÓN' : 'CONCEPT TO PRODUCTION'}</span>
              <b>
                01 <i>—</i> 05
              </b>
              <div>
                <i />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-stack-section" aria-label={spanish ? 'Stack tecnológico' : 'Technology stack'}>
        <div className="portfolio-shell stack-section-heading">
          <span className="portfolio-eyebrow">{spanish ? 'HERRAMIENTAS / SISTEMAS' : 'TOOLS / SYSTEMS'}</span>
          <p>
            {spanish
              ? 'Un stack práctico para construir, integrar y operar.'
              : 'A practical stack to build, integrate and operate.'}
          </p>
        </div>
        <Marquee />
        <Marquee reverse />
      </section>

      <section className="portfolio-experience portfolio-section" id="experience">
        <div className="portfolio-shell">
          <SectionHeading
            eyebrow={spanish ? 'TRAYECTORIA / 02' : 'EXPERIENCE / 02'}
            title={spanish ? 'Experiencia que conecta capas.' : 'Experience across the stack.'}
            detail={
              spanish
                ? 'Liderazgo, ingeniería y calidad aplicados a sistemas que operan en el mundo real.'
                : 'Leadership, engineering and quality applied to systems operating in the real world.'
            }
          />
          <div ref={timelineRef} className="experience-timeline">
            <span className="timeline-track" aria-hidden="true" />
            <motion.span className="timeline-fill" style={{ scaleY: timelineFill, transformOrigin: 'top' }} aria-hidden="true" />
            {experiences.map((item, index) => (
              <motion.article
                key={item.id}
                className="experience-row"
                initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <span className="experience-node" aria-hidden="true">
                  <i />
                </span>
                <span className="experience-index">0{index + 1}</span>
                <span className="experience-date">{item.year}</span>
                <div className="experience-detail">
                  <div className="experience-title-line">
                    <h3>{item.title}</h3>
                    <span>{item.company}</span>
                  </div>
                  <p>{item.description}</p>
                </div>
                <span className="experience-marker">{spanish ? 'ENTREGA' : 'DELIVERY'}</span>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-projects portfolio-section" id="projects">
        <div className="portfolio-shell">
          <SectionHeading
            eyebrow={spanish ? 'CASOS / 03' : 'CASE FILES / 03'}
            title={spanish ? 'Construido para mover indicadores.' : 'Built to move real outcomes.'}
            detail={
              spanish
                ? 'Casos conectados al CMS del portafolio: arquitectura, automatización e impacto operativo.'
                : 'Case studies connected to the portfolio CMS: architecture, automation and operational impact.'
            }
          />
          <div className="project-filters" role="tablist" aria-label={spanish ? 'Filtrar casos' : 'Filter case studies'}>
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                role="tab"
                type="button"
                aria-selected={activeProjectFilter === filter.id}
                onClick={() => setActiveProjectFilter(filter.id)}
                className="project-filter"
              >
                {activeProjectFilter === filter.id && (
                  <motion.span layoutId="project-filter-active" className="project-filter-active" />
                )}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
          <motion.div layout className="project-grid">
            {filteredProjects.map((project, index) => (
              <motion.article
                layout
                key={project.id}
                className={`project-card project-card-${index % 3} spotlight-card`}
                onPointerMove={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty('--mx', `${event.clientX - box.left}px`);
                  event.currentTarget.style.setProperty('--my', `${event.clientY - box.top}px`);
                }}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
              >
                <div className="project-art">
                  <img src={project.image} alt={project.title} loading="lazy" />
                  <span className="project-number">CASE / {String(index + 1).padStart(2, '0')}</span>
                  <span className="project-corner" aria-hidden="true">
                    <HiOutlineArrowUpRight />
                  </span>
                  <div className="project-art-overlay" />
                </div>
                <div className="project-content">
                  <div className="project-domain">{project.tags.slice(0, 2).join(' / ') || 'PRODUCT ENGINEERING'}</div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-tags">
                    {project.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openContactWithTopic(project.title)}
                    className="project-card-foot w-full bg-transparent border-x-0 border-b-0 text-left cursor-pointer"
                  >
                    <span>{spanish ? 'SOLICITAR SISTEMA SIMILAR' : 'DISCUSS SIMILAR SYSTEM'}</span>
                    <HiOutlineArrowUpRight aria-hidden="true" />
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
          {filteredProjects.length === 0 && (
            <p className="projects-empty">
              {spanish ? 'No hay casos en este filtro.' : 'No case studies match this filter.'}
            </p>
          )}
        </div>
      </section>

      <section className="portfolio-credentials portfolio-section" id="credentials">
        <div className="portfolio-shell credentials-layout">
          <div>
            <SectionHeading
              eyebrow={spanish ? 'CREDENCIALES / 04' : 'CREDENTIALS / 04'}
              title={spanish ? 'Aprender. Validar. Aplicar.' : 'Learn. Validate. Apply.'}
              detail={
                spanish
                  ? 'Formación verificada que amplía la capacidad de ejecución en ingeniería y entrega.'
                  : 'Verified learning that expands execution across engineering and delivery.'
              }
            />
            <div className="credential-count">
              <strong>{String(certifications.length).padStart(2, '0')}</strong>
              <span>{spanish ? 'CREDENCIALES' : 'CREDENTIALS'}</span>
            </div>
          </div>
          <div className="credential-list">
            {certifications.map((cert, index) => (
              <a key={cert.id} href={cert.link} target="_blank" rel="noreferrer" className="credential-row">
                <span className="credential-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="credential-copy">
                  <b>{cert.title}</b>
                  <small>{cert.subtitle}</small>
                </span>
                <HiOutlineCheckBadge
                  className="credential-verified"
                  aria-label={spanish ? 'Credencial verificable' : 'Verifiable credential'}
                />
                <HiOutlineArrowUpRight className="credential-external" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-faq portfolio-section" id="faq" aria-label={t('portfolioRedesign.faqHeading')}>
        <div className="portfolio-shell faq-layout">
          <div>
            <SectionHeading eyebrow={t('portfolioRedesign.faqEyebrow')} title={t('portfolioRedesign.faqHeading')} />
            <p className="faq-intro">{t('portfolioRedesign.faqIntro')}</p>
          </div>
          <div className="faq-list">
            {[1, 2, 3].map((number) => (
              <details className="faq-item" key={number}>
                <summary>
                  {t(`portfolioRedesign.faq${number}Question`)}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{t(`portfolioRedesign.faq${number}Answer`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-contact" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="portfolio-shell contact-inner">
          <div>
            <span className="portfolio-eyebrow">{spanish ? 'SIGUIENTE PASO / 05' : 'NEXT STEP / 05'}</span>
            <SignatureMark size="lg" />
            <h2>{spanish ? '¿Qué llevamos a producción?' : 'What will we take to production?'}</h2>
            <p>
              {spanish
                ? 'Cuéntame el reto. Diseñemos una solución clara, confiable y lista para crecer.'
                : 'Tell me about the challenge. Let’s shape a clear, reliable solution built to grow.'}
            </p>
          </div>
          <div className="contact-actions">
            <button
              type="button"
              className="portfolio-button portfolio-button-primary"
              onClick={() => openContactWithTopic()}
            >
              {spanish ? 'Iniciar conversación' : 'Start a conversation'}
              <FaArrowRight aria-hidden="true" />
            </button>
            <a className="portfolio-button portfolio-button-quiet" href={whatsappUrl} target="_blank" rel="noreferrer">
              <IoLogoWhatsapp aria-hidden="true" />
              {t('portfolioRedesign.whatsapp')}
            </a>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={contactOpen}
        onClose={() => {
          setContactOpen(false);
          setContactTopic(undefined);
        }}
        initialTopic={contactTopic}
      />

      {selectedModal && (
        <Modal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          title={modalTitle}
          paragraph={modalParagraph}
          knowledgeSection
          expertiseData={{ images: selectedModal.expertiseData }}
        >
          {selectedModal.child}
        </Modal>
      )}
    </div>
  );
}
