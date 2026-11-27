import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { IoLogoWhatsapp } from 'react-icons/io';
import { HiOutlineDownload, HiOutlineArrowRight, HiOutlineMail, HiOutlineLocationMarker } from 'react-icons/hi';
import SignatureMark from '@components/common/SignatureMark';
import { openContactModal } from '@components/common/modals/ContactModal';
import { loadPortfolioCms, PortfolioCmsData } from '@/lib/portfolioCms';
import PipelineVisualizer from './PipelineVisualizer';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const reducedMotion = useReducedMotion();
  const [cmsOverride, setCmsOverride] = useState<PortfolioCmsData | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    loadPortfolioCms().then(({ data }) => {
      setCmsOverride(data);
    });
  }, []);

  const phrases = useMemo(() => {
    if (cmsOverride?.heroPhrases && cmsOverride.heroPhrases.length > 0) {
      return cmsOverride.heroPhrases;
    }
    const fromI18n = t('hero.phrases', { returnObjects: true }) as unknown;
    return Array.isArray(fromI18n) && fromI18n.length > 0 ? (fromI18n as string[]) : [''];
  }, [t, cmsOverride]);

  useEffect(() => {
    setPhraseIndex(0);
  }, [phrases]);

  useEffect(() => {
    if (reducedMotion || phrases.length < 2) return undefined;
    const id = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [phrases.length, reducedMotion]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const el = sectionRef.current;
    if (!el) return;
    const { clientX, clientY } = e;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - rect.left}px`);
      el.style.setProperty('--my', `${clientY - rect.top}px`);
      el.classList.add('arch-spotlight-active');
    });
  };

  const handlePointerLeave = () => {
    sectionRef.current?.classList.remove('arch-spotlight-active');
  };

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const quickStats = isSpanish
    ? [
        { val: '0 → PROD', label: 'Software a medida' },
        { val: 'AI + OPS', label: 'Procesos e IA' },
        { val: 'QA LEAD', label: 'Pruebas y calidad' },
        { val: 'MX / EN', label: 'Alcance bilingüe' },
      ]
    : [
        { val: '0 → PROD', label: 'Custom software' },
        { val: 'AI + OPS', label: 'Processes & AI' },
        { val: 'QA LEAD', label: 'Testing & quality' },
        { val: 'MX / EN', label: 'Bilingual scope' },
      ];

  const whatsappUrl = useMemo(() => {
    const msg = isSpanish
      ? 'Hola Andrés, visité tu sitio y me gustaría platicar sobre desarrollo de software, procesos o QA.'
      : 'Hi Andrés, I visited your website and would like to discuss software engineering, process optimization, or QA.';
    return `https://wa.me/524777037913?text=${encodeURIComponent(msg)}`;
  }, [isSpanish]);

  return (
    <section
      id="hero-section"
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="arch-spotlight-parent relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24"
    >
      {/* Background Architectural Layer */}
      <div className="arch-grid-canvas absolute inset-0 -z-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-[var(--vibrant-sky-blue)]/10 blur-[130px] animate-drift-a" />
        <div className="absolute -bottom-24 -right-24 w-[460px] h-[460px] rounded-full bg-[var(--magenta-pink)]/10 blur-[130px] animate-drift-b" />
        <div className="arch-spotlight" />
      </div>

      <div className="container mx-auto max-w-6xl px-5 sm:px-8 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Identity & Value Proposition (Zero Personal Photos) */}
          <div className="lg:col-span-6 space-y-6 min-w-0">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex flex-wrap items-center gap-2.5"
            >
              <SignatureMark size="md" animated />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pub-surface)] border border-[var(--pub-border)] shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--black)]">
                  {cmsOverride?.heroEyebrow?.trim() ||
                    (isSpanish
                      ? 'Ingeniería · IA · Procesos · QA'
                      : 'Engineering · AI · Processes · QA')}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--pub-surface)] border border-[var(--pub-border)] shadow-2xs">
                <HiOutlineLocationMarker className="text-sm text-[var(--vibrant-sky-blue)] shrink-0" />
                <span className="font-mono-tech text-[11px] font-medium text-[var(--dark-gray)]">
                  {isSpanish ? 'León, Gto. · Todo México · EN / ES' : 'León, MX · Nationwide & Remote · EN / ES'}
                </span>
              </div>
            </motion.div>

            {/* Kinetic Headline + Width-Locked Specialty Rotator */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="space-y-1"
            >
              <h1 className="font-dm-sans text-[clamp(2.4rem,6vw,4.35rem)] font-bold leading-[0.98] tracking-tight text-[var(--black)]">
                {cmsOverride?.heroHeadline?.trim() || t('hero.make_it')}
              </h1>

              <div className="grid" aria-live="polite" aria-atomic="true">
                {phrases.map((phrase, index) => {
                  const isActive = index === phraseIndex;
                  const textCls =
                    'font-dm-sans text-[clamp(2.4rem,6vw,4.35rem)] font-bold leading-[1.02] tracking-tight col-start-1 row-start-1';
                  return isActive ? (
                    <motion.span
                      key={`active-${phraseIndex}-${phrase}`}
                      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={`${textCls} text-gradient inline-block`}
                    >
                      {phrase}
                    </motion.span>
                  ) : (
                    <span key={`ghost-${index}-${phrase}`} aria-hidden="true" className={`${textCls} invisible`}>
                      {phrase}
                    </span>
                  );
                })}
              </div>
            </motion.div>

            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="font-inter text-base sm:text-lg text-[var(--dark-gray)] leading-relaxed max-w-xl"
            >
              {cmsOverride?.heroBio?.trim() || t('hero.paragraph')}
            </motion.p>

            {/* Compact Telemetry Strip */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            >
              {quickStats.map((stat) => (
                <div
                  key={stat.val}
                  className="p-3 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] shadow-2xs"
                >
                  <span className="font-mono-tech text-xs font-bold text-[var(--vibrant-sky-blue)] block">
                    {stat.val}
                  </span>
                  <span className="font-inter text-[11px] text-[var(--dark-gray)] block mt-0.5 truncate">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Primary & Secondary Action Cluster */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <button
                type="button"
                onClick={() => openContactModal()}
                className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[var(--black)] text-[var(--white)] font-syne text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                <HiOutlineMail className="text-base" />
                <span>{isSpanish ? 'Cotizar / Platicar' : "Let's build together"}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-syne text-xs font-bold uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <IoLogoWhatsapp className="text-base" />
                <span>WhatsApp</span>
              </a>

              <a
                href="#portfolio-section"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('portfolio-section')
                    ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border-strong)] text-[var(--black)] font-syne text-xs font-bold uppercase tracking-wider hover:border-[var(--vibrant-sky-blue)] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{cmsOverride?.heroCta?.trim() || t('hero.cta_work')}</span>
                <HiOutlineArrowRight className="text-base" />
              </a>

              <div className="flex items-center gap-2">
                <a
                  href="/assets/Resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="CV PDF"
                  title={isSpanish ? 'Descargar CV (PDF)' : 'Download Resume (PDF)'}
                  className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--vibrant-sky-blue)] text-[var(--black)] flex items-center justify-center gap-1.5 font-mono-tech text-xs font-semibold transition-all cursor-pointer"
                >
                  <HiOutlineDownload className="text-lg text-[var(--vibrant-sky-blue)]" />
                  <span>CV</span>
                </a>
                <a
                  href="https://github.com/andrescorderor"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                  className="size-12 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--dark-gray)] hover:text-[var(--black)] flex items-center justify-center transition-all cursor-pointer"
                >
                  <FaGithub className="text-lg" />
                </a>
                <a
                  href="https://www.linkedin.com/in/andresmcorderor/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="size-12 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--dark-gray)] hover:text-[var(--black)] flex items-center justify-center transition-all cursor-pointer"
                >
                  <FaLinkedin className="text-lg" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right Live Interactive Pipeline Console */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: EASE }}
            className="lg:col-span-6 min-w-0"
          >
            <PipelineVisualizer />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
