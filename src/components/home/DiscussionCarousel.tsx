import { useState, useEffect } from 'react';

import ContactModal from '@components/common/modals/ContactModal';
import { useTranslation } from 'react-i18next';

export default function DiscussionCarousel() {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const event = new CustomEvent('discussionCarouselHover', {
      detail: { isHovered },
    });
    window.dispatchEvent(event);
  }, [isHovered]);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section className="relative w-full overflow-hidden py-16">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="w-full discussion-carousel font-syne cursor-pointer border-y-2 bg-[var(--white)] py-4 text-center font-bold text-[var(--black)]"
      >
        <h3 className="w-full text-[7vw] hover:text-[var(--vibrant-sky-blue)] transition-colors duration-300">
          {t('discussion.title')}
        </h3>
      </div>
      <ContactModal isOpen={isModalOpen} onClose={closeModal} />
    </section>
  );
}
