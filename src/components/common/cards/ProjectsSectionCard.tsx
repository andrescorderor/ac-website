/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { useState } from 'react';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

import { DynamicButton } from '../buttons/DynamicButton';
import { ProjectsSectionCardProps } from '@mocks/ProjectsSectionMocks';

interface ProjectsSectionCardImage extends ProjectsSectionCardProps {
  image: string;
}

export default function ProjectsSectionCard({
  image,
  link,
  title,
}: ProjectsSectionCardImage) {
  const [isGrabbing, setIsGrabbing] = useState(false);

  const handleOpenLink = () => {
    window.open(link, '_blank');
  };

  return (
    <div
      className={`relative bg-cover bg-center p-6 lg:p-24 overflow-hidden rounded-lg mx-2 lg:mx-0 ${
        isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: `url(${image})`,
        height: '70vh',
        minHeight: '400px',
      }}
      onMouseDown={() => setIsGrabbing(true)}
      onMouseUp={() => setIsGrabbing(false)}
      onMouseLeave={() => setIsGrabbing(false)}
    >
      <div className="absolute inset-x-0 bottom-0 p-6 lg:px-24 lg:py-12 bg-gradient-to-t from-black via-black/80 to-transparent pt-32">
        <h3 className="font-dm-sans w-full lg:w-3/4 text-2xl sm:text-3xl lg:text-5xl pb-4 lg:pb-8 font-light tracking-tight leading-tight text-[var(--white)] drop-shadow-md">
          {title}
        </h3>

        <DynamicButton
          style="WHITE"
          type="full-static"
          icon={FaExternalLinkSquareAlt}
          name="View Project"
          onClick={handleOpenLink}
        />
      </div>
    </div>
  );
}
