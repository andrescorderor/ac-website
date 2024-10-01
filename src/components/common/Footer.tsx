import { FaGithub, FaLinkedinIn } from 'react-icons/fa';
import { HiDocumentDownload } from 'react-icons/hi';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';

import { Button } from './Button';

export default function Footer() {
  return (
    <footer className="mx-auto flex w-3/4 flex-col items-center rounded-t-3xl bg-gray-800 pt-8 text-white shadow-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <img
            src="/assets/ac-website-icon.svg"
            alt="Logo"
            className="mb-2 size-12"
          />
          <p className="text-center text-xl font-semibold">
            &quot;Make it happen. The best way to predict the future is to
            create it.&quot; — Peter Drucker
          </p>
        </div>

        <div className="mt-4 flex gap-6">
          <Button
            icon={FaGithub}
            name="Professional GitHub"
            url="https://github.com/andrescordero-cbqa"
          />
          <Button
            icon={FaGithub}
            name="Personal GitHub"
            url="https://github.com/andrescorderor"
          />
          <Button
            icon={FaLinkedinIn}
            name="LinkedIn"
            url="https://www.linkedin.com/in/andresmcorderor/"
          />
          <Button
            icon={HiDocumentDownload}
            name="Download CV"
            url="/assets/cv.pdf"
          />
          <Button
            icon={IoMdMail}
            name="Email"
            url="mailto:andresmcorderor@gmail.com"
          />
          <Button
            icon={IoLogoWhatsapp}
            name="WhatsApp"
            url="https://wa.me/524777037913"
          />
        </div>
      </div>

      <div className="mt-6 pb-8 text-center text-sm">
        <p>2024 Andrés Cordero. All rights reserved</p>
      </div>

      <div className="animate-gradient-rotate h-1 w-full bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]" />
    </footer>
  );
}
