import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { FaCode, FaLinkedinIn, FaProjectDiagram } from 'react-icons/fa';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineLocationMarker } from 'react-icons/hi';
import emailjs from 'emailjs-com';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAccessibleModal } from './Modal';
import SignatureMark from '../SignatureMark';

export const CONTACT_MODAL_EVENT = 'ac_open_contact_modal';

export function openContactModal(presetTopic?: unknown) {
  const topic = typeof presetTopic === 'string' && presetTopic.trim() ? presetTopic.trim() : undefined;
  window.dispatchEvent(new CustomEvent<{ topic?: string }>(CONTACT_MODAL_EVENT, { detail: { topic } }));
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.96 },
};

export default function ContactModal({ isOpen, onClose, initialTopic }: ContactModalProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const topicOptions = useMemo(
    () =>
      isSpanish
        ? [
            'Desarrollo de Software & IA',
            'Digitalización y Optimización de Procesos',
            'Pruebas de Software y QA',
            'Consultoría Integral',
          ]
        : [
            'Custom Software & AI',
            'Process Digitization & PM',
            'Software Testing & QA',
            'Full Engineering Advisory',
          ],
    [isSpanish]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initialTopic && initialTopic.trim()) {
      setSelectedTopic(initialTopic.trim());
    } else {
      setSelectedTopic(topicOptions[0]);
    }
  }, [isOpen, initialTopic, topicOptions]);

  const handleClose = () => {
    setSubmitState('idle');
    onClose();
  };

  useAccessibleModal(isOpen, handleClose, panelRef);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data: Record<string, unknown> | undefined) => {
    const serviceId = 'service_4tnvqx8';
    const templateId = 'template_jsty4d9';
    const userId = 'UFG_EnlAJMQC_VCCO';

    const rawMessage = typeof data?.message === 'string' ? data.message.trim() : '';
    const topicPrefix = selectedTopic ? `[Interés: ${selectedTopic}]\n\n` : '';

    const emailData = {
      fullName: data?.fullName || '',
      mailAddress: data?.mailAddress || '',
      message: `${topicPrefix}${rawMessage}`,
    };

    setSending(true);
    setSubmitState('idle');

    emailjs
      .send(serviceId, templateId, emailData, userId)
      .then(() => {
        reset();
        setSubmitState('success');
      })
      .catch(() => {
        setSubmitState('error');
      })
      .finally(() => {
        setSending(false);
      });
  };

  const disciplines = [
    {
      icon: FaCode,
      code: 'DEV + AI',
      title: t('expertise.sd_header_title'),
      desc: t('expertise.sd_subtitle'),
    },
    {
      icon: FaProjectDiagram,
      code: 'PROCESS + PM',
      title: t('expertise.pm_header_title'),
      desc: t('expertise.pm_subtitle'),
    },
    {
      icon: HiOutlineCheckCircle,
      code: 'QA CONTROL',
      title: t('expertise.qa_header_title'),
      desc: t('expertise.qa_subtitle'),
    },
  ];

  const whatsappHref = useMemo(() => {
    const topic = selectedTopic || (isSpanish ? 'desarrollo de software / procesos / QA' : 'software engineering / processes / QA');
    const text = isSpanish
      ? `Hola Andrés, me interesa conversar sobre: ${topic}.`
      : `Hi Andrés, I would like to discuss: ${topic}.`;
    return `https://wa.me/524777037913?text=${encodeURIComponent(text)}`;
  }, [isSpanish, selectedTopic]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="portfolio-dialog public-dialog relative flex flex-col w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl bg-[var(--site-paper)] text-[var(--site-ink)] rounded-xl border border-[var(--site-line)] cursor-default outline-none"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Cabecera fija superior */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 border-b border-[var(--pub-border)] bg-[var(--pub-bg)]/60">
              <div className="flex items-center gap-3.5 min-w-0">
                <SignatureMark size="sm" />
                <div className="min-w-0">
                  <span className="font-mono-tech text-[var(--vibrant-sky-blue)] font-semibold tracking-[0.2em] uppercase text-[10px] block truncate">
                    {isSpanish
                      ? 'CANAL DIRECTO // LEÓN, GTO. · TODO MÉXICO · EN/ES'
                      : 'DIRECT CHANNEL // LEÓN, MX · REMOTE WORLDWIDE · EN/ES'}
                  </span>
                  <h2
                    id={titleId}
                    className="font-dm-sans text-lg sm:text-2xl font-bold tracking-tight text-[var(--black)] truncate"
                  >
                    {t('contact.title1')} {t('contact.title2')}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label={t('common.close')}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--black)] flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <IoCloseSharp className="text-xl" />
              </button>
            </div>

            {/* Cuerpo central scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna de resumen y canales directos */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-5 order-2 lg:order-1">
                  <div className="p-3.5 rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-[var(--vibrant-sky-blue)]/12 text-[var(--vibrant-sky-blue)] flex items-center justify-center shrink-0">
                      <HiOutlineLocationMarker className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-wider text-[var(--vibrant-sky-blue)] block">
                        {isSpanish ? 'Cobertura Operativa' : 'Service Coverage'}
                      </span>
                      <span className="font-inter text-xs text-[var(--black)] block">
                        {isSpanish
                          ? 'León, Guanajuato · Todo México · Inglés / Español'
                          : 'León, Guanajuato · All Mexico · English / Spanish'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {disciplines.map((d) => (
                      <div
                        key={d.code}
                        className="p-4 rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] flex items-start gap-3.5"
                      >
                        <div className="size-10 rounded-xl bg-[var(--vibrant-sky-blue)]/12 border border-[var(--vibrant-sky-blue)]/25 flex items-center justify-center text-[var(--vibrant-sky-blue)] shrink-0">
                          <d.icon className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)] block">
                            {d.code}
                          </span>
                          <h3 className="font-dm-sans font-bold text-sm text-[var(--black)]">
                            {d.title}
                          </h3>
                          <p className="font-inter text-xs text-[var(--dark-gray)] mt-0.5 leading-relaxed">
                            {d.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[var(--pub-border)]">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full min-h-[48px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <IoLogoWhatsapp className="text-lg" />
                      <span>{isSpanish ? 'Escribir por WhatsApp Directo' : 'Message on WhatsApp'}</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { icon: FaLinkedinIn, href: 'https://www.linkedin.com/in/andresmcorderor/', label: 'LinkedIn' },
                        { icon: IoMdMail, href: 'mailto:andresmcorderor@gmail.com', label: 'Email' },
                      ].map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-3.5 min-h-[44px] rounded-xl bg-[var(--pub-bg)] border border-[var(--pub-border)] hover:border-[var(--vibrant-sky-blue)] text-[var(--black)] font-mono-tech text-xs font-medium transition-all cursor-pointer"
                        >
                          <s.icon className="text-sm text-[var(--vibrant-sky-blue)]" />
                          <span>{s.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna de formulario */}
                <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-[var(--pub-bg)] border border-[var(--pub-border)] p-5 sm:p-7 order-1 lg:order-2 space-y-4">
                  <p className="font-inter text-sm text-[var(--dark-gray)]">{t('contact.subtitle')}</p>

                  {/* Selector rápido de enfoque / servicio */}
                  <div className="space-y-2">
                    <span className="block font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--dark-gray)]">
                      {isSpanish ? 'Área de interés' : 'Focus area'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {topicOptions.map((topic) => {
                        const active = selectedTopic === topic;
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setSelectedTopic(topic)}
                            className={`px-3 min-h-[44px] rounded-xl font-mono-tech text-[11px] font-semibold border transition-all cursor-pointer ${
                              active
                                ? 'bg-[var(--black)] text-[var(--white)] border-transparent shadow-xs'
                                : 'bg-[var(--pub-surface)] text-[var(--dark-gray)] border-[var(--pub-border)] hover:text-[var(--black)]'
                            }`}
                          >
                            {topic}
                          </button>
                        );
                      })}
                      {selectedTopic && !topicOptions.includes(selectedTopic) && (
                        <span className="px-3 min-h-[44px] rounded-xl font-mono-tech text-[11px] font-semibold bg-[var(--vibrant-sky-blue)]/15 text-[var(--vibrant-sky-blue)] border border-[var(--vibrant-sky-blue)]/40 inline-flex items-center">
                          {selectedTopic}
                        </span>
                      )}
                    </div>
                  </div>

                  {submitState === 'success' && (
                    <div
                      role="status"
                      className="p-3.5 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-inter flex items-center gap-2.5"
                    >
                      <HiOutlineCheckCircle className="text-lg shrink-0 text-emerald-500" />
                      <span>{t('contact.success_message')}</span>
                    </div>
                  )}

                  {submitState === 'error' && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-500/12 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-inter flex items-center gap-2.5"
                    >
                      <HiOutlineExclamationCircle className="text-lg shrink-0 text-rose-500" />
                      <span>{t('contact.error_message')}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.name_placeholder')} *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        placeholder={t('contact.name_placeholder')}
                        className="font-inter w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--pub-surface)] text-[var(--black)] border border-[var(--pub-border)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm"
                        {...register('fullName', {
                          required: t('contact.error_required'),
                        })}
                      />
                      {errors.fullName && (
                        <p role="alert" className="text-xs font-mono-tech mt-1.5 text-rose-500">
                          {errors.fullName.message as React.ReactNode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="mailAddress"
                        className="block font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.email_placeholder')} *
                      </label>
                      <input
                        id="mailAddress"
                        type="email"
                        placeholder={t('contact.email_placeholder')}
                        className="font-inter w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--pub-surface)] text-[var(--black)] border border-[var(--pub-border)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm"
                        {...register('mailAddress', {
                          required: t('contact.error_email'),
                          pattern: {
                            value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                            message: t('contact.error_email_invalid'),
                          },
                        })}
                      />
                      {errors.mailAddress && (
                        <p role="alert" className="text-xs font-mono-tech mt-1.5 text-rose-500">
                          {errors.mailAddress.message as React.ReactNode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block font-mono-tech text-[11px] font-semibold uppercase tracking-wider text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.project_label')}
                      </label>
                      <textarea
                        id="message"
                        placeholder={t('contact.project_placeholder')}
                        className="font-inter w-full p-4 rounded-xl bg-[var(--pub-surface)] text-[var(--black)] border border-[var(--pub-border)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm min-h-[140px] resize-y"
                        rows={5}
                        {...register('message')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full min-h-[48px] font-syne inline-flex items-center justify-center rounded-xl bg-[var(--black)] text-[var(--white)] px-6 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sending ? (isSpanish ? 'Enviando...' : 'Sending...') : t('contact.submit')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
