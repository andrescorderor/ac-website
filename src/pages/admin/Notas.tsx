import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineDocumentText, 
  HiOutlineExternalLink, 
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiOutlinePencil
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

import AutoFormattedText from '@/components/common/AutoFormattedText';

export default function Notas() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    url: '',
    category: 'General',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

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
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Nota eliminada');
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Contenido copiado al portapapeles');
  };

  const insertBullet = () => {
    setNewNote(prev => ({ ...prev, content: prev.content + (prev.content ? '\n• ' : '• ') }));
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = selectedCategory === 'Todas' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
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
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
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

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSaveNote}
            className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)] dark:text-white">
              {editingNoteId ? 'Editar Nota' : 'Crear Nueva Nota'}
            </h3>

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
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100"
                  >
                    {categories.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c} className="dark:bg-gray-800">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Contenido de la Nota (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={insertBullet}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all"
                  >
                    + Agregar Viñeta (•)
                  </button>
                </div>
                <textarea
                  rows={5}
                  placeholder="Escribe tu nota aquí... (Puedes usar saltos de línea y viñetas)"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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
          </motion.form>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
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
              className="p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700 transition-all flex flex-col justify-between gap-6 relative group"
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-950/30 rounded-xl transition-all"
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
