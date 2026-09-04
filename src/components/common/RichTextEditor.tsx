import { useRef, useEffect, useCallback, useState } from 'react';

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
 * Converts Markdown string to clean semantic HTML for in-place live WYSIWYG editing
 */
function markdownToHtml(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      result.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      result.push('</ol>');
      inOl = false;
    }
  };

  const formatInline = (text: string) => {
    // Escape HTML special characters
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // **bold** -> <strong>bold</strong>
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return escaped;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeLists();
      result.push('<p><br></p>');
      continue;
    }

    // Heading (### Heading or ## or #)
    if (/^#{1,3}\s+/.test(trimmed)) {
      closeLists();
      const headingContent = trimmed.replace(/^#{1,3}\s+/, '');
      result.push(`<h3>${formatInline(headingContent)}</h3>`);
      continue;
    }

    // Bullet item (• item, - item, * item)
    if (/^[•\-\*]\s+/.test(trimmed)) {
      if (inOl) closeLists();
      if (!inUl) {
        result.push('<ul>');
        inUl = true;
      }
      const itemContent = trimmed.replace(/^[•\-\*]\s+/, '');
      result.push(`<li>${formatInline(itemContent)}</li>`);
      continue;
    }

    // Numbered item (1. item, 2. item, 1) item)
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
    if (numMatch) {
      if (inUl) closeLists();
      if (!inOl) {
        result.push('<ol>');
        inOl = true;
      }
      result.push(`<li>${formatInline(numMatch[2])}</li>`);
      continue;
    }

    // Normal paragraph
    closeLists();
    result.push(`<p>${formatInline(trimmed)}</p>`);
  }

  closeLists();
  return result.join('');
}

/**
 * Converts semantic HTML from contentEditable back into clean Markdown string
 */
function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const processNode = (node: Node): string => {
    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Recurse children
      const childText = Array.from(el.childNodes).map(processNode).join('');

      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const text = childText.trim();
        return text ? `\n### ${text}\n` : '';
      }

      if (tag === 'strong' || tag === 'b') {
        const text = childText.trim();
        return text ? `**${text}**` : '';
      }

      if (tag === 'ul') {
        return `\n${childText}\n`;
      }

      if (tag === 'ol') {
        return `\n${childText}\n`;
      }

      if (tag === 'li') {
        const text = childText.trim();
        if (!text) return '';
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const siblings = Array.from(el.parentElement?.children || []).filter(c => c.tagName.toLowerCase() === 'li');
          const index = siblings.indexOf(el) + 1;
          return `${index}. ${text}\n`;
        }
        return `• ${text}\n`;
      }

      if (tag === 'p' || tag === 'div') {
        const text = childText.trim();
        return text ? `${text}\n` : '\n';
      }

      if (tag === 'br') {
        return '\n';
      }

      return childText;
    }

    return '';
  };

  const md = Array.from(temp.childNodes).map(processNode).join('');
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí tu descripción... Puedes usar listas, viñetas, títulos y negritas en vivo.',
  minHeight = '180px',
  label,
  required = false,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastMdRef = useRef<string>(value || '');
  const [isEmpty, setIsEmpty] = useState<boolean>(!value || !value.trim());

  // Initialize and synchronize content when value changes externally
  useEffect(() => {
    // Only update innerHTML if value changed externally (e.g. modal open, form reset)
    if (value !== lastMdRef.current) {
      lastMdRef.current = value || '';
      if (editorRef.current) {
        editorRef.current.innerHTML = markdownToHtml(value || '');
        const text = editorRef.current.textContent || '';
        setIsEmpty(!text.trim());
      }
    }
  }, [value]);

  // Initial load
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value || '');
      const text = editorRef.current.textContent || '';
      setIsEmpty(!text.trim());
    }
    // Ensure default paragraph separator is standard paragraph
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      // Ignore if not supported in test environments
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const text = editorRef.current.textContent || '';
    setIsEmpty(!text.trim());

    const md = htmlToMarkdown(currentHtml);
    lastMdRef.current = md;
    onChange(md);
  }, [onChange]);

  // Format actions preserving selection
  const executeFormat = (action: () => void) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    action();
    handleInput();
  };

  const toggleHeading = () => {
    executeFormat(() => {
      document.execCommand('formatBlock', false, '<h3>');
    });
  };

  const toggleBold = () => {
    executeFormat(() => {
      document.execCommand('bold');
    });
  };

  const toggleBulletList = () => {
    executeFormat(() => {
      document.execCommand('insertUnorderedList');
    });
  };

  const toggleOrderedList = () => {
    executeFormat(() => {
      document.execCommand('insertOrderedList');
    });
  };

  /**
   * Smart key listener for Markdown shortcuts right inside the same field
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (!selection || !selection.isCollapsed) return;

      const node = selection.anchorNode;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      const textBeforeCursor = node.textContent?.slice(0, selection.anchorOffset) || '';

      // Heading shortcut (### + space)
      if (textBeforeCursor === '###' || textBeforeCursor === '##' || textBeforeCursor === '#') {
        e.preventDefault();
        node.textContent = node.textContent?.slice(selection.anchorOffset) || '';
        document.execCommand('formatBlock', false, '<h3>');
        handleInput();
        return;
      }

      // Bullet shortcut (- + space, * + space, • + space)
      if (textBeforeCursor === '-' || textBeforeCursor === '*' || textBeforeCursor === '•') {
        e.preventDefault();
        node.textContent = node.textContent?.slice(selection.anchorOffset) || '';
        document.execCommand('insertUnorderedList');
        handleInput();
        return;
      }

      // Numbered list shortcut (1. + space)
      if (/^1[\.\)]$/.test(textBeforeCursor)) {
        e.preventDefault();
        node.textContent = node.textContent?.slice(selection.anchorOffset) || '';
        document.execCommand('insertOrderedList');
        handleInput();
        return;
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Label and In-Place Formatting Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
            {label} {required && '*'}
          </label>
        )}

        {/* In-Place WYSIWYG Toolbar */}
        <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs self-start sm:self-auto sm:ml-auto">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading();
            }}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs interactive-hover"
            title="Convertir a Encabezado (H3)"
          >
            <span className="text-[var(--vibrant-sky-blue)] font-bold text-[11px]">H3</span>
            <span className="hidden sm:inline text-[11px]">Título</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBold();
            }}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Formato Negrita"
          >
            <strong className="text-[11px]">B</strong>
            <span className="hidden sm:inline ml-1 text-[11px]">Negrita</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBulletList();
            }}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Lista con Viñetas"
          >
            <span className="text-[var(--vibrant-sky-blue)] font-bold text-sm leading-none">•</span>
            <span className="hidden sm:inline ml-1 text-[11px]">Viñeta</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleOrderedList();
            }}
            className="px-2.5 py-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 shadow-2xs interactive-hover"
            title="Lista Numerada"
          >
            <span className="text-[11px] font-bold">1.</span>
            <span className="hidden sm:inline ml-1 text-[11px]">Lista</span>
          </button>
        </div>
      </div>

      {/* SINGLE UNIFIED FIELD: Live In-Place Editing and Formatted Preview */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-4 left-5 right-5 pointer-events-none text-gray-400 dark:text-gray-500 font-inter text-sm select-none leading-relaxed">
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          className="w-full px-5 py-4 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] dark:focus:border-[var(--vibrant-sky-blue)] font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 overflow-y-auto resize-y transition-colors shadow-2xs
          [&_h3]:font-dm-sans [&_h3]:font-bold [&_h3]:text-base [&_h3]:text-[var(--vibrant-sky-blue)] dark:[&_h3]:text-sky-400 [&_h3]:mt-2 [&_h3]:mb-1
          [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white
          [&_b]:font-bold [&_b]:text-gray-900 dark:[&_b]:text-white
          [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-1.5
          [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-1.5
          [&_li]:leading-relaxed [&_li]:text-gray-800 dark:[&_li]:text-gray-200
          [&_p]:my-1 [&_p]:leading-relaxed"
        />
      </div>

      {/* Helper Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-gray-400 dark:text-gray-500 px-1 pt-0.5">
        <span>
          Tip: Escribe con formato directo o usa los botones para aplicar títulos, negritas y listas en el mismo campo.
        </span>
        <span className="font-mono text-[10px] text-gray-400">
          {value ? `${value.length} caracteres` : '0 caracteres'}
        </span>
      </div>
    </div>
  );
}
