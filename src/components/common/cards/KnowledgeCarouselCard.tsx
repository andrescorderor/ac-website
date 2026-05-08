interface KnowledgeCarouselCardProps {
  src: string;
  alt: string;
}

export default function KnowledgeCarouselCard({
  src,
  alt,
}: KnowledgeCarouselCardProps) {
  return (
    <div>
      <img src={src} alt={alt} className="mx-8 lg:mx-32 size-24 lg:size-48 opacity-60 hover:opacity-100 transition-opacity duration-300 drop-shadow-md" />
    </div>
  );
}
