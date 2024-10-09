import { useState, useRef, useEffect } from 'react';

import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  subtitle: string;
  paragraph?: string;
  imageUrl: string;
  buttonColor: string;
}

function Title({ title }: { title: string }) {
  return (
    <h3 className="font-syne mb-2 text-sm font-semibold tracking-widest text-[var(--black)] hover:cursor-default">
      {title}
    </h3>
  );
}

function Subtitle({ subtitle }: { subtitle: string }) {
  return (
    <p className="font-dm-sans max-w-xl text-2xl font-semibold leading-tight text-[var(--black)] hover:cursor-default">
      {subtitle}
    </p>
  );
}

function Paragraph({ paragraph }: { paragraph: string }) {
  return (
    <p className="font-inter pt-8 font-extralight text-[var(--black)] hover:cursor-default">
      {paragraph}
    </p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <img
      src={imageUrl}
      alt={title}
      className="mt-16 h-44 transition-transform duration-500 group-hover:scale-150"
    />
  );
}

export function ExpertiseSectionCard({
  title,
  subtitle,
  paragraph = '',
  imageUrl,
  buttonColor,
}: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState('0px');

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(`${contentRef.current.scrollHeight + 80}px`);
    }
  }, [isExpanded]);

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="group relative flex w-full overflow-hidden rounded-2xl bg-[var(--soft-light-gray)] transition-all duration-500 ease-in-out"
      style={{
        height: isExpanded ? contentHeight : '140px',
      }}
    >
      <div className="flex w-full">
        <div className="w-2/6 flex-1 p-6">
          <Title title={title} />
          <Subtitle subtitle={subtitle} />
          <div className=" opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <Paragraph paragraph={paragraph} />
          </div>
        </div>

        <div className="w-3/6 flex-1">
          <div
            ref={contentRef}
            className="flex flex-col items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          >
            <Image imageUrl={imageUrl} title={title} />
          </div>

          <div
            className={`absolute flex size-12 items-center justify-center rounded-full ${buttonColor} text-[var(--white)] transition-transform duration-500`}
            style={{
              transform: isExpanded ? 'translate(0, 0)' : 'translate(0, -60px)',
              bottom: '1rem',
              right: '1rem',
            }}
          >
            <FaPlus />
          </div>
        </div>
      </div>
    </div>
  );
}

ExpertiseSectionCard.defaultProps = {
  paragraph: '',
};
