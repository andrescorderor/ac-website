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

function Title({ title }: { title: string }) {
  return (
    <motion.h3
      className="font-inter pointer-events-none mb-4 inline-block max-w-max rounded-full border-2 border-[var(--soft-light-gray)] bg-[var(--white)] px-4 py-2 text-sm font-medium text-[var(--gray)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {title}
    </motion.h3>
  );
}

function Paragraph({ text }: { text: string }) {
  return (
    <motion.p
      className="font-manrope pointer-events-none max-w-lg text-3xl font-black leading-normal text-[var(--black)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {text}
    </motion.p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <motion.img
      src={imageUrl}
      alt={title}
      className="m-8 h-64"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    />
  );
}
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
      } w-full justify-between rounded-2xl p-14 transition-transform duration-500 ease-in-out ${bgColorLight}`}
    >
      <div className="flex-1">
        <Title title={title} />
        <Paragraph text={text} />
      </div>

      {type === 'full' && (
        <div className="flex flex-1 items-center justify-center">
          <Image imageUrl={imageUrl} title={title} />
        </div>
      )}

      {type === 'half' && <Image imageUrl={imageUrl} title={title} />}

      <motion.div
        className={`absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full ${bgColor} text-[var(--white)]`}
        whileHover={{ scale: 1.2 }}
      >
        <FaPlus />
      </motion.div>
    </motion.div>
  );
}
