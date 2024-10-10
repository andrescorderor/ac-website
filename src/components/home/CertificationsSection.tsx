/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable react/no-array-index-key */
import { useState } from 'react';

import CertificationsSectionCard from '@components/common/CertificationsSectionCard';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

export default function CertificationsSection() {
  const [, setCurrentSlide] = useState(0);
  const [sliderRef] = useKeenSlider({
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

  return (
    <div className="w-full py-16">
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
    </div>
  );
}
