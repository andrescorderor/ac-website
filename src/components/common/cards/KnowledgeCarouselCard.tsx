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
      <div className="absolute inset-0 bg-[var(--vibrant-sky-blue)] rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
      <img src={src} alt={alt} className="size-24 lg:size-40 opacity-60 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg hover:scale-110 relative z-0" />
      <span className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-syne text-[var(--white)] font-medium bg-[var(--black)]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-[var(--white)]/20 shadow-xl z-10 pointer-events-none">
        {tooltipText}
      </span>
    </div>
  );
}
