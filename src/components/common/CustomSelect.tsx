import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 260; // Approx max height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: placeAbove ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        placeAbove,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mantiene visible la opción activa al navegar con teclado
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex, listId]);

  const selectedOption = options.find((opt) => opt.value === value);

  const openMenu = () => {
    if (disabled) return;
    updateCoords();
    const currentIdx = options.findIndex((opt) => opt.value === value);
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
    setIsOpen(true);
  };

  const closeMenu = (refocus = true) => {
    setIsOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const selectOption = (val: string) => {
    onChange(val);
    closeMenu();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(options.length - 1, prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[activeIndex]) selectOption(options[activeIndex].value);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between gap-2 w-full px-5 min-h-[48px] py-3 text-left bg-gray-50/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 rounded-xl cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 focus-visible:border-[var(--vibrant-sky-blue)] transition-all font-inter text-sm text-gray-900 dark:text-gray-100 shadow-xs select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 flex"
        >
          <HiChevronDown className="text-gray-400 text-base" />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: coords.placeAbove ? 8 : -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.placeAbove ? 8 : -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: coords.left,
                width: coords.width,
                top: coords.placeAbove ? 'auto' : coords.top,
                bottom: coords.placeAbove ? window.innerHeight - coords.top : 'auto',
                zIndex: 999999,
              }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden py-1"
            >
              <div
                id={listId}
                role="listbox"
                className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
              >
                {options.map((opt, idx) => {
                  const isSelected = value === opt.value;
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={opt.value}
                      id={`${listId}-opt-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectOption(opt.value)}
                      className={`px-5 min-h-[44px] py-2.5 cursor-pointer font-inter text-sm transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold'
                          : isActive
                          ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-xs">✓</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
