import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
  imageUrl: string;
}

export default function Card({ title, text, imageUrl }: CardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="group relative flex w-[600px] flex-col justify-between rounded-2xl bg-white p-6 shadow-xl transition-transform duration-100 ease-in-out"
    >
      <motion.h3
        className="font-manrope text-xl font-semibold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="font-inter hidden text-gray-700 group-hover:block"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.6 }}
      >
        {text}
      </motion.p>

      <motion.img
        src={imageUrl}
        alt={title}
        className="m-8 hidden h-64 text-gray-700 group-hover:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-[var(--deep-navy-blue)] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        whileHover={{ scale: 1.2 }}
      >
        <FaPlus />
      </motion.div>
    </motion.div>
  );
}
