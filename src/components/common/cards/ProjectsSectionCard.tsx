/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

import { Button } from '../Button';

interface ProjectsSectionCardProps {
  image: string;
  alt: string;
  link: string;
  title: string;
}

export default function ProjectsSectionCard({
  image,
  link,
  alt,
  title,
}: ProjectsSectionCardProps) {
  const handleOpenLink = () => {
    window.open(link, '_blank');
  };

  return (
    <div
      className="bg-cover bg-center p-24 "
      style={{ backgroundImage: `url(${image})`, height: '100vh' }}
      aria-label={alt}
    >
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--black)] to-transparent p-24">
        <h3 className="font-dm-sans  w-1/2 pb-8 text-[4rem] font-bold leading-tight text-[var(--white)]">
          {title}
        </h3>

        <Button
          style="WHITE"
          type="full-static"
          icon={FaExternalLinkSquareAlt}
          name="View Certification"
          onClick={handleOpenLink}
        />
      </div>
    </div>
  );
}
