/* eslint-disable react/button-has-type */
/* eslint-disable react/no-array-index-key */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable import/no-extraneous-dependencies */
import { useState, useEffect } from 'react';

import ProjectsSectionCard from '@components/common/cards/ProjectsSectionCard';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { projectsSectionMocks } from '@mocks/ProjectsSectionMocks';
import { useTranslation } from 'react-i18next';
import { loadPortfolioCms, CmsProject } from '@/lib/portfolioCms';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function ProjectsSection() {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cmsProjects, setCmsProjects] = useState<CmsProject[] | null>(null);

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      if (source !== 'default' && data.projects && data.projects.length > 0) {
        setCmsProjects(data.projects.filter((p) => p.visible !== false));
      }
    });
  }, []);

  const displayedProjects = cmsProjects
    ? cmsProjects.map((p) => ({
        id: p.id,
        image: p.image,
        title: p.title,
        description: p.description,
        tags: p.tags,
      }))
    : projectsSectionMocks.map((project) => ({
        id: project.id,
        image: project.image,
        title: t(`projects_data.${project.id}_title`),
        description: t(`projects_data.${project.id}_desc`),
        tags: t(`projects_data.${project.id}_tags`, { returnObjects: true }) as string[],
      }));
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
    <section id="portfolio-section" className="w-full pt-4 pb-16">
      <div className="container mx-auto max-w-7xl px-6 md:px-12 lg:px-20 pt-14 pb-10 sm:pb-12">
        <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
          {i18n.language?.startsWith('es') ? 'PORTAFOLIO' : 'PORTFOLIO'}
        </span>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="font-dm-sans text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-[var(--black)] hover:cursor-default">
            {t('portfolio.title')}
          </h2>
          <p className="font-inter w-full lg:max-w-md text-base sm:text-lg font-light leading-relaxed text-[var(--dark-gray)]">
            {t('portfolio.subtitle')}
          </p>
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full mt-6" />
      </div>
      <div ref={sliderRef} className="keen-slider">
        {displayedProjects.map((project, index) => (
          <div key={project.id || index} className="keen-slider__slide">
            <ProjectsSectionCard
              image={project.image}
              title={project.title}
              description={project.description}
              tags={project.tags}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label="Proyecto anterior"
          onClick={() => slider.current?.prev()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--dark-gray)] hover:text-[var(--black)] hover:bg-[var(--soft-light-gray)] transition-colors cursor-pointer"
        >
          <HiChevronLeft className="text-2xl" />
        </button>
        {displayedProjects.map((project, index2) => (
          <button
            type="button"
            aria-label={`Ir al proyecto ${index2 + 1}: ${project.title}`}
            aria-current={currentSlide === index2 ? 'true' : undefined}
            key={project.id || index2}
            onClick={() => slider.current?.moveToIdx(index2)}
            className="group min-h-[44px] px-1.5 flex items-center justify-center cursor-pointer"
          >
            <span
              className={`${
                currentSlide === index2
                  ? 'animate-gradient-random h-3 w-12 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]'
                  : 'h-3 w-3 bg-[var(--light-gray)] group-hover:bg-[var(--dark-gray)]'
              } block rounded-full transition-all duration-300`}
            />
          </button>
        ))}
        <button
          type="button"
          aria-label="Proyecto siguiente"
          onClick={() => slider.current?.next()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--dark-gray)] hover:text-[var(--black)] hover:bg-[var(--soft-light-gray)] transition-colors cursor-pointer"
        >
          <HiChevronRight className="text-2xl" />
        </button>
      </div>
    </section>
  );
}
