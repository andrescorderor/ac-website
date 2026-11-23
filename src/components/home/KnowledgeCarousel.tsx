import { knowledgeCarouselImageMocks } from '@mocks/KnowledgeCarouselMocks';

import KnowledgeCarouselCard from '../common/cards/KnowledgeCarouselCard';

/**
 * Cinta de tecnologías 100% CSS (`transform` en GPU): cero re-renders de React por frame,
 * pausa al hover/foco y se convierte en rejilla estática con `prefers-reduced-motion`.
 */
export default function KnowledgeCarousel() {
  return (
    <section
      aria-label="Tecnologías y herramientas"
      className="marquee relative flex overflow-hidden bg-[var(--deep-navy-blue-light)] pt-8 pb-16"
    >
      <div className="marquee-track">
        {knowledgeCarouselImageMocks.map((image) => (
          <KnowledgeCarouselCard key={image.alt} alt={image.alt} src={image.src} />
        ))}
        <div className="contents marquee-dup" aria-hidden="true">
          {knowledgeCarouselImageMocks.map((image) => (
            <KnowledgeCarouselCard
              key={`dup-${image.alt}`}
              alt={image.alt}
              src={image.src}
              decorative
            />
          ))}
        </div>
      </div>
    </section>
  );
}
