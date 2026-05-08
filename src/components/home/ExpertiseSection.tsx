import ExpertiseSectionCard from '@components/common/cards/ExpertiseSectionCard';
import { expertiseCards } from '@mocks/HomeMocks';

export default function ExpertiseSection() {
  return (
    <section className="flex flex-col lg:flex-row px-6 md:px-16 lg:px-36 pb-16 pt-24 lg:pt-36 gap-12 lg:gap-0">
      <div className="w-full lg:w-1/2 flex items-end">
        <h2 className="font-dm-sans text-5xl sm:text-7xl lg:text-[6rem] font-light tracking-tight leading-tight text-[var(--dark-gray)] hover:cursor-default">
          My expertise
        </h2>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col gap-8">
        {expertiseCards.map((card, index) => (
          <ExpertiseSectionCard
            key={index}
            title={card.title}
            subtitle={card.subtitle}
            paragraph={card.paragraph}
            imageUrl={card.image}
            headerTitle={card.headerTitle}
            headerParagraph={card.headerParagraph}
            expertiseData={{ images: card.expertiseData }}
            child={card.child}
          />
        ))}
      </div>
    </section>
  );
}
