import { ReactNode, RefObject, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import ExpertiseSectionModalHeader from './ExpertiseSectionModalHeader';
import SignatureMark from '../SignatureMark';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessible modal behavior:
 * - Preserves and restores previous `document.body.style.overflow`
 * - Saves and restores focus to trigger element on close
 * - Moves initial focus inside the dialog panel and traps Tab / Shift+Tab
 * - Closes on Escape key
 */
export function useAccessibleModal(
  isOpen: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement>
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    const prevFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable || panel).focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusables.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (prevFocused && typeof prevFocused.focus === 'function') {
        prevFocused.focus();
      }
    };
  }, [isOpen, panelRef]);
}

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
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useAccessibleModal(isOpen, onClose, panelRef);

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
            className="portfolio-dialog public-dialog relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.55)] bg-[var(--site-paper)] text-[var(--site-ink)] rounded-xl border border-[var(--site-line)] cursor-default outline-none"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Cabecera fija superior */}
            <div className="shrink-0 flex items-start justify-between gap-4 p-5 sm:p-7 md:px-10 border-b border-[var(--pub-border)] bg-[var(--pub-bg)]/60">
              <div className="flex items-start gap-3.5 min-w-0">
                <SignatureMark size="sm" className="hidden sm:inline-flex mt-0.5" />
                <div className="min-w-0">
                  <span className="font-mono-tech text-[var(--vibrant-sky-blue)] font-semibold tracking-[0.25em] uppercase text-[11px] mb-1.5 block">
                    {t('expertise.modal_eyebrow')}
                  </span>
                  <h2
                    id={titleId}
                    className="font-dm-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--black)] leading-tight"
                  >
                    {title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--pub-border-strong)] text-[var(--black)] flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <IoCloseSharp className="text-xl" />
              </button>
            </div>

            {/* Cuerpo central scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 md:p-10 space-y-8">
              <p className="font-inter text-base sm:text-lg text-[var(--dark-gray)] font-normal leading-relaxed max-w-3xl">
                {paragraph}
              </p>

              {knowledgeSection && (
                <div className="pt-6 border-t border-[var(--pub-border)]">
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
