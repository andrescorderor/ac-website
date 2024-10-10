/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';

import CertificationsSectionCard from '@components/common/CertificationsSectionCard';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

export default function CertificationsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    mode: 'free',
    slides: {
      perView: 4,
      spacing: 24,
    },
    breakpoints: {
      '(max-width: 1024px)': {
        slides: { perView: 2, spacing: 10 },
      },
      '(max-width: 640px)': {
        slides: { perView: 1, spacing: 5 },
      },
    },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  return (
    <div className="w-full py-16">
      <div ref={sliderRef} className="keen-slider">
        {certificationsSectionMocks.map((certificationsSectionMock, index) => (
          <div key={index} className="keen-slider__slide">
            <CertificationsSectionCard
              title={certificationsSectionMock.title}
              subtitle={certificationsSectionMock.subtitle}
              image={certificationsSectionMock.imageUrl}
              alt={certificationsSectionMock.alt}
              link={certificationsSectionMock.link}
            />
          </div>
        ))}
      </div>
      <div className="mt-16 flex justify-center space-x-2">
        {certificationsSectionMocks.map((_, index2) => (
          <button
            key={index2}
            onClick={() => slider.current?.moveToIdx(index2)}
            className={`${
              currentSlide === index2
                ? 'animate-gradient-random h-3  w-8 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]'
                : 'size-3 bg-gray-300'
            } rounded-full transition-all duration-300`}
          />
        ))}
      </div>
    </div>
  );
}
