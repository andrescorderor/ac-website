import ExpertiseSectionCard from '@components/common/cards/ExpertiseSectionCard';
import { expertiseCards } from '@mocks/HomeMocks';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function ExpertiseSection() {
  const { t } = useTranslation();
  return (
    <section className="relative px-6 md:px-16 lg:px-36 py-32 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-20">
        <div className="w-full lg:w-2/5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-6 block">
              {t('expertise.title')} — CORE COMPETENCIES
            </span>
            <h2 className="font-dm-sans text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-[var(--black)] mb-10">
              Strategic <span className="text-gradient">Core</span>
            </h2>
            <div className="h-2 w-24 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full mb-12" />
            <p className="font-inter text-xl text-[var(--dark-gray)] font-light leading-relaxed max-w-md">
              {t('expertise.intro')}
            </p>
          </motion.div>
        </div>

        <div className="w-full lg:w-3/5 flex flex-col gap-6">
          {expertiseCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <ExpertiseSectionCard
                title={index === 0 ? t('expertise.pm_title') : index === 1 ? t('expertise.sd_title') : t('expertise.qa_title')}
                subtitle={index === 0 ? t('expertise.pm_subtitle') : index === 1 ? t('expertise.sd_subtitle') : t('expertise.qa_subtitle')}
                paragraph={index === 0 ? t('expertise.pm_paragraph') : index === 1 ? t('expertise.sd_paragraph') : t('expertise.qa_paragraph')}
                imageUrl={card.image}
                headerTitle={index === 0 ? t('expertise.pm_header_title') : index === 1 ? t('expertise.sd_header_title') : t('expertise.qa_header_title')}
                headerParagraph={index === 0 ? t('expertise.pm_header_paragraph') : index === 1 ? t('expertise.sd_header_paragraph') : t('expertise.qa_header_paragraph')}
                expertiseData={{ images: card.expertiseData }}
                child={card.child}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
