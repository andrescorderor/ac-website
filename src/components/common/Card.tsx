import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

interface CardProps {
  title: string;
  text: string;
}

export default function Card({ title, text }: CardProps) {
  return (
    <div className="group relative flex flex-col items-start justify-between rounded-lg bg-white p-6 shadow-xl transition-transform duration-500 ease-in-out hover:h-[350px]">
      <h3 className="font-manrope mb-4 text-xl font-semibold">{title}</h3>
      <p className="font-inter text-gray-700">{text}</p>
      <motion.div className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-[var(--deep-navy-blue)] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <FaPlus />
      </motion.div>
    </div>
  );
}
