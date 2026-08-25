import { useRef, useState } from 'react';
import { HiOutlineEye, HiOutlinePencilAlt } from 'react-icons/hi';
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
  showPreviewToggle?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí... (Soporta Markdown, títulos, negritas y viñetas)',
  minHeight = '140px',
  rows = 6,
  label,
  required = false,
  className = '',
  showPreviewToggle = true,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertAtCursor = (
    formatter: (selectedText: string, beforeText: string) => { textToInsert: string; cursorOffset?: number }
  ) => {
    // If currently in preview mode, switch to write mode first
    if (activeTab === 'preview') {
      setActiveTab('write');
    }

    const el = textareaRef.current;
    const currentVal = value || '';

    if (!el) {
      const res = formatter('', currentVal);
      onChange(currentVal + res.textToInsert);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = currentVal.substring(0, start);
    const selected = currentVal.substring(start, end);
    const after = currentVal.substring(end);

    const { textToInsert, cursorOffset } = formatter(selected, before);
    const newVal = before + textToInsert + after;
    onChange(newVal);

    setTimeout(() => {
      if (el) {
        el.focus();
        const newCursorPos = cursorOffset !== undefined ? start + cursorOffset : start + textToInsert.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 15);
  };

  const insertHeading = () => {
    insertAtCursor((selected, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n\n### ' : '### ';
      const text = selected || 'Título de sección';
      return { textToInsert: `${prefix}${text}` };
    });
  };

  const insertBold = () => {
    insertAtCursor((selected) => {
      if (selected) {
        return { textToInsert: `**${selected}**` };
      }
      return { textToInsert: '**texto en negrita**', cursorOffset: 2 };
    });
  };

  const insertBullet = () => {
    insertAtCursor((_, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n• ' : '• ';
      return { textToInsert: prefix };
    });
  };

  const insertNumberList = () => {
    insertAtCursor((_, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const lines = before.split('\n');
      let nextNum = 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].trim().match(/^(\d+)[\.\)]\s+/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
          break;
        }
      }
      const prefix = needsNewline ? `\n${nextNum}. ` : `${nextNum}. `;
      return { textToInsert: prefix };
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Label and Format Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
            {label} {required && '*'}
          </label>
        )}

        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {/* Markdown Action Tools */}
          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <button
              type="button"
              onClick={insertHeading}
              className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs"
              title="Encabezado de Sección (### Título)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold text-[11px]">H3</span>
              <span className="hidden sm:inline text-[11px]">Título</span>
            </button>

            <button
              type="button"
              onClick={insertBold}
              className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs"
              title="Texto en Negrita (**texto**)"
            >
              <strong className="text-[11px]">B</strong>
              <span className="hidden sm:inline ml-1 text-[11px]">Negrita</span>
            </button>

            <button
              type="button"
              onClick={insertBullet}
              className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs"
              title="Viñeta de punto (• item)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold">•</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Viñeta</span>
            </button>

            <button
              type="button"
              onClick={insertNumberList}
              className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs"
              title="Lista numerada (1., 2., 3...)"
            >
              <span className="text-[11px]">1.</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Lista</span>
            </button>
          </div>

          {/* Mode Switcher (Write vs Live Formatted Preview) */}
          {showPreviewToggle && (
            <div className="flex items-center gap-0.5 bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-2.5 py-1 rounded-lg text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  activeTab === 'write'
                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
                title="Modo Edición"
              >
                <HiOutlinePencilAlt className="text-xs" />
                <span className="text-[10px]">Editar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-lg text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
                title="Vista previa con formato aplicado"
              >
                <HiOutlineEye className="text-xs" />
                <span className="text-[10px]">Ver Formato</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{ minHeight }}
          className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y transition-all shadow-xs"
        />
      ) : (
        <div
          style={{ minHeight }}
          onClick={() => setActiveTab('write')}
          className="w-full px-5 py-3.5 bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700 rounded-xl font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 overflow-y-auto cursor-text transition-all shadow-xs relative group"
          title="Haz clic para volver a editar"
        >
          {value ? (
            <AutoFormattedText text={value} expandable={false} />
          ) : (
            <span className="italic text-gray-400 dark:text-gray-500 select-none">
              Sin contenido para previsualizar. Haz clic para escribir...
            </span>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 dark:bg-white/80 text-white dark:text-black text-[9px] font-syne font-bold px-2 py-0.5 rounded-md pointer-events-none">
            Clic para editar
          </div>
        </div>
      )}
    </div>
  );
}
