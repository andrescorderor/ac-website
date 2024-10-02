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
    <div className="font-manrope fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-clip-padding px-8 py-4  backdrop-blur-lg">
      <div className="w-32" />

      <div className="flex grow items-center justify-center gap-40">
        <a
          className={twMerge(
            location.pathname === '/about'
              ? ' text-[var(--deep-navy-blue)]  font-bold'
              : 'text-[var(--black)]',
          )}
          href="/about"
        >
          <p className="tracking-widest">ABOUT</p>
        </a>

        <a href="/">
          <img
            src="/assets/ac-website-icon.svg"
            alt="Profile"
            className="size-14"
          />
        </a>

        <a
          className={twMerge(
            location.pathname === '/contact'
              ? ' text-[var(--deep-navy-blue)]  font-bold'
              : 'text-[var(--black)]',
          )}
          href="/contact"
        >
          <p className="tracking-widest">CONTACT</p>
        </a>
      </div>

      <div className="relative flex w-32 justify-end">
        <Button
          type="text-only"
          name="Language"
          onClick={toggleLanguageOptions}
        />

        {showLanguageOptions && (
          <div className="absolute right-0 mt-2 w-32 rounded-md bg-white shadow-lg">
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
