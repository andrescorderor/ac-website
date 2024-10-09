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
      <img src={src} alt={alt} className="mx-32 size-48" />
    </div>
  );
}
