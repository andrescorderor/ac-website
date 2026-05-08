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
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="w-full rounded-2xl shadow-md">
      <div
        role="button"
        className="text-[var(--black)] border-b border-[var(--light-gray)] py-6 cursor-pointer flex justify-between items-center group/header"
        onClick={toggleExpand}
      >
        <h2 className="text-lg font-bold font-syne text-[var(--black)]">
          {t('expertise.knowledge_title')}
        </h2>
        <span>
          {isExpanded ? (
            <IoMdArrowDropup className="size-8" />
          ) : (
            <IoMdArrowDropdown className="size-8" />
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex justify-around items-center pt-8">
              {expertiseData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <img src={image.src} alt={image.alt} className="size-16" />

                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.div
                        className="absolute top-0 left-0 cursor-default transform -translate-x-1/2 -translate-y-full bg-[var(--white)] border border-[var(--gray)] text-[var(--black)] text-base font-syne font-bold rounded-full px-2 py-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {image.alt}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
