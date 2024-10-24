import { ExpertiseSectionCard } from '@components/common/cards/ExpertiseSectionCard';
import { expertiseCards } from '@mocks/HomeMocks';

export default function ExpertiseSection() {
  return (
    <section className="flex px-36 pb-16 pt-36">
      <h2 className="font-dm-sans flex flex-col justify-end text-[6rem] font-bold leading-tight text-[var(--black)] hover:cursor-default">
        My expertise
      </h2>

      <div className="ml-auto flex flex-col gap-8">
        <ExpertiseSectionCard
          title={expertiseCards[0].title}
          subtitle={expertiseCards[0].subtitle}
          paragraph={expertiseCards[0].paragraph}
          imageUrl={expertiseCards[0].image}
        />
        <ExpertiseSectionCard
          title={expertiseCards[1].title}
          subtitle={expertiseCards[1].subtitle}
          paragraph={expertiseCards[1].paragraph}
          imageUrl={expertiseCards[1].image}
        />
        <ExpertiseSectionCard
          title={expertiseCards[2].title}
          subtitle={expertiseCards[2].subtitle}
          paragraph={expertiseCards[2].paragraph}
          imageUrl={expertiseCards[2].image}
        />
      </div>
    </section>
  );
}
