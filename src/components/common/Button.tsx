import { twMerge } from 'tailwind-merge';

type ButtonProps = {
  icon: React.ElementType;
  name: string;
  url: string;
};

export function Button({ icon: Icon, name, url }: ButtonProps) {
  const baseClasses =
    'group relative flex justify-center items-center p-3 rounded-full transition-all duration-500 ease-in-out';
  const getButtonClasses = () =>
    'bg-white border border-[var(--gray-color)] text-[var(--black)] hover:bg-gray-100';

  const onClick = () => {
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={twMerge(baseClasses, getButtonClasses(), 'hover:px-4')}
    >
      <div className="flex items-center justify-center">
        <Icon className="size-6 transition-transform duration-500 ease-in-out" />
      </div>

      <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out group-hover:ml-2 group-hover:max-w-xs">
        {name}
      </span>
    </button>
  );
}
