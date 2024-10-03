import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
  paragraph?: string;
  imageUrl: string;
  bgColorLight: string;
  bgColor: string;
  type: 'full' | 'half';
}

function Title({ title }: { title: string }) {
  return (
    <motion.h3
      className="font-inter pointer-events-none text-sm tracking-widest text-[var(--gray)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {title}
    </motion.h3>
  );
}

function Text({ text }: { text: string }) {
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

function Paragraph({ paragraph }: { paragraph: string }) {
  return (
    <motion.p
      className="pt-8 text-[var(--gray)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {paragraph}
    </motion.p>
  );
}

function Image({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <motion.img
      src={imageUrl}
      alt={title}
      className="h-72 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    />
  );
}

export function Card({
  title,
  text,
  paragraph = '',
  imageUrl,
  bgColor,
  bgColorLight,
  type,
}: CardProps) {
  const isFullType = type === 'full';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`group relative flex ${
        isFullType ? 'flex-row' : 'flex-col'
      } w-full justify-between rounded-2xl p-7 transition-transform duration-500 ease-in-out ${bgColorLight}`}
    >
      <div className="flex-1 gap-8 p-7">
        <Title title={title} />
        <Text text={text} />
        {isFullType && <Paragraph paragraph={paragraph} />}
      </div>

      <div
        className={`flex ${
          isFullType ? 'flex-1 items-center justify-center' : ''
        }`}
      >
        <Image imageUrl={imageUrl} title={title} />
      </div>

      <motion.div
        className={`absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full ${bgColor} text-[var(--white)]`}
        whileHover={{ scale: 1.2 }}
      >
        <FaPlus />
      </motion.div>
    </motion.div>
  );
}

Card.defaultProps = {
  paragraph: '',
};
