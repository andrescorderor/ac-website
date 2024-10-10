/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

import { Button } from './Button';

interface CertificationsSectionCardProps {
  image: string;
  alt: string;
  link: string;
  title: string;
  subtitle: string;
}

export default function CertificationsSectionCard({
  image,
  link,
  alt,
  title,
  subtitle,
}: CertificationsSectionCardProps) {
  const handleOpenLink = () => {
    window.open(link, '_blank');
  };

  return (
    <div
      className="relative rounded-2xl bg-cover bg-center shadow-lg"
      style={{ backgroundImage: `url(${image})`, height: '66vh' }}
      aria-label={alt}
    >
      <div className="absolute inset-x-0 top-0 p-4">
        <p className="font-syne inline-block rounded-full bg-[var(--black)] bg-opacity-50 px-2 py-1 text-base font-semibold text-[var(--white)]">
          CERTIFICATION
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-2xl bg-gradient-to-t from-[var(--black)] to-transparent p-6 ">
        <h3 className="font-dm-sans pb-2 text-lg font-bold leading-tight text-[var(--white)]">
          {title}
        </h3>
        <p className="mb-4 text-sm text-[var(--white)]">{subtitle}</p>
        <Button
          type="full-static"
          icon={FaExternalLinkSquareAlt}
          name="View Certification"
          onClick={handleOpenLink}
        />
      </div>
    </div>
  );
}
