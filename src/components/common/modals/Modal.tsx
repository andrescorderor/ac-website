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
  hidden: { opacity: 0, y: '-50%', scale: 0.8 },
  visible: { opacity: 1, y: '0%', scale: 1 },
  exit: { opacity: 0, y: '50%', scale: 0.8 },
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-[95%] md:w-[80%] lg:w-[65%] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-white rounded-[2.5rem] border border-[var(--light-gray)]"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-8 md:p-16">
              <div className="absolute right-8 top-8 z-20" onClick={onClose}>
                <DynamicButton
                  style="BLACK"
                  name={t('common.close')}
                  icon={IoCloseSharp}
                  type="icon-only"
                />
              </div>
              
              <div className="max-w-4xl">
                <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-6 block">
                  {t('expertise.modal_eyebrow')}
                </span>
                <h2 className="font-dm-sans text-4xl lg:text-6xl font-bold tracking-tight text-[var(--black)] leading-tight mb-8">
                  {title}
                </h2>
                <p className="font-inter text-xl text-[var(--dark-gray)] font-light leading-relaxed mb-12">
                  {paragraph}
                </p>
                
                {knowledgeSection && (
                  <div className="mt-12 pt-12 border-t border-[var(--light-gray)]">
                    <ExpertiseSectionModalHeader expertiseData={expertiseData} />
                  </div>
                )}
              </div>

              <div className="mt-12">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
