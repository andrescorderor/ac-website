import { useState, useEffect } from 'react';

import ModalContact from '@components/common/modals/Modal';

export default function DiscussionCarousel() {
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
        <h3 className="w-full text-[7vw]">Let&apos;s discuss your project</h3>
      </div>
      <ModalContact
        title="Let't talk"
        isOpen={isModalOpen}
        onClose={closeModal}
        paragraph="Test"
      >
        Test
      </ModalContact>
    </section>
  );
}
