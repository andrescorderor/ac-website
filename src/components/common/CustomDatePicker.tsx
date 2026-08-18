import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';

interface CustomDatePickerProps {
  value: string; // Format 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha...",
  className = "",
  required = false,
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initial calendar view date based on value or today
  const getInitialDate = () => {
    if (value && value.includes('-')) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(getInitialDate);

  // Sync viewDate when opening or when value changes
  useEffect(() => {
    if (value) {
      setViewDate(getInitialDate());
    }
  }, [value]);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pickerHeight = 360; // Estimated height of calendar popup
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < pickerHeight && rect.top > pickerHeight;

      setCoords({
        top: placeAbove ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 290), // At least 290px for comfortable calendar grid
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (val: string) => {
    if (!val) return '';
    try {
      const [y, m, d] = val.split('-').map(Number);
      if (!y || !m || !d) return val;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewDate(today);
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedParts = value ? value.split('-').map(Number) : [];
  const isDaySelected = (day: number) => {
    return selectedParts[0] === year && selectedParts[1] === month + 1 && selectedParts[2] === day;
  };

  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center justify-between w-full px-5 py-3.5 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 rounded-xl cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-all font-inter text-sm text-gray-900 dark:text-gray-100 shadow-xs select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <HiOutlineCalendar className="text-gray-400 dark:text-gray-500 shrink-0 text-base" />
          <span className={value ? "font-medium" : "text-gray-400 dark:text-gray-500"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !required && !disabled && (
            <button
              type="button"
              onClick={clearDate}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
              title="Borrar fecha"
            >
              <HiX className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: coords.placeAbove ? 8 : -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.placeAbove ? 8 : -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: 'fixed',
                left: coords.left,
                width: coords.width,
                top: coords.placeAbove ? 'auto' : coords.top,
                bottom: coords.placeAbove ? window.innerHeight - coords.top : 'auto',
                zIndex: 999999,
              }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-3 font-inter select-none"
            >
              {/* Header: Month & Year controls */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <HiChevronLeft className="text-base" />
                </button>
                <div className="font-syne text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100">
                  {MONTH_NAMES[month]} {year}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <HiChevronRight className="text-base" />
                </button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center font-syne text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty slots for month offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Actual day numbers */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const selected = isDaySelected(dayNum);
                  const currentToday = isToday(dayNum);

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 rounded-xl text-xs font-medium transition-all flex items-center justify-center relative ${
                        selected
                          ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-md'
                          : currentToday
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {dayNum}
                      {currentToday && !selected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer quick action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-syne font-bold uppercase">
                <button
                  type="button"
                  onClick={setToday}
                  className="text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
