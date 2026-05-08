import ExpertiseSectionCard from '@components/common/cards/ExpertiseSectionCard';
import { expertiseCards } from '@mocks/HomeMocks';
import { useTranslation } from 'react-i18next';

export default function ExpertiseSection() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col lg:flex-row px-6 md:px-16 lg:px-36 pb-16 pt-24 lg:pt-36 gap-12 lg:gap-0">
      <div className="w-full lg:w-1/2 flex items-end">
        <h2 className="font-dm-sans text-5xl sm:text-7xl lg:text-[6rem] font-light tracking-tight leading-tight text-[var(--dark-gray)] hover:cursor-default">
          {t('expertise.title')}
        </h2>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col gap-8">
        {expertiseCards.map((card, index) => (
          <ExpertiseSectionCard
            key={index}
            title={index === 0 ? t('expertise.pm_title') : index === 1 ? t('expertise.sd_title') : t('expertise.qa_title')}
            subtitle={index === 0 ? t('expertise.pm_subtitle') : index === 1 ? t('expertise.sd_subtitle') : t('expertise.qa_subtitle')}
            paragraph={index === 0 ? t('expertise.pm_paragraph') : index === 1 ? t('expertise.sd_paragraph') : t('expertise.qa_paragraph')}
            imageUrl={card.image}
            headerTitle={index === 0 ? t('expertise.pm_header_title') : index === 1 ? t('expertise.sd_header_title') : t('expertise.qa_header_title')}
            headerParagraph={index === 0 ? t('expertise.pm_header_paragraph') : index === 1 ? t('expertise.sd_header_paragraph') : t('expertise.qa_header_paragraph')}
            expertiseData={{ images: card.expertiseData }}
            child={card.child}
          />
        ))}
      </div>
    </section>
  );
}
