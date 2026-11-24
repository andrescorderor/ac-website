/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable react/no-array-index-key */
import { useState, useEffect } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

import CertificationsSectionCard from '@components/common/cards/CertificationsSectionCard';
import { certificationsSectionMocks } from '@mocks/CertificationsSectionMocks';
import { DynamicButton } from '@components/common/buttons/DynamicButton';
import { GrLinkNext, GrLinkPrevious } from 'react-icons/gr';
import { useTranslation } from 'react-i18next';
import { loadPortfolioCms, CmsCertification } from '@/lib/portfolioCms';

export default function CertificationsSection() {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cmsCerts, setCmsCerts] = useState<CmsCertification[] | null>(null);

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      if (source !== 'default' && Array.isArray(data.certifications) && data.certifications.length > 0) {
        setCmsCerts(data.certifications.filter((c) => c.visible !== false));
      }
    });
  }, []);

  const displayedCertifications = cmsCerts
    ? cmsCerts.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        link: c.link,
        alt: `Andrés Cordero | ${c.title}`,
      }))
    : certificationsSectionMocks.map((cert) => ({
        id: cert.id,
        title: t(`certifications_data.${cert.id}_title`),
        subtitle: t(`certifications_data.${cert.id}_subtitle`),
        alt: cert.alt,
        link: cert.link,
      }));

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

  useEffect(() => {
    instanceRef.current?.update();
  }, [displayedCertifications.length]);

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
    <section className="relative w-full py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-6 md:px-12 lg:px-20 mb-10 sm:mb-12">
        <span className="font-syne text-[var(--vibrant-sky-blue)] font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
          {i18n.language?.startsWith('es') ? 'CREDENCIALES' : 'CREDENTIALS'}
        </span>
        <h2 className="font-dm-sans text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-[var(--black)]">
          {t('certifications.title')}
        </h2>
        <div className="h-1.5 w-20 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] rounded-full mt-6" />
      </div>
      <div ref={sliderRef} className="keen-slider">
        {displayedCertifications.map((cert, index) => (
          <div key={cert.id || index} className="keen-slider__slide">
            <CertificationsSectionCard
              id={cert.id}
              title={cert.title}
              subtitle={cert.subtitle}
              alt={cert.alt}
              link={cert.link}
            />
          </div>
        ))}
      </div>
      {/* Controles visibles en móvil (con indicador de posición) */}
      <div className="md:hidden mt-8 flex items-center justify-center gap-4">
        <DynamicButton
          style="BLACK"
          type="icon-only"
          name="Anterior"
          onClick={handlePrevClick}
          icon={GrLinkPrevious}
        />
        <span
          aria-live="polite"
          className="font-syne text-xs font-bold tracking-widest text-[var(--dark-gray)]"
        >
          {Math.min(currentSlide + 1, displayedCertifications.length)} / {displayedCertifications.length}
        </span>
        <DynamicButton
          style="BLACK"
          type="icon-only"
          name="Siguiente"
          onClick={handleNextClick}
          icon={GrLinkNext}
        />
      </div>
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 hidden md:block">
        <DynamicButton
          style="BLACK"
          type="icon-only"
          name="Anterior"
          onClick={handlePrevClick}
          icon={GrLinkPrevious}
        />
      </div>
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden md:block">
        <DynamicButton
          style="BLACK"
          type="icon-only"
          name="Siguiente"
          onClick={handleNextClick}
          icon={GrLinkNext}
        />
      </div>
    </section>
  );
}
