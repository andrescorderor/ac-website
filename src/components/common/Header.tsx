import { useState } from 'react';

import { useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { Button } from './Button';

export default function Header() {
  const location = useLocation();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const toggleLanguageOptions = () => {
    setShowLanguageOptions(!showLanguageOptions);
  };

  return (
    <div className="font-manrope fixed left-0  z-50 flex w-full items-center bg-clip-padding px-8 py-4 backdrop-blur-lg">
      <div className="shrink-0">
        <a href="/">
          <img
            src="/assets/ac-website-icon.svg"
            alt="Profile"
            className="size-10"
          />
        </a>
      </div>

      <div className="flex grow justify-center gap-40">
        <a
          className={twMerge(
            location.pathname === '/'
              ? 'animate-gradient-rotate bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] bg-clip-text font-extrabold  text-transparent'
              : 'text-[var(--black)]',
          )}
          href="/"
        >
          <p className="tracking-widest">HOME</p>
        </a>

        <a
          className={twMerge(
            location.pathname === '/about'
              ? 'animate-gradient-rotate bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] bg-clip-text font-extrabold  text-transparent'
              : 'text-[var(--black)]',
          )}
          href="/about"
        >
          <p className="tracking-widest">ABOUT</p>
        </a>

        <a
          className={twMerge(
            location.pathname === '/contact'
              ? 'animate-gradient-rotate bg-gradient-to-r from-[var(--deep-navy-blue)] via-[var(--vibrant-sky-blue)] to-[var(--magenta-pink)] bg-clip-text font-extrabold  text-transparent'
              : 'text-[var(--black)]',
          )}
          href="/contact"
        >
          <p className="tracking-widest">CONTACT</p>
        </a>
      </div>
      <div className="">
        <Button
          type="text-only"
          name="Language"
          onClick={toggleLanguageOptions}
        />

        {showLanguageOptions && (
          <div className="absolute mt-2 rounded-s bg-white shadow-lg">
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Español
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Inglés
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
