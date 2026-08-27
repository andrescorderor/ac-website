import { useRef, useState, useEffect } from 'react';
import AutoFormattedText from './AutoFormattedText';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  rows?: number;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí tu nota... Puedes usar listas, viñetas, títulos y negritas.',
  minHeight = '180px',
  label,
  required = false,
  className = '',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Adjust textarea height automatically to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value, activeTab]);

  /**
   * Inserts formatting text at the exact cursor or wraps the selection
   */
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newVal);

    // Re-position cursor inside formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + prefix.length,
        selectedText ? newCursorPos : start + prefix.length
      );
    }, 10);
  };

  /**
   * Inserts prefix on a new line or at line start
   */
  const insertLinePrefix = (prefix: string, defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    // Check if cursor is at the beginning of a line
    const isAtStartOfLine = start === 0 || currentVal[start - 1] === '\n';
    const cleanPrefix = isAtStartOfLine ? prefix : `\n${prefix}`;

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${cleanPrefix}${selectedText}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cleanPrefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  /**
   * Smart Enter Handler: continues bullet points and numbered lists automatically
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const val = textarea.value;

      // Find the start of the current line
      const lastNewLine = val.lastIndexOf('\n', cursorPos - 1);
      const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
      const currentLine = val.substring(lineStart, cursorPos);

      // 1. Bullet point continuation (• or - )
      if (/^[•\-]\s+/.test(currentLine)) {
        e.preventDefault();
        const contentAfterBullet = currentLine.replace(/^[•\-]\s+/, '').trim();

        if (!contentAfterBullet) {
          // Empty bullet -> terminate bullet list (clear line)
          const newVal = val.substring(0, lineStart) + val.substring(cursorPos);
          onChange(newVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 10);
        } else {
          // Insert new bullet on next line
          const insertText = '\n• ';
          const newVal = val.substring(0, cursorPos) + insertText + val.substring(cursorPos);
          onChange(newVal);
          setTimeout(() => {
            const nextPos = cursorPos + insertText.length;
            textarea.setSelectionRange(nextPos, nextPos);
          }, 10);
        }
        return;
      }

      // 2. Numbered list continuation (1. 2. 3.)
      const numMatch = currentLine.match(/^(\d+)[\.\)]\s+(.*)/);
      if (numMatch) {
        e.preventDefault();
        const currentNum = parseInt(numMatch[1], 10);
        const contentAfterNum = numMatch[2].trim();

        if (!contentAfterNum) {
          // Empty number item -> terminate list
          const newVal = val.substring(0, lineStart) + val.substring(cursorPos);
          onChange(newVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 10);
        } else {
          // Insert incremented number
          const nextNum = currentNum + 1;
          const insertText = `\n${nextNum}. `;
          const newVal = val.substring(0, cursorPos) + insertText + val.substring(cursorPos);
          onChange(newVal);
          setTimeout(() => {
            const nextPos = cursorPos + insertText.length;
            textarea.setSelectionRange(nextPos, nextPos);
          }, 10);
        }
        return;
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Top Bar with Label, Quick Formatting Buttons and View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
            {label} {required && '*'}
          </label>
        )}

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Quick Format Tools */}
          <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                insertLinePrefix('### ', 'Título de Sección');
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs interactive-hover"
              title="Insertar Encabezado de Sección (### Título)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold text-[11px]">H3</span>
              <span className="hidden sm:inline text-[11px]">Título</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                insertFormatting('**', '**', 'Texto en negrita');
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Insertar Negrita (**texto**)"
            >
              <strong className="text-[11px]">B</strong>
              <span className="hidden sm:inline ml-1 text-[11px]">Negrita</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                insertLinePrefix('• ', 'Elemento de lista');
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Insertar Viñeta (• item)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold text-sm leading-none">•</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Viñeta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                insertLinePrefix('1. ', 'Primer paso');
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Insertar Lista Numerada (1., 2...)"
            >
              <span className="text-[11px] font-bold">1.</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Lista</span>
            </button>
          </div>

          {/* Edit vs Preview Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Vista Previa
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview Workspace */}
      <div className="relative">
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-y shadow-xs"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="w-full px-5 py-4 bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 overflow-y-auto"
          >
            {value ? (
              <AutoFormattedText text={value} />
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                No hay contenido escrito para previsualizar.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 px-1">
        <span>Tip: Presiona <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px] border border-gray-200 dark:border-gray-700">Enter</kbd> en una viñeta para crear la siguiente automáticamente.</span>
        <span>{value ? value.length : 0} caracteres</span>
      </div>
    </div>
  );
}

