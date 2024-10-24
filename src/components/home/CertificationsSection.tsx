/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable react/no-array-index-key */
import { useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

import CertificationsSectionCard from '@components/common/cards/CertificationsSectionCard';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { Button } from '@components/common/Button';
import { GrLinkNext, GrLinkPrevious } from 'react-icons/gr';

export default function CertificationsSection() {
  const [, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: 'free',
    slides: {
      perView: 3,
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

  const handlePrevClick = () => {
    if (instanceRef.current) {
      instanceRef.current.prev();
    }
  };

  const handleNextClick = () => {
    if (instanceRef.current) {
      instanceRef.current.next();
    }
  };

  return (
    <section className="relative w-full py-16">
      <div ref={sliderRef} className="keen-slider">
        {certificationsSectionMocks.map((certificationsSectionMock, index) => (
          <div key={index} className="keen-slider__slide">
            <CertificationsSectionCard
              title={certificationsSectionMock.title}
              subtitle={certificationsSectionMock.subtitle}
              alt={certificationsSectionMock.alt}
              link={certificationsSectionMock.link}
            />
          </div>
        ))}
      </div>
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2  ">
        <Button
          style="BLACK"
          type="icon-only"
          name="NextButton"
          onClick={handlePrevClick}
          icon={GrLinkPrevious}
        />
      </div>
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 ">
        <Button
          style="BLACK"
          type="icon-only"
          name="NextButton"
          onClick={handleNextClick}
          icon={GrLinkNext}
        />
      </div>
    </section>
  );
}
