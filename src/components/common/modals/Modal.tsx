import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import ExpertiseSectionModalHeader from './ExpertiseSectionModalHeader';
import { DynamicButton } from '../buttons/DynamicButton';

interface ModalProps {
  isOpen: boolean;
  knowledgeSection?: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  paragraph: string;
  expertiseData?: any;
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

export default function Modal({
  isOpen,
  knowledgeSection,
  onClose,
  children,
  title,
  paragraph,
  expertiseData,
}: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
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
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-[var(--white)] text-[var(--black)] rounded-3xl sm:rounded-[2.5rem] border border-[var(--light-gray)] cursor-default"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Cabecera fija superior */}
            <div className="shrink-0 flex items-start justify-between gap-4 p-6 sm:p-8 md:px-12 border-b border-[var(--light-gray)]">
              <div className="min-w-0">
                <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-2 block">
                  {t('expertise.modal_eyebrow')}
                </span>
                <h2 className="font-dm-sans text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--black)] leading-tight">
                  {title}
                </h2>
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
            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 md:p-12 space-y-10">
              <p className="font-inter text-base sm:text-xl text-[var(--dark-gray)] font-light leading-relaxed max-w-4xl">
                {paragraph}
              </p>

              {knowledgeSection && (
                <div className="pt-8 border-t border-[var(--light-gray)]">
                  <ExpertiseSectionModalHeader expertiseData={expertiseData} />
                </div>
              )}

              <div>{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
