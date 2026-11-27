import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineArrowUpRight, HiOutlineSparkles } from 'react-icons/hi2';
import { IoLogoWhatsapp } from 'react-icons/io';
import { getGuideBySlug, getServiceBySlug, TECHNICAL_GUIDES } from '@/data/seoContent';
import { usePageSeo } from '@/lib/usePageSeo';
import '@components/home/portfolio-home.css';

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;
  const lang = spanish ? 'es' : 'en';

  const guide = getGuideBySlug(slug);
  const relatedService = guide ? getServiceBySlug(guide.relatedServiceSlug) : undefined;
  const otherGuides = useMemo(
    () => TECHNICAL_GUIDES.filter((g) => g.slug !== slug),
    [slug]
  );

  const jsonLd = useMemo(() => {
    if (!guide) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title[lang],
      description: guide.metaDescription[lang],
      datePublished: guide.publishedDate,
      dateModified: guide.publishedDate,
      inLanguage: spanish ? 'es-MX' : 'en',
      author: {
        '@type': 'Person',
        name: 'Andrés Cordero',
        url: 'https://andresmcorderor.netlify.app/',
      },
      publisher: {
        '@type': 'Person',
        name: 'Andrés Cordero',
      },
      mainEntityOfPage: `https://andresmcorderor.netlify.app/guias/${guide.slug}`,
    };
  }, [guide, lang, spanish]);

  usePageSeo({
    title: guide ? guide.metaTitle[lang] : 'Andrés Cordero',
    description: guide ? guide.metaDescription[lang] : '',
    path: guide ? `/guias/${guide.slug}` : '/',
    jsonLd,
  });

  if (!guide) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="portfolio" lang={lang}>
      <article className="pt-32 pb-20 sm:pt-36 bg-[var(--site-canvas)]">
        <div className="portfolio-shell max-w-4xl space-y-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-[44px] font-mono-tech text-xs text-[var(--site-muted)] hover:text-[var(--site-ink)] cursor-pointer"
          >
            <HiOutlineArrowLeft />
            <span>{spanish ? 'Volver al inicio' : 'Back home'}</span>
          </Link>

          <header className="space-y-4 border-b border-[var(--site-line)] pb-8">
            <div className="flex flex-wrap items-center gap-3 font-mono-tech text-[11px] text-[var(--site-accent)]">
              <span>{guide.code}</span>
              <span>·</span>
              <span>{guide.readTime[lang]}</span>
              <span>·</span>
              <span className="text-[var(--site-muted)]">Andrés Cordero</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.06] text-[var(--site-ink)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {guide.title[lang]}
            </h1>

            <p className="text-base sm:text-lg text-[var(--site-muted)] leading-relaxed">
              {guide.subtitle[lang]}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {guide.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded border border-[var(--site-line)] bg-[var(--site-paper)] font-mono-tech text-[10px] text-[var(--site-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="space-y-6">
            {guide.sections.map((sec) => (
              <section
                key={sec.heading.es}
                className="p-6 sm:p-8 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] space-y-3"
              >
                <h2
                  className="text-xl sm:text-2xl font-semibold text-[var(--site-ink)]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {sec.heading[lang]}
                </h2>
                <p className="text-sm sm:text-base text-[var(--site-muted)] leading-relaxed">
                  {sec.body[lang]}
                </p>
                <div className="pt-3 border-t border-[var(--site-line)] font-mono-tech text-xs text-[var(--site-accent)]">
                  → {sec.takeaway[lang]}
                </div>
              </section>
            ))}
          </div>

          {/* Conversion CTA Box */}
          <div className="p-6 sm:p-8 rounded-xl bg-[var(--site-paper)] border border-[var(--site-accent)]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)] block">
                {spanish ? 'SIGUIENTE PASO PRÁCTICO' : 'PRACTICAL NEXT STEP'}
              </span>
              <h3
                className="text-xl sm:text-2xl font-semibold text-[var(--site-ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {spanish ? 'Evalúa el estado actual de tu operación en 2 minutos' : 'Assess your current workflow in 2 minutes'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to={`/diagnostico?tab=${guide.diagnosticTab}`}
                className="portfolio-button portfolio-button-primary"
              >
                <HiOutlineSparkles aria-hidden="true" />
                <span>{spanish ? 'Abrir Diagnóstico' : 'Open Diagnostic'}</span>
              </Link>
              <a
                href={`https://wa.me/524777037913?text=${encodeURIComponent(
                  spanish
                    ? `Hola Andrés, leí tu guía "${guide.title.es}" y quiero revisar cómo aplicarlo en mi empresa.`
                    : `Hi Andrés, I read your guide "${guide.title.en}" and want to discuss applying this to our team.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="portfolio-button portfolio-button-quiet"
              >
                <IoLogoWhatsapp aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Related Service & Other Guides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {relatedService && (
              <Link
                to={`/servicios/${relatedService.slug}`}
                className="p-5 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] hover:border-[var(--site-accent)] transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="font-mono-tech text-[10px] text-[var(--site-accent)] block">
                    {spanish ? 'SERVICIO RELACIONADO' : 'RELATED SERVICE'}
                  </span>
                  <span className="font-semibold text-sm text-[var(--site-ink)] block truncate mt-0.5">
                    {relatedService.topic[lang]}
                  </span>
                </div>
                <HiOutlineArrowUpRight className="text-[var(--site-accent)] shrink-0" />
              </Link>
            )}
            {otherGuides.map((g) => (
              <Link
                key={g.slug}
                to={`/guias/${g.slug}`}
                className="p-5 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] hover:border-[var(--site-accent)] transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="font-mono-tech text-[10px] text-[var(--site-code)] block">{g.code}</span>
                  <span className="font-semibold text-sm text-[var(--site-ink)] block truncate mt-0.5">
                    {g.title[lang]}
                  </span>
                </div>
                <HiOutlineArrowUpRight className="text-[var(--site-accent)] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
