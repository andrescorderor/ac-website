/* eslint-disable @typescript-eslint/lines-between-class-members */
/* eslint-disable react/button-has-type */
/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { ReactNode, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { Button } from '../Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  paragraph: string;
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
  onClose,
  children,
  title,
  paragraph,
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
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black rounded-2xl bg-opacity-50 backdrop-blur-md"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-5xl shadow-lg bg-[var(--white)] rounded-2xl "
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-[var(--black)] p-16 rounded-2xl">
              <div
                className="absolute text-4xl right-4 top-4 hover:text-gray-500 text-gray-700"
                onClick={onClose}
              >
                <Button
                  name="Become a client"
                  icon={IoCloseSharp}
                  type="icon-only"
                />
              </div>
              <div className=" text-[var(--white)] text-2xl font-semibold pb-8 font-dm-sans text-[4rem]  ">
                {title}
              </div>
              <p className="font-inter font-extralight text-[var(--gray)] hover:cursor-default  break-words">
                {paragraph}
              </p>
            </div>
            <div className="p-16">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
