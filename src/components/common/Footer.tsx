import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaFilePdf } from 'react-icons/fa';

export default function Footer() {
  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      className="mx-auto w-3/4 bg-gray-800 text-white py-8 rounded-t-3xl flex flex-col items-center" // Añadido mx-auto para centrar y rounded-t-3xl para bordes redondeados
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <img
            src="/assets/ac-website-icon.svg"
            alt="Logo"
            className="h-12 w-12 mb-2"
          />
          <p className="text-xl font-semibold text-center">
            Make it extraordinary. Make it yours.
          </p>
        </div>

        <div className="flex gap-6 mt-4">
          <a
            href="https://github.com/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500"
          >
            <FaGithub className="h-8 w-8" />
          </a>
          <a
            href="https://github.com/yoursecondprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500"
          >
            <FaGithub className="h-8 w-8" />
          </a>
          <a
            href="https://linkedin.com/in/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500"
          >
            <FaLinkedin className="h-8 w-8" />
          </a>
          <a href="/assets/your-cv.pdf" download className="text-red-500">
            <FaFilePdf className="h-8 w-8" />
          </a>
        </div>
      </div>

      <div className="mt-6 text-center text-sm">
        <p>2024 aC firm. All rights reserved</p>
      </div>
    </motion.footer>
  );
}
