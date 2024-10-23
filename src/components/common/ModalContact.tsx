/* eslint-disable react/button-has-type */
/* eslint-disable tailwindcss/migration-from-tailwind-2 */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-[var(--white)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          X
        </button>
        {children}
      </div>
    </div>
  );
}
