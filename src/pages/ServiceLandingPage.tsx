import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlineArrowUpRight, HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi2';
import { IoLogoWhatsapp } from 'react-icons/io';
import SignatureMark from '@components/common/SignatureMark';
import { getGuideBySlug, getServiceBySlug, SERVICE_LANDINGS } from '@/data/seoContent';
import { usePageSeo } from '@/lib/usePageSeo';
import { submitPublicLead } from '@/lib/leads';
import '@components/home/portfolio-home.css';

export default function ServiceLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const spanish = i18n.language?.startsWith('es') ?? true;
  const lang = spanish ? 'es' : 'en';
  const reduceMotion = useReducedMotion();

  const service = getServiceBySlug(slug);
  const relatedGuide = service ? getGuideBySlug(service.relatedGuideSlug) : undefined;
  const otherServices = useMemo(
    () => SERVICE_LANDINGS.filter((item) => item.slug !== slug),
    [slug]
  );

  // Quick lead capture state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const jsonLd = useMemo(() => {
    if (!service) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.topic[lang],
      description: service.metaDescription[lang],
      url: `https://andresmcorderor.netlify.app/servicios/${service.slug}`,
      provider: {
        '@type': 'Person',
        name: 'Andrés Cordero',
        url: 'https://andresmcorderor.netlify.app/',
        email: 'mailto:andresmcorderor@gmail.com',
        telephone: '+524777037913',
      },
      areaServed: ['León', 'Guanajuato', 'México', 'United States'],
      availableLanguage: ['es', 'en'],
    };
  }, [service, lang]);

  usePageSeo({
    title: service ? service.metaTitle[lang] : 'Andrés Cordero',
    description: service ? service.metaDescription[lang] : '',
    path: service ? `/servicios/${service.slug}` : '/',
    jsonLd,
  });

  if (!service) {
    return <Navigate to="/" replace />;
  }

  const whatsappHref = `https://wa.me/524777037913?text=${encodeURIComponent(
    spanish
      ? `Hola Andrés, vi tu página de "${service.topic.es}" y me interesa platicar sobre mi proyecto.`
      : `Hi Andrés, I visited your "${service.topic.en}" page and would like to discuss my project.`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSending(true);
    setStatus('idle');
    const res = await submitPublicLead({
      fullName,
      email,
      company,
      serviceInterest: service.topic[lang],
      source: 'pagina_servicio',
      message: message.trim() || `Solicitud desde /servicios/${service.slug}`,
      metadata: { serviceSlug: service.slug, language: lang },
    });
    setSending(false);
    if (res.savedToSupabase || res.emailSent) {
      setStatus('success');
      setFullName('');
      setEmail('');
      setCompany('');
      setMessage('');
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="portfolio" lang={lang}>
      {/* Hero Banner */}
      <section className="relative pt-32 pb-16 sm:pt-36 sm:pb-20 border-b border-[var(--site-line)] bg-[var(--site-canvas)]">
        <div className="portfolio-grid-bg" aria-hidden="true" />
        <div className="portfolio-shell relative z-10 space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-[44px] font-mono-tech text-xs text-[var(--site-muted)] hover:text-[var(--site-ink)] transition-colors cursor-pointer"
          >
            <HiOutlineArrowLeft className="text-sm" />
            <span>{spanish ? 'Volver al portafolio' : 'Back to portfolio'}</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-7 space-y-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <SignatureMark size="sm" />
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[var(--site-accent)]">
                  {service.eyebrow[lang]}
                </span>
                <span className="font-mono-tech text-[10px] px-2.5 py-1 rounded border border-[var(--site-line)] bg-[var(--site-paper)] text-[var(--site-muted)]">
                  {service.coverageTag[lang]}
                </span>
              </div>

              <h1
                className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.02] text-[var(--site-ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {service.headline[lang]}{' '}
                <span className="text-[var(--site-accent)]">{service.accentWord[lang]}</span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--site-muted)] max-w-2xl leading-relaxed">
                {service.summary[lang]}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
                {service.metrics.map((m) => (
                  <div
                    key={m.value}
                    className="p-3.5 rounded-lg bg-[var(--site-paper)] border border-[var(--site-line)]"
                  >
                    <span className="font-mono-tech text-xs sm:text-sm font-semibold text-[var(--site-accent)] block">
                      {m.value}
                    </span>
                    <span className="text-[11px] text-[var(--site-muted)] block mt-1 leading-snug">
                      {m.label[lang]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to={`/diagnostico?tab=${service.diagnosticTab}`}
                  className="portfolio-button portfolio-button-primary"
                >
                  <HiOutlineSparkles aria-hidden="true" />
                  <span>{spanish ? 'Hacer diagnóstico interactivo' : 'Run interactive diagnostic'}</span>
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="portfolio-button portfolio-button-quiet"
                >
                  <IoLogoWhatsapp aria-hidden="true" />
                  <span>{spanish ? 'WhatsApp directo' : 'Direct WhatsApp'}</span>
                </a>
              </div>
            </motion.div>

            {/* Quick Conversion Capture Card */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="lg:col-span-5 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] p-6 sm:p-7 space-y-4 shadow-sm"
            >
              <div className="space-y-1">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)] block">
                  {service.code} · {spanish ? 'SOLICITUD DIRECTA' : 'DIRECT INQUIRY'}
                </span>
                <h2
                  className="text-xl font-semibold text-[var(--site-ink)]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {spanish ? 'Solicita un diagnóstico sin costo' : 'Request a technical discovery'}
                </h2>
              </div>

              {status === 'success' && (
                <div role="status" className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                  {spanish
                    ? 'Solicitud registrada. Te contactaré a la brevedad para revisar alcance y tiempos.'
                    : 'Inquiry received. I will follow up shortly to review scope and timeline.'}
                </div>
              )}

              {status === 'error' && (
                <div role="alert" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  {spanish
                    ? 'No se pudo enviar en este momento. Puedes escribirme directo por WhatsApp.'
                    : 'Could not send right now. You can message me directly on WhatsApp.'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={spanish ? 'Tu nombre completo *' : 'Your full name *'}
                  className="w-full min-h-[46px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={spanish ? 'Correo profesional *' : 'Work email *'}
                  className="w-full min-h-[46px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={spanish ? 'Empresa o proyecto (opcional)' : 'Company or project (optional)'}
                  className="w-full min-h-[46px] px-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={spanish ? 'Cuéntame brevemente qué proceso o sistema quieres resolver...' : 'Briefly describe the system or workflow you want to build...'}
                  className="w-full min-h-[96px] p-3.5 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-sm text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)] resize-y"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="portfolio-button portfolio-button-primary w-full disabled:opacity-50"
                >
                  <span>{sending ? (spanish ? 'Enviando...' : 'Sending...') : spanish ? 'Enviar solicitud' : 'Send inquiry'}</span>
                  <HiOutlineArrowUpRight aria-hidden="true" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pain Points & Deliverables */}
      <section className="py-16 sm:py-20 bg-[var(--site-paper)] border-b border-[var(--site-line)]">
        <div className="portfolio-shell space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {service.painPoints.map((item, idx) => (
              <div
                key={item.title.es}
                className="p-6 rounded-xl bg-[var(--site-canvas)] border border-[var(--site-line)] space-y-3"
              >
                <span className="font-mono-tech text-[10px] text-[var(--site-accent)]">
                  0{idx + 1} // {spanish ? 'RETO → SOLUCIÓN' : 'CHALLENGE → SOLUTION'}
                </span>
                <h3
                  className="text-lg font-semibold text-[var(--site-ink)] leading-snug"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {item.title[lang]}
                </h3>
                <p className="text-sm text-[var(--site-muted)] leading-relaxed">
                  {item.detail[lang]}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-[var(--site-canvas)] border border-[var(--site-line)] space-y-4">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)] block">
                {spanish ? 'ENTREGABLES CLAVE' : 'KEY DELIVERABLES'}
              </span>
              <ul className="space-y-3">
                {service.deliverables.map((del) => (
                  <li key={del.es} className="flex items-start gap-3 text-sm text-[var(--site-ink)]">
                    <HiOutlineCheckCircle className="text-lg text-[var(--site-accent)] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{del[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {relatedGuide && (
              <div className="lg:col-span-5 p-6 sm:p-8 rounded-xl bg-[var(--site-canvas)] border border-[var(--site-line)] space-y-4">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)] block">
                  {spanish ? 'GUÍA TÉCNICA RELACIONADA' : 'RELATED ENGINEERING GUIDE'}
                </span>
                <h3
                  className="text-lg font-semibold text-[var(--site-ink)] leading-snug"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {relatedGuide.title[lang]}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--site-muted)] leading-relaxed">
                  {relatedGuide.subtitle[lang]}
                </p>
                <Link
                  to={`/guias/${relatedGuide.slug}`}
                  className="inline-flex items-center gap-2 min-h-[44px] font-mono-tech text-xs font-semibold text-[var(--site-accent)] hover:underline cursor-pointer"
                >
                  <span>{spanish ? 'Leer guía completa' : 'Read full guide'}</span>
                  <HiOutlineArrowUpRight />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Internal Cross-Linking for SEO */}
      <section className="py-14 bg-[var(--site-canvas)]">
        <div className="portfolio-shell space-y-5">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-code)] block">
            {spanish ? 'OTRAS LÍNEAS DE SERVICIO' : 'OTHER SERVICE LINES'}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherServices.map((srv) => (
              <Link
                key={srv.slug}
                to={`/servicios/${srv.slug}`}
                className="p-5 rounded-xl bg-[var(--site-paper)] border border-[var(--site-line)] hover:border-[var(--site-accent)] transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="font-mono-tech text-[10px] text-[var(--site-accent)] block">{srv.code}</span>
                  <span className="font-semibold text-sm text-[var(--site-ink)] block truncate mt-0.5">
                    {srv.topic[lang]}
                  </span>
                </div>
                <HiOutlineArrowUpRight className="text-[var(--site-accent)] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
