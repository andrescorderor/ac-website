import { ReactNode, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-[95%] md:w-[80%] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl bg-[var(--white)] rounded-2xl border border-[var(--dark-gray)]"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-[var(--black)] px-6 lg:px-16 py-8 lg:py-12 rounded-2xl">
              <div className="absolute right-4 top-4" onClick={onClose}>
                <DynamicButton
                  style="WHITE"
                  name="CloseButton"
                  icon={IoCloseSharp}
                  type="icon-only"
                />
              </div>
              <div className=" text-[var(--white)] font-light tracking-tight pb-4 lg:pb-8 font-dm-sans text-3xl lg:text-5xl cursor-default pr-12">
                {title}
              </div>
              <p className="font-inter text-base font-extralight text-[var(--gray)] break-words cursor-default">
                {paragraph}
              </p>
              {knowledgeSection && (
                <ExpertiseSectionModalHeader expertiseData={expertiseData} />
              )}
            </div>
            <div className="p-6 lg:p-16">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
