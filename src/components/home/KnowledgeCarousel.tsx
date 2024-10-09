/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
import { useState, useEffect, useRef } from 'react';

import {
  knowledgeCarouselImage1,
  knowledgeCarouselImage2,
} from '@mocks/KnowledgeCarousel';

import KnowledgeCarouselCard from './KnowledgeCarouselCard';

export default function KnowledgeCarousel() {
  const [scrollPosition1, setScrollPosition1] = useState(0);
  const [scrollPosition2, setScrollPosition2] = useState(0);
  const carousel1Ref = useRef<HTMLDivElement>(null);
  const carousel2Ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const carousel1 = carousel1Ref.current;
    const carousel2 = carousel2Ref.current;
    if (!carousel1 || !carousel2) return;

    const totalWidth1 = carousel1.scrollWidth / 2;
    const totalWidth2 = carousel2.scrollWidth / 2;
    const speed = 0.5;

    const animate = () => {
      setScrollPosition1((prevPosition) => {
        const newPosition = prevPosition + speed;
        return newPosition >= totalWidth1 ? 0 : newPosition;
      });

      setScrollPosition2((prevPosition) => {
        const newPosition = prevPosition + speed;
        return newPosition >= totalWidth2 ? 0 : newPosition;
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
    <div className="relative overflow-hidden p-36">
      <div
        ref={carousel1Ref}
        className="flex"
        style={{ transform: `translateX(-${scrollPosition1}px)` }}
      >
        {[...knowledgeCarouselImage1, ...knowledgeCarouselImage1].map(
          (image, index) => (
            <KnowledgeCarouselCard
              key={`${image.alt}-${index}`}
              alt={image.alt}
              src={image.src}
            />
          ),
        )}
      </div>
      <h3 className="font-syne py-16 text-center text-[4rem] font-bold text-black mix-blend-multiply">
        Knowledge
      </h3>
      <div
        ref={carousel2Ref}
        className="flex"
        style={{ transform: `translateX(-${scrollPosition2}px)` }}
      >
        {[...knowledgeCarouselImage2, ...knowledgeCarouselImage2].map(
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
