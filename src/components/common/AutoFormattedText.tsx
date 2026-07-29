import { useState, ReactNode } from 'react';
import { HiOutlineExternalLink, HiChevronDown, HiChevronUp } from 'react-icons/hi';

interface AutoFormattedTextProps {
  text: string | null | undefined;
  className?: string;
  maxLength?: number;
  expandable?: boolean;
}

// Inline formatting helper for **bold**, `code`, and URLs
function formatInlineText(text: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={`url-${i}`}
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

    // Format **bold** and `code`
    const formattingRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    const subParts = part.split(formattingRegex);

    return (
      <span key={`text-${i}`}>
        {subParts.map((sub, j) => {
          if (sub.startsWith('**') && sub.endsWith('**') && sub.length > 4) {
            return (
              <strong key={j} className="font-bold text-gray-900 dark:text-white">
                {sub.slice(2, -2)}
              </strong>
            );
          }
          if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
            return (
              <code key={j} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                {sub.slice(1, -1)}
              </code>
            );
          }
          return sub;
        })}
      </span>
    );
  });
}

export default function AutoFormattedText({ 
  text, 
  className = '', 
  maxLength = 180, 
  expandable = true 
}: AutoFormattedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const isLongText = expandable && text.length > maxLength;
  const displayedText = (isLongText && !isExpanded) 
    ? `${text.slice(0, maxLength).trim()}...` 
    : text;

  const lines = displayedText.split('\n');

  return (
    <div className="space-y-1.5">
      <div className={`font-inter leading-relaxed space-y-1.5 [overflow-wrap:anywhere] overflow-hidden ${className}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Header 1 (# Title)
          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-dm-sans font-bold text-base text-gray-900 dark:text-white pt-1">
                {formatInlineText(trimmed.slice(2))}
              </h3>
            );
          }

          // Header 2 / 3 (## Title or ### Title)
          if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
            const content = trimmed.replace(/^#{2,3}\s+/, '');
            return (
              <h4 key={idx} className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white pt-1">
                {formatInlineText(content)}
              </h4>
            );
          }

          // Numbered list item (e.g., "1. Cocina...", "2) ...")
          const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
          if (numberedMatch) {
            const [, num, content] = numberedMatch;
            return (
              <div key={idx} className="flex items-start gap-2.5 my-1 pl-0.5">
                <span className="font-syne font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg shrink-0 mt-0.5 shadow-xs border border-gray-200/50 dark:border-gray-700/50">
                  {num}.
                </span>
                <div className="flex-1 leading-relaxed">
                  {formatInlineText(content)}
                </div>
              </div>
            );
          }

          // Bullet list item (e.g., "• item", "- item", "* item")
          const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)$/);
          if (bulletMatch) {
            const [, content] = bulletMatch;
            return (
              <div key={idx} className="flex items-start gap-2 my-1 pl-1">
                <span className="text-[var(--vibrant-sky-blue)] font-bold shrink-0 mt-0.5">•</span>
                <div className="flex-1 leading-relaxed">
                  {formatInlineText(content)}
                </div>
              </div>
            );
          }

          // Default line
          return (
            <div key={idx} className="[overflow-wrap:anywhere] leading-relaxed">
              {formatInlineText(line)}
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
