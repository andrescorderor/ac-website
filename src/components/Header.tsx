import { useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

export default function Header() {
  const location = useLocation();

  return (
    <div>
      <div className="hidden lg:block">
        <p className="font-medium">Andrés Cordero</p>
        <p className="text-sm font-medium text-[#8D8D8D]">Software Engineer</p>
      </div>

      <div className="flex h-11 w-72 items-center justify-center gap-4 rounded-full border border-gray-200 bg-white/50 bg-clip-padding backdrop-blur-lg">
        <a
          className={twMerge(
            'px-4 py-1 rounded-full font-medium',
            location.pathname === '/'
              ? 'bg-[#E4E4E4] font-bold'
              : 'text-[#8D8D8D]',
          )}
          href="/"
        >
          Home
        </a>
        <a
          className={twMerge(
            'px-4 py-1 rounded-full font-medium',
            location.pathname === '/about'
              ? 'bg-[#E4E4E4] font-bold'
              : 'text-[#8D8D8D]',
          )}
          href="/about"
        >
          About
        </a>
        <button
          className="rounded-full px-4 py-1 font-medium text-[#8D8D8D] hover:bg-[#E4E4E4]"
          type="button"
        >
          Contact
        </button>
      </div>

      <div />
    </div>
  );
}
