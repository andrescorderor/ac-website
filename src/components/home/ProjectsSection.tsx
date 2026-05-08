/* eslint-disable react/button-has-type */
/* eslint-disable react/no-array-index-key */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable import/no-extraneous-dependencies */
import { useState } from 'react';

import ProjectsSectionCard from '@components/common/cards/ProjectsSectionCard';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { projectsSectionMocks } from '@mocks/ProjectsSectionMocks';

export default function ProjectsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    mode: 'free',
    slides: {
      perView: 2,
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
        <div className="bg-gradient-to-l from-[var(--black)] to-transparent text-[var(--white)] ">
          <div className="flex flex-col lg:flex-row bg-gradient-to-r from-[var(--black)]  to-transparent p-6 md:p-12 lg:p-16 lg:px-36 gap-6 lg:gap-0">
            <h2 className="font-dm-sans flex flex-col justify-end text-5xl sm:text-7xl lg:text-[6rem] font-light tracking-tight leading-tight hover:cursor-default">
              My portfolio
            </h2>
            <p className="font-dm-sans lg:ml-auto flex w-full lg:w-1/4 flex-col justify-center gap-4 lg:gap-8 text-start text-lg lg:text-xl font-light tracking-wide text-[var(--light-gray)]">
              Take a look at my portfolio
            </p>
          </div>
        </div>
      </div>
      <div ref={sliderRef} className="keen-slider">
        {projectsSectionMocks.map((projectsSectionMocks, index) => (
          <div key={index} className="keen-slider__slide">
            <ProjectsSectionCard
              title={projectsSectionMocks.title}
              image={projectsSectionMocks.image}
              link={projectsSectionMocks.link}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-4">
        {projectsSectionMocks.map((_, index2) => (
          <button
            title="ProjectsCarouselPages"
            key={index2}
            onClick={() => slider.current?.moveToIdx(index2)}
            className={`${
              currentSlide === index2
                ? 'animate-gradient-random h-3 w-12 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]'
                : 'h-3 w-3 bg-[var(--light-gray)] '
            } duration-400 rounded-full transition-all cursor-pointer hover:bg-[var(--dark-gray)]`}
          />
        ))}
      </div>
    </section>
  );
}
