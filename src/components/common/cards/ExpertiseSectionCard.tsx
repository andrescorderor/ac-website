import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import ModalContact from '../modals/Modal';
import ExpertiseSectionModalContent from '../modals/ExpertiseSectionPMModalContent';
import { ExpertiseSectionImage } from '@mocks/ExpertiseSectionMocks';

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
}

function Title({ title }: { title: string }) {
  return (
    <h3 className="font-syne mb-2 text-sm font-semibold tracking-widest text-[var(--dark-gray)] hover:cursor-default">
      {title}
    </h3>
  );
}

function Subtitle({ subtitle }: { subtitle: string }) {
  return (
    <p className="font-dm-sans text-2xl font-semibold leading-tight text-[var(--black)] hover:cursor-default">
      {subtitle}
    </p>
  );
}

function Paragraph({ paragraph }: { paragraph: string }) {
  return (
    <p className="font-inter pt-8 text-justify font-extralight text-[var(--dark-gray)] hover:cursor-default">
      {paragraph}
    </p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <img
      src={imageUrl}
      alt={title}
      className="mt-16 h-44 transition-transform duration-500 group-hover:scale-125"
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
}: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [baseHeight, setBaseHeight] = useState('140px');
  const [contentHeight, setContentHeight] = useState('0px');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (subtitleRef.current) {
      const subtitleHeight = subtitleRef.current.offsetHeight;
      const calculatedBaseHeight = subtitleHeight + 80;
      setBaseHeight(`${calculatedBaseHeight}px`);
    }
  }, [subtitle]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(`${contentRef.current.scrollHeight + 80}px`);
    }
  }, [isExpanded]);

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
      className="group relative flex overflow-hidden rounded-2xl bg-[var(--soft-light-gray)] transition-all duration-500 ease-in-out"
      style={{
        height: isExpanded ? contentHeight : baseHeight,
      }}
    >
      <div className="relative flex w-full">
        <div className="flex-1 p-6">
          <Title title={title} />
          <div ref={subtitleRef}>
            <Subtitle subtitle={subtitle} />
          </div>
          <div className="opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <Paragraph paragraph={paragraph} />
          </div>
        </div>
        <div className="flex-1">
          <div
            ref={contentRef}
            className={`flex flex-col items-center justify-center transition-opacity duration-500 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image imageUrl={imageUrl} title={title} />
          </div>
        </div>
        <div
          className="absolute right-4  top-4 cursor-pointer animate-gradient-random hover:bg-[var(--soft-light-gray)] hover:border-[var(--black)] flex size-12 items-center justify-center rounded-full bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] text-[var(--white)]"
          onClick={handleClick}
        >
          <FaPlus />
        </div>
      </div>

      <ModalContact
        knowledgeSection
        title={headerTitle}
        isOpen={isModalOpen}
        onClose={closeModal}
        paragraph={headerParagraph}
        expertiseData={expertiseData}
      >
        <ExpertiseSectionModalContent />
      </ModalContact>
    </div>
  );
}

ExpertiseSectionCard.defaultProps = {
  paragraph: '',
};
