import { useRef, useEffect, useCallback } from 'react';

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

/**
 * Converts Markdown string to clean HTML for contentEditable
 */
function markdownToHtml(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const htmlLines = lines.map((line) => {
    let text = line;

    // H3 Headers (### Title)
    if (text.startsWith('### ')) {
      const headingText = text.slice(4);
      return `<h3 class="font-dm-sans font-bold text-base sm:text-lg text-[var(--vibrant-sky-blue)] dark:text-sky-400 mt-2 mb-1">${formatInline(headingText)}</h3>`;
    }

    // Bullet points (• or - )
    if (text.startsWith('• ') || text.startsWith('- ')) {
      const bulletText = text.replace(/^[•\-]\s*/, '');
      return `<div class="flex items-start gap-2 my-0.5"><span class="text-[var(--vibrant-sky-blue)] font-bold shrink-0">•</span><span>${formatInline(bulletText)}</span></div>`;
    }

    // Numbered lists (1. 2. etc)
    const numMatch = text.match(/^(\d+)[\.\)]\s+(.*)/);
    if (numMatch) {
      return `<div class="flex items-start gap-2 my-0.5"><span class="font-dm-sans font-bold text-xs text-gray-500 shrink-0 mt-0.5">${numMatch[1]}.</span><span>${formatInline(numMatch[2])}</span></div>`;
    }

    if (!text.trim()) {
      return '<div><br></div>';
    }

    return `<div>${formatInline(text)}</div>`;
  });

  return htmlLines.join('');
}

function formatInline(text: string): string {
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950 dark:text-white">$1</strong>');
  return text;
}

/**
 * Converts contentEditable HTML back to Markdown string
 */
function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Bold tags
      if (tag === 'b' || tag === 'strong') {
        const inner = Array.from(el.childNodes).map(processNode).join('');
        return `**${inner}**`;
      }

      // H3 Headings
      if (tag === 'h3' || tag === 'h2' || tag === 'h1') {
        const inner = Array.from(el.childNodes).map(processNode).join('');
        return `### ${inner}\n`;
      }

      // Line breaks
      if (tag === 'br') {
        return '\n';
      }

      // Lists & divs
      const inner = Array.from(el.childNodes).map(processNode).join('');
      if (tag === 'div' || tag === 'p') {
        // Check if it was formatted as a bullet list
        if (el.textContent?.startsWith('• ')) {
          return `${inner}\n`;
        }
        return `${inner}\n`;
      }

      return inner;
    }

    return '';
  };

  const md = Array.from(temp.childNodes).map(processNode).join('');
  return md.replace(/\n{3,}/g, '\n\n').trimEnd();
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí tu contenido con formato en vivo...',
  minHeight = '140px',
  label,
  required = false,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef(false);

  // Sync value to contentEditable when value changes externally (e.g. initial load or reset)
  useEffect(() => {
    if (editorRef.current && !isComposingRef.current) {
      const currentMd = htmlToMarkdown(editorRef.current.innerHTML);
      if (currentMd !== value) {
        editorRef.current.innerHTML = markdownToHtml(value || '');
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isComposingRef.current = true;
    const md = htmlToMarkdown(editorRef.current.innerHTML);
    onChange(md);
    setTimeout(() => {
      isComposingRef.current = false;
    }, 50);
  }, [onChange]);

  // Execute rich text formatting directly in the DOM
  const execFormat = (command: string, formatValue: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, formatValue);
    handleInput();
  };

  const insertHeading = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Título de Sección';
    const h3 = document.createElement('h3');
    h3.className = 'font-dm-sans font-bold text-base sm:text-lg text-[var(--vibrant-sky-blue)] dark:text-sky-400 mt-2 mb-1';
    h3.textContent = selectedText;

    range.deleteContents();
    range.insertNode(h3);
    
    // Move cursor after the heading
    const newRange = document.createRange();
    newRange.setStartAfter(h3);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  const insertBold = () => {
    execFormat('bold');
  };

  const insertBullet = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Elemento de lista';
    
    const bulletContainer = document.createElement('div');
    bulletContainer.className = 'flex items-start gap-2 my-0.5';
    bulletContainer.innerHTML = `<span class="text-[var(--vibrant-sky-blue)] font-bold shrink-0">•</span><span>${selectedText}</span>`;

    range.deleteContents();
    range.insertNode(bulletContainer);

    const newRange = document.createRange();
    newRange.setStartAfter(bulletContainer);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  const insertNumberList = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Paso numerado';

    const numContainer = document.createElement('div');
    numContainer.className = 'flex items-start gap-2 my-0.5';
    numContainer.innerHTML = `<span class="font-dm-sans font-bold text-xs text-gray-500 shrink-0 mt-0.5">1.</span><span>${selectedText}</span>`;

    range.deleteContents();
    range.insertNode(numContainer);

    const newRange = document.createRange();
    newRange.setStartAfter(numContainer);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
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
          {/* Format Tools */}
          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertHeading();
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs interactive-hover"
              title="Encabezado de Sección (H3)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold text-[11px]">H3</span>
              <span className="hidden sm:inline text-[11px]">Título</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertBold();
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Texto en Negrita (Negrita en vivo)"
            >
              <strong className="text-[11px]">B</strong>
              <span className="hidden sm:inline ml-1 text-[11px]">Negrita</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertBullet();
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Viñeta con punto azul (• item)"
            >
              <span className="text-[var(--vibrant-sky-blue)] font-bold">•</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Viñeta</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertNumberList();
              }}
              className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
              title="Lista numerada (1., 2...)"
            >
              <span className="text-[11px]">1.</span>
              <span className="hidden sm:inline ml-1 text-[11px]">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Formatted ContentEditable Container */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{ minHeight }}
          className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 overflow-y-auto resize-y transition-all shadow-xs empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:dark:text-gray-500 empty:before:pointer-events-none"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}

