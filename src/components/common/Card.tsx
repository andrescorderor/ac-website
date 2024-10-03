import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
  imageUrl: string;
  bgColorLight: string;
  bgColor: string;
  type: 'full' | 'half';
}

// Componente auxiliar para el título
const Title = ({ title }: { title: string }) => (
  <motion.h3
    className="border-2 text-sm border-[var(--soft-light-gray)] font-inter font-medium text-[var(--gray)] mb-4 bg-[var(--white)] rounded-full py-2 px-4 inline-block max-w-max"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    {title}
  </motion.h3>
);

// Componente auxiliar para el párrafo
const Paragraph = ({ text }: { text: string }) => (
  <motion.p
    className="font-manrope text-3xl  leading-normal font-black text-[var(--black)] max-w-lg"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    {text}
  </motion.p>
);

// Componente auxiliar para la imagen
const Image = ({ imageUrl, title }: { imageUrl: string; title: string }) => (
  <motion.img
    src={imageUrl}
    alt={title}
    className="m-8 h-64"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  />
);

export default function Card({
  title,
  text,
  imageUrl,
  bgColor,
  bgColorLight,
  type,
}: CardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`group relative flex ${
        type === 'full' ? 'flex-row' : 'flex-col'
      } w-full justify-between rounded-2xl p-14 transition-transform duration-500 ease-in-out ${bgColorLight} bg-opacity-25`}
    >
      <div className="flex-1">
        {/* Reutilizamos los componentes auxiliares */}
        <Title title={title} />
        <Paragraph text={text} />
      </div>

      {/* Condicionamos la estructura según el tipo */}
      {type === 'full' && (
        <div className="flex-1 flex justify-center items-center">
          <Image imageUrl={imageUrl} title={title} />
        </div>
      )}

      {type === 'half' && <Image imageUrl={imageUrl} title={title} />}

      {/* Botón siempre visible */}
      <motion.div
        className={`absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full ${bgColor} text-[var(--white)]`}
        whileHover={{ scale: 1.2 }}
      >
        <FaPlus />
      </motion.div>
    </motion.div>
  );
}
