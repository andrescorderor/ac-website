import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { DynamicButton } from '../buttons/DynamicButton';
import { FaCode, FaLinkedinIn, FaProjectDiagram } from 'react-icons/fa';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';
import { ExpertiseContactSection } from '@components/home/ExpertiseContactSection';
import { GrDocumentPerformance } from 'react-icons/gr';
import emailjs from 'emailjs-com';
import { useForm } from 'react-hook-form';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { useAccessibleModal } from './Modal';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useAccessibleModal(isOpen, onClose, panelRef);

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

    const emailData = {
      fullName: data?.fullName || '',
      mailAddress: data?.mailAddress || '',
      message: data?.message || '',
    };

    emailjs.send(serviceId, templateId, emailData, userId).then(
      () => {
        reset();
        toast.success(t('contact.success_message'), {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
          transition: Bounce,
        });
      },
      () => {
        toast.error(t('contact.error_message'), {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
          transition: Bounce,
        });
      }
    );
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
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
            className="relative flex flex-col w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl bg-[var(--white)] text-[var(--black)] rounded-3xl sm:rounded-[2.5rem] border border-[var(--light-gray)] cursor-default outline-none"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Cabecera fija superior (un único cierre semántico) */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 border-b border-[var(--light-gray)]">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src="/assets/ac-website-icon.svg"
                  alt=""
                  className="size-10 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.25em] uppercase text-[10px] block">
                    Andrés Cordero
                  </span>
                  <h2
                    id={titleId}
                    className="font-dm-sans text-lg sm:text-2xl font-bold tracking-tight text-[var(--black)] truncate"
                  >
                    {t('contact.title1')} {t('contact.title2')}
                  </h2>
                </div>
              </div>
              <DynamicButton
                style="BLACK"
                name={t('common.close')}
                icon={IoCloseSharp}
                type="icon-only"
                onClick={onClose}
              />
            </div>

            {/* Cuerpo central scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-10">
              <ToastContainer />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                {/* Columna de resumen y redes */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6 order-2 lg:order-1">
                  <div className="space-y-2">
                    <ExpertiseContactSection
                      title={t('expertise.pm_header_title')}
                      text={t('expertise.pm_subtitle')}
                      icon={FaProjectDiagram}
                    />
                    <ExpertiseContactSection
                      title={t('expertise.sd_header_title')}
                      text={t('expertise.sd_subtitle')}
                      icon={FaCode}
                    />
                    <ExpertiseContactSection
                      title={t('expertise.qa_header_title')}
                      text={t('expertise.qa_subtitle')}
                      icon={GrDocumentPerformance}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--light-gray)]">
                    <DynamicButton
                      style="WHITE"
                      type="icon-only"
                      icon={FaLinkedinIn}
                      name="LinkedIn"
                      onClick={() =>
                        window.open('https://www.linkedin.com/in/andresmcorderor/', '_blank')
                      }
                    />
                    <DynamicButton
                      style="WHITE"
                      type="icon-only"
                      icon={IoMdMail}
                      name="Email"
                      onClick={() =>
                        window.open('mailto:andresmcorderor@gmail.com', '_blank')
                      }
                    />
                    <DynamicButton
                      style="WHITE"
                      type="icon-only"
                      icon={IoLogoWhatsapp}
                      name="WhatsApp"
                      onClick={() =>
                        window.open('https://wa.me/524777037913', '_blank')
                      }
                    />
                  </div>
                </div>

                {/* Columna de formulario */}
                <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-[var(--soft-light-gray)] border border-[var(--light-gray)] p-5 sm:p-7 order-1 lg:order-2">
                  <p className="font-inter pb-5 text-sm sm:text-base font-light text-[var(--dark-gray)]">
                    {t('contact.subtitle')}
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block font-syne text-[11px] font-bold uppercase tracking-widest text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.name_placeholder')} *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        placeholder={t('contact.name_placeholder')}
                        className="font-inter w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--white)] text-[var(--black)] border border-[var(--light-gray)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm"
                        {...register('fullName', {
                          required: t('contact.error_required'),
                        })}
                      />
                      {errors.fullName && (
                        <p role="alert" className="text-xs font-syne font-semibold mt-1.5 text-red-500">
                          {errors.fullName.message as React.ReactNode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="mailAddress"
                        className="block font-syne text-[11px] font-bold uppercase tracking-widest text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.email_placeholder')} *
                      </label>
                      <input
                        id="mailAddress"
                        type="email"
                        placeholder={t('contact.email_placeholder')}
                        className="font-inter w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--white)] text-[var(--black)] border border-[var(--light-gray)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm"
                        {...register('mailAddress', {
                          required: t('contact.error_email'),
                          pattern: {
                            value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                            message: t('contact.error_email_invalid'),
                          },
                        })}
                      />
                      {errors.mailAddress && (
                        <p role="alert" className="text-xs font-syne font-semibold mt-1.5 text-red-500">
                          {errors.mailAddress.message as React.ReactNode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block font-syne text-[11px] font-bold uppercase tracking-widest text-[var(--dark-gray)] mb-1.5"
                      >
                        {t('contact.project_label')}
                      </label>
                      <textarea
                        id="message"
                        placeholder={t('contact.project_placeholder')}
                        className="font-inter w-full p-4 rounded-xl bg-[var(--white)] text-[var(--black)] border border-[var(--light-gray)] focus:border-[var(--vibrant-sky-blue)] focus:outline-none text-sm min-h-[140px] resize-y"
                        rows={5}
                        {...register('message')}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full min-h-[48px] animate-gradient-random font-syne inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      {t('contact.submit')}
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
