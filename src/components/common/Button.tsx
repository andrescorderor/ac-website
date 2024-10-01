type ButtonProps = {
  icon: React.ElementType;
  name: string;
  url: string;
};

export function Button({ icon: Icon, name, url }: ButtonProps) {
  const onClick = () => {
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="font-manrope group relative flex items-center justify-center rounded-full border border-[var(--soft-light-gray)] bg-white p-2 text-[var(--black)] transition-all duration-500 ease-in-out hover:px-4"
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
