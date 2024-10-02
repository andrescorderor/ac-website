type ButtonProps = {
  icon?: React.ElementType;
  name: string;
  type: 'icon-only' | 'full-static' | 'full-dynamic' | 'text-only';
  onClick?: () => void;
};

export function Button({ icon: Icon, name, type, onClick }: ButtonProps) {
  const baseClasses =
    'font-manrope group relative flex items-center justify-center rounded-full border border-[var(--light-gray)] bg-white p-2 text-[var(--black)] transition-all duration-500 ease-in-out';

  const getButtonClasses = () => {
    switch (type) {
      case 'icon-only':
        return 'p-2';
      case 'full-static':
        return 'px-4';
      case 'full-dynamic':
        return 'hover:px-4';
      case 'text-only':
        return 'p-2';
      default:
        return '';
    }
  };

  const renderIcon = () => {
    if (
      (type === 'icon-only' ||
        type === 'full-static' ||
        type === 'full-dynamic') &&
      Icon
    ) {
      return (
        <Icon className="size-6 transition-transform duration-500 ease-in-out" />
      );
    }
    return null;
  };

  const renderText = () => {
    if (type === 'text-only' || type === 'full-static') {
      return <span className="mx-2 font-bold text-[var(--gray)]">{name}</span>;
    }

    if (type === 'full-dynamic') {
      return (
        <span className=" ml-0 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out group-hover:ml-2 group-hover:max-w-xs">
          {name}
        </span>
      );
    }

    return null;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${getButtonClasses()}`}
    >
      {renderIcon()}
      {renderText()}
    </button>
  );
}

Button.defaultProps = {
  icon: null,
  onClick: () => null,
};
