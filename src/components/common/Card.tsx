import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
  imageUrl: string;
  bgColorLight: string;
  bgColor: string;
}

export default function Card({
  title,
  text,
  imageUrl,
  bgColor,
  bgColorLight,
}: CardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      // eslint-disable-next-line tailwindcss/migration-from-tailwind-2
      className={`group relative flex w-full  flex-col justify-between rounded-2xl p-14 shadow-lg transition-transform duration-500 ease-in-out ${bgColorLight} bg-opacity-25`}
    >
      <motion.h3
        className="font-inter text-[var(--black)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="font-manrope text-2xl font-bold text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {text}
      </motion.p>

      <motion.img
        src={imageUrl}
        alt={title}
        className="m-8 h-64 text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        className={`absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full ${bgColor} text-white`}
        whileHover={{ scale: 1.2 }}
      >
        <FaPlus />
      </motion.div>
    </motion.div>
  );
}
