import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { ExpertiseSectionImage } from '@mocks/ExpertiseSectionMocks';
import Modal from '../modals/Modal';

interface CardProps {
  title: string;
  subtitle: string;
  paragraph?: string;
  headerTitle: string;
  headerParagraph: string;
  imageUrl: string;
  expertiseData: {
    images: ExpertiseSectionImage[];
  };
  child: React.ReactNode;
}

function Title({ title }: { title: string }) {
  return (
    <h3 className="font-syne mb-2 text-xs sm:text-sm font-semibold tracking-widest text-[var(--dark-gray)] hover:cursor-default">
      {title}
    </h3>
  );
}

function Subtitle({ subtitle }: { subtitle: string }) {
  return (
    <p className="font-dm-sans text-xl sm:text-2xl font-semibold leading-tight text-[var(--black)] hover:cursor-default pr-14">
      {subtitle}
    </p>
  );
}

function Paragraph({ paragraph }: { paragraph: string }) {
  return (
    <p className="font-inter text-sm sm:text-base font-light text-[var(--dark-gray)] leading-relaxed hover:cursor-default">
      {paragraph}
    </p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <img
      src={imageUrl}
      alt={title}
      className="h-32 lg:h-40 object-contain transition-transform duration-500 group-hover:scale-110"
    />
  );
}

export default function ExpertiseSectionCard({
  title,
  subtitle,
  paragraph = '',
  imageUrl,
  headerTitle,
  headerParagraph,
  expertiseData,
  child,
}: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsExpanded(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-[var(--white)] border border-[var(--light-gray)] hover:border-[var(--black)] transition-all duration-500 ease-[0.16,1,0.3,1] shadow-sm hover:shadow-2xl p-6 sm:p-8 lg:p-10"
    >
      <div className="relative w-full">
        <Title title={title} />
        <Subtitle subtitle={subtitle} />

        <div
          title="Open expertise detail modal"
          role="button"
          tabIndex={0}
          aria-label="Open expertise detail modal"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className="absolute right-0 top-0 cursor-pointer flex size-12 sm:size-14 items-center justify-center rounded-full bg-[var(--black)] text-[var(--white)] overflow-hidden group/btn"
          onClick={handleClick}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
          <FaPlus className="relative z-10 text-lg sm:text-xl group-hover/btn:rotate-90 transition-transform duration-500" />
        </div>
      </div>

      <div
        className={`grid transition-all duration-500 ease-[0.16,1,0.3,1] ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'
        } [@media(hover:none)]:grid-rows-[1fr] [@media(hover:none)]:opacity-100 [@media(hover:none)]:mt-6 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 group-focus-within:mt-6`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 pt-1">
            <div className="flex-1">
              <Paragraph paragraph={paragraph} />
            </div>
            <div className="hidden md:flex shrink-0 items-center justify-center w-44">
              <Image imageUrl={imageUrl} title={title} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        knowledgeSection
        title={headerTitle}
        isOpen={isModalOpen}
        onClose={closeModal}
        paragraph={headerParagraph}
        expertiseData={expertiseData}
      >
        {child}
      </Modal>
    </div>
  );
}
