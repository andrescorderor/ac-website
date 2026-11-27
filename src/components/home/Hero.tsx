import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { HiOutlineDownload } from 'react-icons/hi';
import { DynamicButton } from '../common/buttons/DynamicButton';
import SignatureMark from '@components/common/SignatureMark';
import PipelineVisualizer from './PipelineVisualizer';
import { loadPortfolioCms, PortfolioCmsData } from '@/lib/portfolioCms';

const EASE = [0.16, 1, 0.3, 1] as const;
const HEADLINE_SIZE =
  'font-dm-sans text-[clamp(2.35rem,7.2vw,6.25rem)] lg:text-[clamp(3.5rem,5.2vw,6.25rem)] font-bold leading-[0.95] tracking-tight';

export default function Hero() {
  const { t, i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;
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
    return Array.isArray(fromI18n) && fromI18n.length > 0
      ? (fromI18n as string[])
      : [''];
  }, [t, cmsOverride]);

  useEffect(() => {
    setPhraseIndex(0);
  }, [phrases]);

  useEffect(() => {
    if (reducedMotion || phrases.length < 2) return undefined;
    const id = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3200);
    return () => clearInterval(id);
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
      el.classList.add('spotlight-active');
    });
  };

  const handlePointerLeave = () => {
    sectionRef.current?.classList.remove('spotlight-active');
  };

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative isolate overflow-hidden min-h-screen flex items-center pt-24 pb-12"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[var(--vibrant-sky-blue)]/10 to-transparent blur-[120px] animate-drift-a" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[var(--magenta-pink)]/10 to-transparent blur-[120px] animate-drift-b" />
        <div className="spotlight-surface" />
      </div>

      <div className="container mx-auto max-w-7xl px-6 md:px-12 lg:px-20 w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16">
          <div className="flex-1 z-10 min-w-0">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-6 block"
            >
              {cmsOverride?.heroEyebrow?.trim() || `${t('roles.sd')} & ${t('roles.pm')}`}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              className={`${HEADLINE_SIZE} text-[var(--black)] mb-2 sm:mb-3 whitespace-nowrap`}
            >
              {cmsOverride?.heroHeadline?.trim() || t('hero.make_it')}
            </motion.h1>

            <div className="grid" aria-live="polite" aria-atomic="true">
              {phrases.map((phrase, index) => {
                const isActive = index === phraseIndex;
                return isActive ? (
                  <motion.span
                    key={`active-${phraseIndex}-${phrase}`}
                    initial={reducedMotion ? false : { opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, ease: EASE }}
                    className={`${HEADLINE_SIZE} text-gradient col-start-1 row-start-1 inline-block`}
                  >
                    {phrase}
                  </motion.span>
                ) : (
                  <span
                    key={`ghost-${index}-${phrase}`}
                    aria-hidden="true"
                    className={`${HEADLINE_SIZE} col-start-1 row-start-1 invisible`}
                  >
                    {phrase}
                  </span>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="mt-10 sm:mt-16 lg:mt-20 max-w-2xl"
            >
              <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-start md:items-center">
                <SignatureMark size="lg" />
                <p className="font-inter text-lg sm:text-xl lg:text-2xl font-light tracking-tight text-[var(--dark-gray)] leading-relaxed italic">
                  &quot;{cmsOverride?.heroBio?.trim() || t('hero.paragraph')}&quot;
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 sm:gap-8 mt-8 sm:mt-12">
                <a
                  href="#projects"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .querySelector('#projects')
                      ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
                  }}
                  className="group"
                >
                  <DynamicButton
                    style="BLACK"
                    type="full-static"
                    name={cmsOverride?.heroCta?.trim() || t('hero.cta_work')}
                  />
                </a>

                <div className="flex items-center gap-4 sm:gap-5">
                  {[
                    { icon: HiOutlineDownload, href: '/assets/Resume.pdf', label: 'CV' },
                    { icon: FaGithub, href: 'https://github.com/andrescorderor', label: 'GitHub' },
                    {
                      icon: FaLinkedin,
                      href: 'https://www.linkedin.com/in/andresmcorderor/',
                      label: 'LinkedIn',
                    },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      title={social.label}
                      aria-label={social.label}
                      className="group relative flex items-center justify-center size-14 rounded-2xl bg-[var(--white)] border border-[var(--light-gray)] hover:border-[var(--black)] hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <social.icon className="text-[var(--dark-gray)] group-hover:text-[var(--black)] text-2xl transition-colors duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="flex-1 min-w-0 w-full relative"
          >
            <PipelineVisualizer spanish={spanish} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
