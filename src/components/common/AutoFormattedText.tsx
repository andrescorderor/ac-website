import React from 'react';
import { HiOutlineExternalLink } from 'react-icons/hi';

interface AutoFormattedTextProps {
  text: string | null | undefined;
  className?: string;
}

export default function AutoFormattedText({ text, className = '' }: AutoFormattedTextProps) {
  if (!text) return null;

  const lines = text.split('\n');
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <div className={`font-inter leading-relaxed space-y-1 break-words [overflow-wrap:anywhere] overflow-hidden ${className}`}>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;

        const parts = line.split(urlRegex);

        return (
          <div key={idx} className="break-words [overflow-wrap:anywhere]">
            {parts.map((part, i) => {
              if (urlRegex.test(part)) {
                return (
                  <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 break-all inline-flex items-center gap-1 my-0.5"
                  >
                    <span className="truncate max-w-[220px] sm:max-w-xs md:max-w-sm">{part}</span>
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
  );
}
