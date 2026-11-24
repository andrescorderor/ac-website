type DynamicButtonProps = {
  icon?: React.ElementType;
  name: string;
  type: 'icon-only' | 'full-static' | 'full-dynamic' | 'text-only';
  style: 'WHITE' | 'BLACK';
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
};

export function DynamicButton({
  icon: Icon,
  name,
  type,
  style,
  onClick = () => null,
  ariaLabel,
  title,
}: DynamicButtonProps) {
  const whiteBaseClasses =
    'font-dm-sans group relative bg-[var(--white)] text-[var(--black)] border border-[var(--light-gray)] hover:border-[var(--black)] hover:bg-[var(--soft-light-gray)] flex items-center justify-center min-h-[44px] rounded-full text-sm transition-all duration-300 ease-in-out cursor-pointer shadow-xs';

  const blackBaseClasses =
    'font-dm-sans group relative bg-[var(--black)] text-[var(--white)] border border-[var(--black)] hover:bg-[var(--vibrant-sky-blue)] hover:border-[var(--vibrant-sky-blue)] hover:text-white flex items-center justify-center min-h-[44px] rounded-full text-sm transition-all duration-300 ease-in-out cursor-pointer shadow-sm hover:shadow-md';

  const baseClasses = style === 'WHITE' ? whiteBaseClasses : blackBaseClasses;

  const getButtonClasses = () => {
    switch (type) {
      case 'icon-only':
        return 'p-2 min-w-[44px]';
      case 'full-static':
        return 'px-5 py-2.5 font-medium';
      case 'full-dynamic':
        return 'hover:px-4 min-w-[44px]';
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
      return <span className="mx-2 ">{name}</span>;
    }

    if (type === 'full-dynamic') {
      return (
        <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out group-hover:ml-2 group-hover:max-w-xs">
          {name}
        </span>
      );
    }

    return null;
  };

  const computedAriaLabel =
    ariaLabel ?? (type === 'icon-only' || type === 'full-dynamic' ? name : undefined);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={computedAriaLabel}
      title={title}
      className={`${baseClasses} ${getButtonClasses()}`}
    >
      {renderIcon()}
      {renderText()}
    </button>
  );
}
