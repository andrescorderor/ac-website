/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
import { useState, useEffect, useRef } from 'react';

import { knowledgeCarouselImage } from '@mocks/KnowledgeCarousel';

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
    <div className="relative flex items-center overflow-hidden bg-black py-8">
      <h3 className="font-syne absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center text-[4rem] font-bold text-[var(--white)] ">
        Knowledge
      </h3>
      <div
        ref={carouselRef}
        className="flex"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {[...knowledgeCarouselImage, ...knowledgeCarouselImage].map(
          (image, index) => (
            <KnowledgeCarouselCard
              key={`${image.alt}-${index}`}
              alt={image.alt}
              src={image.src}
            />
          ),
        )}
      </div>
    </div>
  );
}
