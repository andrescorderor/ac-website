interface KnowledgeCarouselCardProps {
  src: string;
  alt: string;
}

export default function KnowledgeCarouselCard({
  src,
  alt,
}: KnowledgeCarouselCardProps) {
  const tooltipText = alt.replace(' logo', '');
  return (
    <div className="group relative flex flex-col items-center justify-center mx-8 lg:mx-24">
      <img src={src} alt={alt} className="size-24 lg:size-40 opacity-60 group-hover:opacity-100 transition-all duration-300 drop-shadow-md hover:scale-110" />
      <span className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-syne text-[var(--white)] font-medium bg-[var(--deep-navy-blue)] px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-md z-10 pointer-events-none">
        {tooltipText}
      </span>
    </div>
  );
}
