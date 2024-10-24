import { ExpertiseSectionCard } from '@components/common/cards/ExpertiseSectionCard';
import { expertiseCards } from '@mocks/HomeMocks';

export default function ExpertiseSection() {
  return (
    <section className="flex flex-wrap px-36 pb-16 pt-36">
      <div className="w-1/2 flex items-end">
        <h2 className="font-dm-sans text-[6rem] font-bold leading-tight text-[var(--black)] hover:cursor-default">
          My expertise
        </h2>
      </div>

      <div className="w-1/2 flex flex-col gap-8">
        {expertiseCards.map((card, index) => (
          <ExpertiseSectionCard
            key={index}
            title={card.title}
            subtitle={card.subtitle}
            paragraph={card.paragraph}
            imageUrl={card.image}
          />
        ))}
      </div>
    </section>
  );
}
