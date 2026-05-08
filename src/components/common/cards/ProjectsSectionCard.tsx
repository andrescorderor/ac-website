/* eslint-disable tailwindcss/migration-from-tailwind-2 */
import { useState } from 'react';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';

import { DynamicButton } from '../buttons/DynamicButton';
interface ProjectsSectionCardProps {
  image: string;
  title: string;
  description: string;
  tags: string[];
}

export default function ProjectsSectionCard({
  image,
  title,
  description,
  tags,
}: ProjectsSectionCardProps) {
  const [isGrabbing, setIsGrabbing] = useState(false);

  return (
    <div
      className={`group relative bg-cover bg-center p-6 lg:p-24 overflow-hidden rounded-lg mx-2 lg:mx-0 ${
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
      <div className="absolute inset-x-0 bottom-0 p-6 lg:px-24 lg:py-12 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <h3 className="font-dm-sans w-full lg:w-3/4 text-2xl sm:text-3xl lg:text-4xl pb-2 font-medium tracking-tight leading-tight text-[var(--white)] drop-shadow-md">
          {title}
        </h3>
        
        <p className="font-inter text-sm lg:text-base text-[var(--light-gray)] font-light leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-3">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
          {tags && tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-[var(--deep-navy-blue)] text-[var(--white)] text-xs font-syne font-medium rounded-full border border-[var(--vibrant-sky-blue)]/30 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
