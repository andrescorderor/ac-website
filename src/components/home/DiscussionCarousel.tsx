/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable tailwindcss/no-custom-classname */
import { useState, useEffect } from 'react';

import Modal from '@components/common/modals/ModalContact';

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
    setIsModalOpen(false); // Cerrar el modal
  };

  return (
    <section className="relative w-full overflow-hidden py-16">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="discussion-carousel font-syne cursor-pointer border-y-2 bg-[var(--white)] py-4 text-center text-[8rem] font-bold text-[var(--black)]"
      >
        <h3 className="discussion-carousel">Let&apos;s discuss your project</h3>
      </div>
      <Modal
        title="Let't talk"
        isOpen={isModalOpen}
        onClose={closeModal}
        paragraph="Test"
      >
        Test
      </Modal>
    </section>
  );
}
