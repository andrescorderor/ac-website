import { ReactNode, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { Button } from '../Button';
import ExpertiseSectionModalHeader from './ExpertiseSectionModalHeader';

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

export default function ModalContact({
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
            className="relative w-[80%] shadow-lg bg-[var(--white)] rounded-2xl "
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-[var(--black)] px-16 py-12 rounded-2xl">
              <div className="absolute right-4 top-4" onClick={onClose}>
                <Button
                  style="WHITE"
                  name="Become a client"
                  icon={IoCloseSharp}
                  type="icon-only"
                />
              </div>
              <div className=" text-[var(--white)] font-semibold pb-8 font-dm-sans text-5xl  cursor-default">
                {title}
              </div>
              <p className="font-inter text-base font-extralight text-[var(--gray)] break-words cursor-default">
                {paragraph}
              </p>
              {knowledgeSection && (
                <ExpertiseSectionModalHeader expertiseData={expertiseData} />
              )}
            </div>
            <div className="p-16">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
