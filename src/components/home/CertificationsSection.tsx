import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import CertificationsSectionCard from '@components/common/CertificationsSectionCard';

export default function CertificationsSection() {
  const settings = {
    dots: true, // Activa los indicadores
    infinite: true,
    speed: 500, // Velocidad de la transición
    slidesToShow: 4,
    slidesToScroll: 2,
    autoplay: true, // Activar el desplazamiento automático
    autoplaySpeed: 3000, // Desplazar cada 3 segundos
    arrows: false, // Oculta las flechas de navegación
  };
  const cards = [
    {
      image: '/assets/certifications-section/Project.jpg',
      link: 'https://example1.com',
    },
    {
      image: '/assets/certifications-section/Project.jpg',
      link: 'https://example2.com',
    },
    {
      image: '/assets/certifications-section/Project.jpg',
      link: 'https://example3.com',
    },
    {
      image: '/assets/certifications-section/Project.jpg',
      link: 'https://example4.com',
    },
  ];

  return (
    <section className="px-36 py-20">
      <h2 className="font-dm-sans pb-16 text-center text-[6rem] font-bold leading-tight text-[var(--black)] hover:cursor-default">
        My Certifications
      </h2>
      <div className="w-full">
        <Slider {...settings}>
          {cards.map((card, index) => (
            <div key={index}>
              <CertificationsSectionCard image={card.image} link={card.link} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
