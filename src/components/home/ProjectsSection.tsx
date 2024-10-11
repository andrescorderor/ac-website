/* eslint-disable react/button-has-type */
/* eslint-disable react/no-array-index-key */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable import/no-extraneous-dependencies */
import { useState } from 'react';

import ProjectsSectionCard from '@components/common/ProjectsSectionCard';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

export default function ProjectsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    mode: 'free-snap',
    slides: {
      perView: 1,
      spacing: 0,
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
    <section className=" w-full py-16">
      <div className="animate-gradient-random pointer-events-none bg-[var(--soft-light-gray)] bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] ">
        <div className="bg-gradient-to-l from-[var(--black)] to-transparent p-2 text-[var(--white)] ">
          <div className="flex rounded-2xl bg-gradient-to-r from-[var(--black)]  to-transparent p-16 px-36">
            <h2 className="font-dm-sans flex flex-col justify-end  text-[6rem] font-bold leading-tight hover:cursor-default">
              My portfolio
            </h2>
            <p className="font-dm-sans ml-auto flex w-1/4 flex-col justify-center gap-8 text-start text-2xl font-medium text-[var(--white)]">
              Take a look at my portfolio
            </p>
          </div>
        </div>
      </div>
      <div ref={sliderRef} className="keen-slider">
        {certificationsSectionMocks.map((certificationsSectionMock, index) => (
          <div key={index} className="keen-slider__slide">
            <ProjectsSectionCard
              title={certificationsSectionMock.title}
              image="/assets/certifications-section/Agile.jpg"
              alt={certificationsSectionMock.alt}
              link={certificationsSectionMock.link}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-4">
        {certificationsSectionMocks.map((_, index2) => (
          <button
            key={index2}
            onClick={() => slider.current?.moveToIdx(index2)}
            className={`${
              currentSlide === index2
                ? 'animate-gradient-random h-4 w-36 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]'
                : 'size-4 bg-[var(--light-gray)] '
            } duration-400 rounded-full transition-all`}
          />
        ))}
      </div>
    </section>
  );
}
