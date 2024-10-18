/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
import { useState, useEffect, useRef } from 'react';

import { knowledgeCarouselImageMocks } from '@mocks/KnowledgeCarouselMocks';

import KnowledgeCarouselCard from '../common/KnowledgeCarouselCard';

export default function KnowledgeCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const totalWidth = carousel.scrollWidth / 2;
    const speed = 2;

    const animate = () => {
      setScrollPosition((prevPosition) => {
        const newPosition = prevPosition + speed;
        return newPosition >= totalWidth ? 0 : newPosition;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section className="relative flex overflow-hidden bg-[var(--white)] py-16 ">
      {/* <h3 className="font-syne absolute right-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-end text-[4rem] font-bold text-[var(--black)] ">
        Knowledge
      </h3> */}
      <div
        ref={carouselRef}
        className="flex"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {[...knowledgeCarouselImageMocks, ...knowledgeCarouselImageMocks].map(
          (image, index) => (
            <KnowledgeCarouselCard
              key={`${image.alt}-${index}`}
              alt={image.alt}
              src={image.src}
            />
          ),
        )}
      </div>
    </section>
  );
}
