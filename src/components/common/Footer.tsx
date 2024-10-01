/* eslint-disable tailwindcss/no-custom-classname */
import { FaGithub, FaLinkedinIn, FaTelegramPlane } from 'react-icons/fa';
import { HiDocumentDownload } from 'react-icons/hi';
import { IoLogoWhatsapp, IoMdMail } from 'react-icons/io';

import { Button } from './Button';

export default function Footer() {
  return (
    <footer className="mx-auto flex w-3/4 flex-col items-center rounded-t-3xl text-black shadow-2xl backdrop-blur-lg">
      <div className="p-8">
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-t-3xl">
          <div className="circle animate-bounce-slow size-80 rounded-full bg-[var(--deep-navy-blue)] opacity-70 blur-3xl" />
          <div className="circle animate-bounce-slow size-80 rounded-full bg-[var(--vibrant-sky-blue)] opacity-70 blur-3xl" />
          <div className="circle animate-bounce-slow size-80 rounded-full bg-[var(--magenta-pink)] opacity-70 blur-3xl" />
        </div>
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/assets/ac-website-icon.svg"
              alt="Logo"
              className="size-12"
            />
            <div>
              <p className="font-manrope mb-4 text-center text-4xl font-semibold italic leading-snug">
                &quot;Make it happen. The best way to
                <br />
                predict the future is to create it.&quot;
              </p>
              <p className="text-start text-2xl">— Peter Drucker</p>
            </div>
          </div>

          <div className="flex gap-6">
            <Button
              type="full-dynamic"
              icon={FaGithub}
              name="Professional GitHub"
              url="https://github.com/andrescordero-cbqa"
            />
            <Button
              type="full-dynamic"
              icon={FaGithub}
              name="Personal GitHub"
              url="https://github.com/andrescorderor"
            />
            <Button
              type="full-dynamic"
              icon={FaLinkedinIn}
              name="LinkedIn"
              url="https://www.linkedin.com/in/andresmcorderor/"
            />
            <Button
              type="full-static"
              icon={HiDocumentDownload}
              name="Download CV"
              url="/assets/cv.pdf"
            />
            <Button
              type="full-dynamic"
              icon={IoMdMail}
              name="Email"
              url="mailto:andresmcorderor@gmail.com"
            />
            <Button
              type="full-dynamic"
              icon={IoLogoWhatsapp}
              name="WhatsApp"
              url="https://wa.me/524777037913"
            />
            <Button
              type="full-dynamic"
              icon={FaTelegramPlane}
              name="Telegram"
              url="https://wa.me/524777037913"
            />
          </div>
        </div>

        <div className="font-manrope mt-8 text-center text-sm font-bold  text-gray-500">
          <p>© 2024 Andrés Cordero. All rights reserved.</p>
        </div>
      </div>
      <div className="animate-gradient-rotate h-1 w-full bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)]" />
    </footer>
  );
}
