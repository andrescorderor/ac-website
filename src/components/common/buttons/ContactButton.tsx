import { useState } from 'react';
import { DynamicButton } from './DynamicButton';
import ContactModal from '../modals/ContactModal';
import { FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export function ContactButton() {
  const { t } = useTranslation();
  const [, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsExpanded(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="font-syne flex items-center gap-4 font-bold text-[var(--dark-gray)]">
        {t('footer.contact_button')}
        <DynamicButton
          style="WHITE"
          name="Become a client"
          icon={FaArrowRight}
          type="icon-only"
          onClick={handleClick}
        />
      </div>
      <ContactModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}
