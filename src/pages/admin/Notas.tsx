import { useState, useEffect, useRef } from 'react';
import CustomSelect from '@/components/common/CustomSelect';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineDocumentText, 
  HiOutlineExternalLink, 
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiOutlinePencil,
  HiX,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type Note = {
  id: string;
  title: string;
  content: string;
  url: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
};

const categories = ['Todas', 'General', 'Trabajo', 'Personal', 'Ideas', 'Importante'];

import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';

export default function Notas() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    url: '',
    category: 'General',
  });
  const { toast } = useToast();

const TATTOO_IDEAS_LIST = [
  '• Veni, Vidi, Vici',
  '• Escorpión',
  '• Frases de Kanye y Kendrick de canciones',
  '• Serpiente',
  '• Gato negro',
  '• Fasting Buddha sculpture',
  '• Flecha siempre hacia arriba',
  '• Romanos 8:18',
  '• 1 Pedro 4:1',
  '• Salmo 118:1',
  '• Isaías 6:8',
  '• Romanos 14:8',
  '• Manos de Padre',
  '• "No resucitar" (https://www.instagram.com/p/DWSQ7AWDzSS/?img_index=3&igsh=czVidmZ3eWNhOXBs)',
  '• Tatuaje jester, filosofía del jester',
  '• Tatuaje los diamantes se forjan bajo presion',
  '• Chicken Joe Pepe el pollo tattoo',
  '• Tatuaje flores: Concepto el propósito de vivir el momento aquí y ahora',
  '• Brújula o faro',
  '• Fénix',
  '• Manos de papás',
  '• Número 3',
  '• San Miguel arcángel',
  '• Gálatas 2:20 (Galatians 2:20)'
];

  useEffect(() => {
    fetchNotes();
  }, []);

  const syncTattooIdeasNote = async (fetchedNotes: Note[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tattooNote = fetchedNotes.find(n => 
        n.title.toLowerCase().includes('tatuaj') || 
        n.content.toLowerCase().includes('tatuaj') ||
        n.title.toLowerCase().includes('tattoo')
      );

      if (!tattooNote) {
        const initialContent = `### Ideas de Tatuajes 🎨\n\n${TATTOO_IDEAS_LIST.join('\n')}`;
        const { data, error } = await supabase.from('notes').insert([
          {
            user_id: user.id,
            title: 'Ideas de Tatuajes 🎨',
            content: initialContent,
            category: 'Ideas',
            is_pinned: true,
          }
        ]).select();

        if (!error && data && data.length > 0) {
          setNotes(prev => [data[0], ...prev]);
        }
      } else {
        let content = tattooNote.content || '';
        let updated = false;

        for (const idea of TATTOO_IDEAS_LIST) {
          const cleanIdea = idea.replace('• ', '').split(' (')[0];
          if (!content.toLowerCase().includes(cleanIdea.toLowerCase())) {
            content += (content.endsWith('\n') ? '' : '\n') + idea;
            updated = true;
          }
        }

        if (updated) {
          const { data, error } = await supabase
            .from('notes')
            .update({ content })
            .eq('id', tattooNote.id)
            .select();

          if (!error && data && data.length > 0) {
            setNotes(prev => prev.map(n => n.id === tattooNote.id ? data[0] : n));
          }
        }
      }
    } catch (err) {
      console.error('Error syncing tattoo note:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.info('Para usar Notas, ejecuta la consulta SQL de scratch/notes_db.sql en Supabase.');
      } else if (data) {
        setNotes(data);
        syncTattooIdeasNote(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNote({
      title: note.title,
      content: note.content || '',
      url: note.url || '',
      category: note.category || 'General',
    });
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingNoteId(null);
    setNewNote({ title: '', content: '', url: '', category: 'General' });
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newNote.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: newNote.title.trim(),
        content: newNote.content?.trim() || '',
        url: newNote.url?.trim() || null,
        category: newNote.category,
      };

      if (editingNoteId) {
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingNoteId);

        if (error) throw error;
        toast.success('Nota actualizada correctamente');
      } else {
        const { error } = await supabase.from('notes').insert([
          {
            user_id: user.id,
            ...payload,
          },
        ]);

        if (error) throw error;
        toast.success('Nota creada correctamente');
      }

      handleCancelForm();
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la nota');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    const noteToDelete = notes.find((n) => n.id === id);
    if (!noteToDelete) return;

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      
      toast.undoable('Nota eliminada', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = noteToDelete as any;
          const { error: restoreErr } = await supabase.from('notes').insert([{
            id: noteToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchNotes();
          toast.success('Nota restaurada ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar nota: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Contenido copiado al portapapeles');
  };

  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (
    formatter: (selectedText: string, beforeText: string) => { textToInsert: string; cursorOffset?: number }
  ) => {
    const el = contentTextareaRef.current;
    const currentVal = newNote.content || '';

    if (!el) {
      const res = formatter('', currentVal);
      setNewNote(prev => ({ ...prev, content: currentVal + res.textToInsert }));
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = currentVal.substring(0, start);
    const selected = currentVal.substring(start, end);
    const after = currentVal.substring(end);

    const { textToInsert, cursorOffset } = formatter(selected, before);

    const newVal = before + textToInsert + after;
    setNewNote(prev => ({ ...prev, content: newVal }));

    setTimeout(() => {
      if (el) {
        el.focus();
        const newCursorPos = cursorOffset !== undefined ? start + cursorOffset : start + textToInsert.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const insertBullet = () => {
    insertAtCursor((_, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n• ' : '• ';
      return { textToInsert: prefix };
    });
  };

  const insertBold = () => {
    insertAtCursor((selected) => {
      if (selected) {
        return { textToInsert: `**${selected}**` };
      }
      return { textToInsert: '**texto**', cursorOffset: 2 };
    });
  };

  const insertHeading = () => {
    insertAtCursor((selected, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n\n### ' : '### ';
      const text = selected || 'Título de sección';
      return { textToInsert: `${prefix}${text}` };
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

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = selectedCategory === 'Todas' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-44 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Notas <span className="text-gradient">Importantes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Guarda apuntes con formato, listas de viñetas y enlaces de referencia.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar en notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <button
            onClick={() => {
              if (showAddForm) {
                handleCancelForm();
              } else {
                setEditingNoteId(null);
                setNewNote({ title: '', content: '', url: '', category: 'General' });
                setShowAddForm(true);
              }
            }}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <HiOutlinePlus className="text-lg" />
            <span>{showAddForm ? 'Cerrar Formulario' : 'Nueva Nota'}</span>
          </button>
        </div>
      </header>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {showAddForm && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddForm(false);
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto max-w-2xl w-full border-none shadow-2xl space-y-6 my-8 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                    {editingNoteId ? 'Editar Nota' : 'Crear Nueva Nota'}
                  </h2>
                  <p className="font-inter text-xs text-gray-400">Guarda apuntes con formato Markdown y enlaces de referencia.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Título de la Nota *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Resumen de reunión, Pasos para despliegue..."
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Categoría
                      </label>
                      <CustomSelect
                        value={newNote.category}
                        onChange={(val) => setNewNote({ ...newNote, category: val })}
                        options={categories.filter(c => c !== 'Todas').map(c => ({ value: c, label: c }))}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 mb-3">
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                        Contenido de la Nota (Soporta Markdown)
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={insertHeading}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1"
                          title="Agregar título de sección"
                        >
                          <span className="text-sky-500 font-bold">H3</span>
                          <span>Sección</span>
                        </button>
                        <button
                          type="button"
                          onClick={insertBold}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                          title="Texto en negrita"
                        >
                          <strong>B</strong> Negrita
                        </button>
                        <button
                          type="button"
                          onClick={insertNumberList}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                          title="Lista numerada (1., 2., 3...)"
                        >
                          1. Paso
                        </button>
                        <button
                          type="button"
                          onClick={insertBullet}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                          title="Viñeta de punto"
                        >
                          • Viñeta
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={contentTextareaRef}
                      rows={10}
                      placeholder="Escribe tu nota aquí... (Puedes usar saltos de línea y viñetas)"
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[220px] resize-y"
                    />
                  </div>

                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                      Enlace Relacionado (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com"
                      value={newNote.url}
                      onChange={(e) => setNewNote({ ...newNote, url: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{editingNoteId ? 'Actualizar Nota' : 'Guardar Nota'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border-none shadow-sm space-y-3">
            <HiOutlineDocumentText className="text-4xl text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">No hay notas en esta sección</p>
            <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
              Crea tu primera nota para organizar tus ideas e información clave.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6 overflow-hidden relative"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider">
                      {note.category}
                    </span>
                    <h3 className="font-dm-sans font-bold text-xl text-black dark:text-white mt-2 leading-snug">
                      {note.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const isNowPinned = togglePinItem({
                          id: note.id,
                          type: 'note',
                          title: note.title,
                          subtitle: note.content || note.category,
                          path: '/admin/panel/notas',
                        });
                        toast.info(isNowPinned ? 'Nota fijada en el inicio 📌' : 'Nota desfijada');
                        setNotes([...notes]);
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isItemPinned(note.id)
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      }`}
                      title={isItemPinned(note.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                    >
                      {isItemPinned(note.id) ? '📌' : '📍'}
                    </button>
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                      title="Editar nota"
                    >
                      <HiOutlinePencil className="text-lg" />
                    </button>
                    {note.content && (
                      <button
                        onClick={() => copyContent(note.content)}
                        className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                        title="Copiar contenido"
                      >
                        <HiOutlineClipboardCopy className="text-lg" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0"
                      title="Eliminar nota"
                    >
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>

                {note.content && (
                  <AutoFormattedText text={note.content} className="text-sm text-gray-600 dark:text-gray-300 font-light" />
                )}
              </div>

              {note.url && (
                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-syne font-bold text-black dark:text-white hover:underline group/link"
                  >
                    <span>Abrir Enlace</span>
                    <HiOutlineExternalLink className="text-sm transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
