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
      className={`group relative overflow-hidden rounded-3xl mx-2 lg:mx-0 shadow-2xl transition-all duration-700 ease-in-out ${
        isGrabbing ? 'cursor-grabbing scale-[0.98]' : 'cursor-grab hover:scale-[1.02]'
      }`}
      style={{
        height: '75vh',
        minHeight: '500px',
      }}
      onMouseDown={() => setIsGrabbing(true)}
      onMouseUp={() => setIsGrabbing(false)}
      onMouseLeave={() => setIsGrabbing(false)}
    >
      {/* Background Image with Zoom Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-in-out group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

      {/* Content Container with Glassmorphism */}
      <div className="absolute inset-x-6 bottom-6 lg:inset-x-12 lg:bottom-12 p-8 lg:p-12 rounded-3xl dark-glass translate-y-4 group-hover:translate-y-0 transition-all duration-700 ease-out">
        <h3 className="font-dm-sans w-full text-3xl lg:text-5xl pb-4 font-bold tracking-tight leading-tight text-[var(--white)]">
          {title}
        </h3>
        
        <p className="font-inter text-base lg:text-lg text-[var(--light-gray)] font-light leading-relaxed mb-8 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 line-clamp-3">
          {description}
        </p>

        <div className="flex flex-wrap gap-3 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
          {tags && tags.map((tag, i) => (
            <span key={i} className="px-4 py-1.5 bg-[var(--vibrant-sky-blue)]/20 text-[var(--vibrant-sky-blue)] text-xs font-syne font-bold uppercase tracking-widest rounded-full border border-[var(--vibrant-sky-blue)]/30 backdrop-blur-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
