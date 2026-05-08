import { useState } from 'react';
import { CertificationsSectionCardProps } from '@mocks/CertificationsSectionMocks';
import { DynamicButton } from '../buttons/DynamicButton';
import { useTranslation } from 'react-i18next';
import { HiOutlineExternalLink } from 'react-icons/hi';

export default function CertificationsSectionCard({
  link,
  alt,
  title,
  subtitle,
}: CertificationsSectionCardProps) {
  const { t } = useTranslation();
  const [isGrabbing, setIsGrabbing] = useState(false);

  const handleOpenLink = () => {
    window.open(link, '_blank');
  };

  return (
    <div
      className={`relative flex h-full flex-col justify-between rounded-2xl bg-[var(--soft-light-gray)] bg-cover bg-center p-6 text-[var(--black)] ${
        isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      aria-label={alt}
      onMouseDown={() => setIsGrabbing(true)}
      onMouseUp={() => setIsGrabbing(false)}
      onMouseLeave={() => setIsGrabbing(false)}
    >
      <div className="">
        <p className="animate-gradient-random font-syne inline-block rounded-full bg-[var(--soft-light-gray)] bg-opacity-50 bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] p-1 px-4 text-base font-semibold text-[var(--white)]">
          {t('certifications.title').toUpperCase()}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 mt-6">
        <div className="w-full xl:w-3/4">
          <h3 className="font-dm-sans pb-2 text-lg font-bold leading-tight">
            {title}
          </h3>
          <p className="text-sm">{subtitle}</p>
        </div>
        <div className="flex w-full xl:w-1/2 flex-col items-start xl:items-end justify-end">
          <DynamicButton
            style="WHITE"
            type="full-dynamic"
            icon={HiOutlineExternalLink}
            name={t('certifications.view')}
            onClick={handleOpenLink}
          />
        </div>
      </div>
    </div>
  );
}
