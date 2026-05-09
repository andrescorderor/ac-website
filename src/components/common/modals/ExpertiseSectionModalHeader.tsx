import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExpertiseSectionImage } from '@mocks/ExpertiseSectionMocks';
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full">
      <div
        role="button"
        className="text-[var(--black)] border-b border-[var(--light-gray)] py-6 cursor-pointer flex justify-between items-center group/header hover:bg-[var(--soft-light-gray)]/30 px-4 -mx-4 transition-colors rounded-t-xl"
        onClick={toggleExpand}
      >
        <h2 className="text-xl font-bold font-syne text-[var(--black)] tracking-tight">
          {t('expertise.knowledge_title')}
        </h2>
        <div className="size-10 flex items-center justify-center rounded-full border border-[var(--light-gray)] group-hover/header:border-[var(--black)] transition-colors">
          {isExpanded ? (
            <IoMdArrowDropup className="size-6" />
          ) : (
            <IoMdArrowDropdown className="size-6" />
          )}
        </div>
      </div>

      <AnimatePresence initial={true}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 py-10 px-2">
              {expertiseData.images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="relative size-16 sm:size-20 flex items-center justify-center rounded-2xl bg-[var(--soft-light-gray)] border border-transparent group-hover:border-[var(--vibrant-sky-blue)] group-hover:bg-white group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="size-10 sm:size-12 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
                    />
                  </div>
                  <span className="font-syne text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--dark-gray)] group-hover:text-[var(--black)] text-center transition-colors">
                    {image.alt}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
