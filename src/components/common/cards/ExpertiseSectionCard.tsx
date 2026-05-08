import { useState, useRef, useEffect } from 'react';
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
  child,
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
      className="group relative flex overflow-hidden rounded-3xl bg-white border border-[var(--light-gray)] hover:border-[var(--black)] transition-all duration-700 ease-[0.16,1,0.3,1] shadow-sm hover:shadow-2xl"
      style={{
        height: isExpanded ? contentHeight : baseHeight,
      }}
    >
      <div className="relative flex w-full">
        <div className="flex-1 p-10">
          <Title title={title} />
          <div ref={subtitleRef}>
            <Subtitle subtitle={subtitle} />
          </div>
          <div className="opacity-0 translate-y-4 transition-all duration-700 group-hover:opacity-100 group-hover:translate-y-0">
            <Paragraph paragraph={paragraph} />
          </div>
        </div>
        <div className="flex-1 hidden md:block">
          <div
            ref={contentRef}
            className={`flex flex-col items-center justify-center transition-all duration-700 ${
              isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <Image imageUrl={imageUrl} title={title} />
          </div>
        </div>
        <div
          title="Open expertise detail modal"
          role="button"
          className="absolute right-6 top-6 cursor-pointer flex size-14 items-center justify-center rounded-full bg-[var(--black)] text-[var(--white)] overflow-hidden group/btn"
          onClick={handleClick}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
          <FaPlus className="relative z-10 text-xl group-hover/btn:rotate-90 transition-transform duration-500" />
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

