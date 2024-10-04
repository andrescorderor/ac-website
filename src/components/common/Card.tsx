import { useState, useRef, useEffect } from 'react';

import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
  paragraph?: string;
  imageUrl: string;
  bgColorLight: string;
  bgColor: string;
}

function Title({ title }: { title: string }) {
  return (
    <h3 className="font-syne mb-2 text-sm font-medium tracking-widest text-[var(--gray)]">
      {title}
    </h3>
  );
}

function Text({ text }: { text: string }) {
  return (
    <p className="font-dm-sans max-w-2xl text-3xl font-black leading-tight text-[var(--black)]">
      {text}
    </p>
  );
}

function Paragraph({ paragraph }: { paragraph: string }) {
  return (
    <p className="pt-8 font-extralight text-[var(--black)]">{paragraph}</p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return <img src={imageUrl} alt={title} className="h-72" />;
}

export function Card({
  title,
  text,
  paragraph = '',
  imageUrl,
  bgColor,
  bgColorLight,
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
      className={`group relative rounded-2xl p-6 transition-all duration-500 ease-in-out ${bgColorLight} overflow-hidden`}
      style={{
        height: isExpanded ? contentHeight : '150px',
      }}
    >
      <div className="flex">
        <div className="">
          <Title title={title} />
          <Text text={text} />
          <div className=" opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <Paragraph paragraph={paragraph} />
          </div>
        </div>

        <div
          ref={contentRef}
          className="flex flex-col items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        >
          <Image imageUrl={imageUrl} title={title} />
        </div>
      </div>

      <div
        className={`absolute bottom-4 right-4 flex size-8 items-center justify-center rounded-full ${bgColor} text-[var(--white)] opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      >
        <FaPlus />
      </div>
    </div>
  );
}

Card.defaultProps = {
  paragraph: '',
};
