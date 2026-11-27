import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExpertiseSectionImage } from '@mocks/ExpertiseSectionMocks';
import { HiChevronDown } from 'react-icons/hi';

interface ExpertiseSectionModalHeaderProps {
  expertiseData: {
    images: ExpertiseSectionImage[];
  };
}

export default function ExpertiseSectionModalHeader({
  expertiseData,
}: ExpertiseSectionModalHeaderProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full rounded-2xl bg-[var(--pub-bg)] border border-[var(--pub-border)] overflow-hidden">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-5 py-4 flex justify-between items-center gap-3 text-left hover:bg-[var(--pub-surface-muted)]/60 transition-colors cursor-pointer min-h-[48px]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-widest text-[var(--vibrant-sky-blue)]">
            STACK // {expertiseData.images.length}
          </span>
          <h3 className="text-sm sm:text-base font-bold font-dm-sans text-[var(--black)] tracking-tight truncate">
            {t('expertise.knowledge_title')}
          </h3>
        </div>
        <div className="size-9 flex items-center justify-center rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] shrink-0">
          <HiChevronDown
            className={`text-lg text-[var(--black)] transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[var(--pub-border)]"
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5 p-4 sm:p-5">
              {expertiseData.images.map((image, index) => (
                <div
                  key={`${image.alt}-${index}`}
                  className="group flex flex-col items-center gap-2 p-2.5 rounded-xl bg-[var(--pub-surface)] border border-[var(--pub-border)] hover:border-[var(--vibrant-sky-blue)] transition-all"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="size-9 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-mono-tech text-[10px] font-medium text-[var(--dark-gray)] group-hover:text-[var(--black)] text-center leading-tight truncate max-w-full">
                    {image.alt.replace(/\s*logo$/i, '')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
