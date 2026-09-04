import { useRef, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineEye } from 'react-icons/hi';
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
  placeholder = 'Escribe aquí tu texto... Puedes usar listas, viñetas, títulos y negritas.',
  minHeight = '180px',
  label,
  required = false,
  className = '',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea smoothly without jumping
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const parsedMin = parseInt(minHeight, 10) || 180;
      el.style.height = `${Math.max(el.scrollHeight, parsedMin)}px`;
    }
  }, [value, minHeight]);

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
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Bar with Label and Quick Formatting Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
            {label} {required && '*'}
          </label>
        )}

        {/* Quick Format Tools */}
        <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs self-start sm:self-auto sm:ml-auto">
          <button
            type="button"
            onClick={() => insertLinePrefix('### ', 'Título de Sección')}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs interactive-hover"
            title="Insertar Encabezado de Sección (### Título)"
          >
            <span className="text-[var(--vibrant-sky-blue)] font-bold text-[11px]">H3</span>
            <span className="hidden sm:inline text-[11px]">Título</span>
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'Texto en negrita')}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Insertar Negrita (**texto**)"
          >
            <strong className="text-[11px]">B</strong>
            <span className="hidden sm:inline ml-1 text-[11px]">Negrita</span>
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix('• ', 'Elemento de lista')}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Insertar Viñeta (• item)"
          >
            <span className="text-[var(--vibrant-sky-blue)] font-bold text-sm leading-none">•</span>
            <span className="hidden sm:inline ml-1 text-[11px]">Viñeta</span>
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix('1. ', 'Primer paso')}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Insertar Lista Numerada (1., 2...)"
          >
            <span className="text-[11px] font-bold">1.</span>
            <span className="hidden sm:inline ml-1 text-[11px]">Lista</span>
          </button>
        </div>
      </div>

      {/* Simultaneous Dual-Pane Workspace: Editor & Live Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
        {/* Column 1: Textarea Editor */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <HiOutlineDocumentText className="text-xs text-[var(--vibrant-sky-blue)]" />
              Editor
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              Markdown
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full flex-1 min-h-[160px] sm:min-h-[200px] px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors resize-y shadow-2xs"
          />
        </div>

        {/* Column 2: Real-time Live Preview */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {value ? `${value.length} car.` : '0 car.'}
            </span>
          </div>

          <div
            style={{ minHeight }}
            className="w-full flex-1 min-h-[160px] sm:min-h-[200px] max-h-[320px] md:max-h-none px-4 sm:px-5 py-3.5 sm:py-4 bg-white/60 dark:bg-gray-800/40 border border-dashed border-gray-200/90 dark:border-gray-700/80 rounded-2xl font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 overflow-y-auto"
          >
            {value && value.trim().length > 0 ? (
              <AutoFormattedText text={value} expandable={false} />
            ) : (
              <div className="h-full min-h-[130px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 text-xs p-4 gap-1.5">
                <HiOutlineEye className="text-2xl text-gray-300 dark:text-gray-600" />
                <span className="font-medium text-gray-500 dark:text-gray-400">Vista previa en tiempo real</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 max-w-[220px]">
                  Escribe en el editor para ver aquí el formato de viñetas, títulos y negritas.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-gray-400 dark:text-gray-500 px-1 pt-0.5">
        <span>
          Tip: Presiona <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px] border border-gray-200 dark:border-gray-700">Enter</kbd> en una viñeta para crear la siguiente automáticamente.
        </span>
        <span className="font-mono text-[10px] text-gray-400">
          {value ? `${value.split(/\s+/).filter(Boolean).length} palabras` : '0 palabras'}
        </span>
      </div>
    </div>
  );
}
