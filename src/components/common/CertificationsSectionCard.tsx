interface CertificationsSectionCardProps {
  image: string;
  link: string;
}

export default function CertificationsSectionCard({
  image,
  link,
}: CertificationsSectionCardProps) {
  return (
    <div
      className="relative h-64 rounded-lg overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <button
        className="absolute bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-full"
        onClick={() => window.open(link, '_blank')}
      >
        Open Link
      </button>
    </div>
  );
}
