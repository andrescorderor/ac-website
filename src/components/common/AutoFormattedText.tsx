import { useState } from 'react';
import { HiOutlineExternalLink, HiChevronDown, HiChevronUp } from 'react-icons/hi';

interface AutoFormattedTextProps {
  text: string | null | undefined;
  className?: string;
  maxLength?: number;
  expandable?: boolean;
}

export default function AutoFormattedText({ 
  text, 
  className = '', 
  maxLength = 160, 
  expandable = true 
}: AutoFormattedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const isLongText = expandable && text.length > maxLength;
  const displayedText = (isLongText && !isExpanded) 
    ? `${text.slice(0, maxLength).trim()}...` 
    : text;

  const lines = displayedText.split('\n');
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <div className="space-y-1.5">
      <div className={`font-inter leading-relaxed space-y-1 [overflow-wrap:anywhere] overflow-hidden ${className}`}>
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          const parts = line.split(urlRegex);

          return (
            <div key={idx} className="[overflow-wrap:anywhere]">
              {parts.map((part, i) => {
                if (urlRegex.test(part)) {
                  return (
                    <a
                      key={i}
                      href={part}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 break-all inline-flex items-center gap-1 my-0.5"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-xs">{part}</span>
                      <HiOutlineExternalLink className="text-xs shrink-0" />
                    </a>
                  );
                }
                return part;
              })}
            </div>
          );
        })}
      </div>

      {isLongText && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="inline-flex items-center gap-1 font-syne text-[11px] font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)] dark:text-sky-400 hover:underline pt-0.5 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Ver menos</span>
              <HiChevronUp className="text-sm" />
            </>
          ) : (
            <>
              <span>Ver más</span>
              <HiChevronDown className="text-sm" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
