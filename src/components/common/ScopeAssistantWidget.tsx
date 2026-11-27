import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineSparkles, HiOutlineXMark } from 'react-icons/hi2';
import { IoLogoWhatsapp } from 'react-icons/io';
import { submitPublicLead } from '@/lib/leads';

type NeedKey = 'software' | 'process' | 'qa' | 'diagnostic';
type StageKey = 'idea' | 'manual' | 'active_bugs' | 'team_support';

export default function ScopeAssistantWidget() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const spanish = i18n.language?.startsWith('es') ?? true;
  const reduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [need, setNeed] = useState<NeedKey | null>(null);
  const [stage, setStage] = useState<StageKey | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const needOptions: { id: NeedKey; es: string; en: string; tab: 'diagnostico' | 'estimador' | 'checklist_qa' }[] = [
    { id: 'software', es: 'Desarrollar software o IA', en: 'Build custom software or AI', tab: 'estimador' },
    { id: 'process', es: 'Digitalizar / optimizar procesos', en: 'Digitize or optimize workflows', tab: 'diagnostico' },
    { id: 'qa', es: 'Pruebas de software y QA', en: 'Software testing & QA leadership', tab: 'checklist_qa' },
    { id: 'diagnostic', es: 'Hacer diagnóstico gratuito', en: 'Run free interactive diagnostic', tab: 'diagnostico' },
  ];

  const stageOptions: { id: StageKey; es: string; en: string }[] = [
    { id: 'idea', es: 'Idea por aterrizar desde cero', en: 'New idea to scope from scratch' },
    { id: 'manual', es: 'Operamos en Excel / WhatsApp', en: 'Running on spreadsheets / chat' },
    { id: 'active_bugs', es: 'Sistema activo con errores o deuda', en: 'Live product needing stability' },
    { id: 'team_support', es: 'Busco liderazgo técnico o QA externo', en: 'Need external tech / QA lead' },
  ];

  const selectedNeedObj = needOptions.find((n) => n.id === need) || needOptions[0];
  const selectedStageObj = stageOptions.find((s) => s.id === stage);

  const whatsappHref = useMemo(() => {
    const needLabel = spanish ? selectedNeedObj.es : selectedNeedObj.en;
    const stageLabel = selectedStageObj ? (spanish ? selectedStageObj.es : selectedStageObj.en) : '';
    const msg = spanish
      ? `Hola Andrés, usé tu asistente web:\n• Objetivo: ${needLabel}${stageLabel ? `\n• Etapa: ${stageLabel}` : ''}\nMe gustaría agendar una breve llamada.`
      : `Hi Andrés, I used your web assistant:\n• Goal: ${needLabel}${stageLabel ? `\n• Stage: ${stageLabel}` : ''}\nI would like to schedule a quick call.`;
    return `https://wa.me/524777037913?text=${encodeURIComponent(msg)}`;
  }, [spanish, selectedNeedObj, selectedStageObj]);

  const resetFlow = () => {
    setStep(1);
    setNeed(null);
    setStage(null);
    setSent(false);
  };

  const handleQuickLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSending(true);
    const needLabel = spanish ? selectedNeedObj.es : selectedNeedObj.en;
    const stageLabel = selectedStageObj ? (spanish ? selectedStageObj.es : selectedStageObj.en) : '';
    await submitPublicLead({
      fullName,
      email,
      serviceInterest: needLabel,
      source: 'asistente_guiado',
      message: stageLabel ? `Etapa: ${stageLabel}` : needLabel,
      metadata: {
        need: selectedNeedObj.id,
        stage: selectedStageObj?.id || null,
        summary: `${needLabel}${stageLabel ? ` · ${stageLabel}` : ''}`,
      },
    });
    setSending(false);
    setSent(true);
    setFullName('');
    setEmail('');
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[75]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[360px] rounded-xl bg-[var(--site-paper)] text-[var(--site-ink)] border border-[var(--site-line)] shadow-2xl overflow-hidden"
            role="dialog"
            aria-label={spanish ? 'Asistente de alcance' : 'Scope assistant'}
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[var(--site-line)] bg-[var(--site-canvas)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)] block">
                  {spanish ? `GUÍA RÁPIDA · PASO ${step}/3` : `SCOPE GUIDE · STEP ${step}/3`}
                </span>
                <p className="font-semibold text-sm text-[var(--site-ink)] truncate">
                  {spanish ? '¿Cómo te puedo ayudar?' : 'How can I help?'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={spanish ? 'Cerrar asistente' : 'Close assistant'}
                className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--site-line)] text-[var(--site-ink)] flex items-center justify-center cursor-pointer"
              >
                <HiOutlineXMark className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
              {step === 1 && (
                <div className="space-y-2">
                  {needOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setNeed(opt.id);
                        if (opt.id === 'diagnostic') {
                          setIsOpen(false);
                          navigate('/diagnostico?tab=diagnostico');
                        } else {
                          setStep(2);
                        }
                      }}
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-lg bg-[var(--site-canvas)] hover:border-[var(--site-accent)] border border-[var(--site-line)] text-left text-xs font-medium text-[var(--site-ink)] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span>{spanish ? opt.es : opt.en}</span>
                      <HiOutlineArrowRight className="text-[var(--site-accent)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--site-muted)]">
                    {spanish ? '¿Cuál describe mejor tu situación actual?' : 'Which best describes your current stage?'}
                  </p>
                  {stageOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStage(opt.id);
                        setStep(3);
                      }}
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-lg bg-[var(--site-canvas)] hover:border-[var(--site-accent)] border border-[var(--site-line)] text-left text-xs font-medium text-[var(--site-ink)] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span>{spanish ? opt.es : opt.en}</span>
                      <HiOutlineArrowRight className="text-[var(--site-accent)] shrink-0" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="min-h-[40px] font-mono-tech text-[11px] text-[var(--site-muted)] hover:text-[var(--site-ink)] cursor-pointer"
                  >
                    ← {spanish ? 'Cambiar objetivo' : 'Change goal'}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] space-y-1">
                    <span className="font-mono-tech text-[10px] text-[var(--site-accent)] block">
                      {spanish ? selectedNeedObj.es : selectedNeedObj.en}
                    </span>
                    <p className="text-xs text-[var(--site-muted)]">
                      {selectedStageObj ? (spanish ? selectedStageObj.es : selectedStageObj.en) : ''}
                    </p>
                  </div>

                  {sent ? (
                    <div role="status" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                      {spanish
                        ? '¡Listo! Recibí tus datos y te contactaré muy pronto.'
                        : 'Received! I will follow up shortly.'}
                    </div>
                  ) : (
                    <form onSubmit={handleQuickLead} className="space-y-2">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={spanish ? 'Tu nombre *' : 'Your name *'}
                        className="w-full min-h-[44px] px-3 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-xs text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={spanish ? 'Tu correo *' : 'Your email *'}
                        className="w-full min-h-[44px] px-3 rounded-lg bg-[var(--site-canvas)] border border-[var(--site-line)] text-xs text-[var(--site-ink)] focus:outline-none focus:border-[var(--site-accent)]"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full min-h-[44px] rounded-lg bg-[var(--site-ink)] text-[var(--site-canvas)] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>{sending ? (spanish ? 'Enviando...' : 'Sending...') : spanish ? 'Solicitar diagnóstico' : 'Request discovery'}</span>
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <IoLogoWhatsapp className="text-base" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/diagnostico?tab=${selectedNeedObj.tab}`);
                      }}
                      className="min-h-[44px] px-3 rounded-lg border border-[var(--site-line)] bg-[var(--site-canvas)] text-[var(--site-ink)] text-xs font-semibold flex items-center justify-center cursor-pointer"
                    >
                      {spanish ? 'Evaluar ahora' : 'Run tool'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={resetFlow}
                    className="min-h-[36px] font-mono-tech text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)] cursor-pointer"
                  >
                    ↺ {spanish ? 'Reiniciar guía' : 'Start over'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={spanish ? 'Abrir guía rápida de proyecto' : 'Open quick project scope guide'}
        className="min-h-[48px] px-4 rounded-full bg-[var(--site-ink)] text-[var(--site-canvas)] border border-[var(--site-line)] shadow-xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 font-mono-tech text-xs font-medium cursor-pointer"
      >
        <HiOutlineSparkles className="text-base text-[var(--site-accent)]" />
        <span>{spanish ? 'Asistente de Alcance' : 'Scope Guide'}</span>
      </button>
    </div>
  );
}
