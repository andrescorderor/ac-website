import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiX
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { moveToTrash } from '@/lib/trash';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  category?: string;
};

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function Enlaces() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Error al cargar enlaces: ' + error.message);
    if (data) setBookmarks(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newBookmark.title.trim() || !newBookmark.url.trim()) return;

    // Auto-prepend https:// if missing
    let url = newBookmark.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const { error } = await supabase.from('bookmarks').insert([{
      user_id: user.id,
      title: newBookmark.title.trim(),
      url,
      category: 'General',
    }]);

    if (error) {
      toast.error('Error al guardar enlace: ' + error.message);
      return;
    }

    setNewBookmark({ title: '', url: '' });
    setShowAddForm(false);
    fetchBookmarks();
    toast.success('Enlace guardado ✨');
  };

  const deleteBookmark = async (id: string) => {
    const bookmarkToDelete = bookmarks.find((b) => b.id === id);
    if (!bookmarkToDelete) return;

    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) throw error;
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      moveToTrash({
        table: 'bookmarks',
        entityLabel: 'Enlace',
        title: bookmarkToDelete.title,
        subtitle: bookmarkToDelete.url,
        payload: { ...bookmarkToDelete },
      });

      toast.undoable('Enlace movido a Papelera', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = bookmarkToDelete as any;
          const { error: restoreErr } = await supabase.from('bookmarks').insert([{
            id: bookmarkToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchBookmarks();
          toast.success('Enlace restaurado ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar enlace: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar enlace: ' + err.message);
    }
  };

  const normSearch = normalize(searchTerm.trim());
  const filtered = bookmarks.filter((b) => {
    if (!normSearch) return true;
    return normalize(b.title).includes(normSearch) || normalize(b.url).includes(normSearch);
  });

  if (loading) return (
    <div className="space-y-6 pb-16">
      <div className="flex justify-between items-end">
        <div className="space-y-2.5">
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-4 w-72 hidden sm:block" />
        </div>
        <div className="skeleton h-11 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex-1">
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Enlaces <span className="text-gradient">Rápidos</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Tus portales y herramientas favoritas a un clic de distancia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:w-60">
            <input
              type="text"
              placeholder="Buscar enlace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nuevo Enlace</span>
          </motion.button>
        </div>
      </header>

      {/* Add Bookmark Modal */}
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
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-xl w-full border-none shadow-2xl my-8 cursor-default overflow-hidden"
              >
                {/* Sticky Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Agregar Nuevo Marcador</h2>
                    <p className="font-inter text-xs text-gray-400">Guarda un enlace rápido para acceder al instante.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col flex-1 min-h-0">
                  {/* Scrollable Body */}
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Título *</label>
                        <input
                          value={newBookmark.title}
                          onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
                          placeholder="Nombre del enlace"
                          className="w-full px-4 min-h-[44px] py-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-white/10 outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">URL *</label>
                        <input
                          value={newBookmark.url}
                          onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                          placeholder="https://sitio.com"
                          className="w-full px-4 min-h-[44px] py-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-white/10 outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-8 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      Guardar Marcador
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/[0.09] rounded-3xl text-center py-14 space-y-3">
          <p className="font-dm-sans text-base font-bold text-gray-700 dark:text-gray-200">
            {bookmarks.length === 0 ? 'No hay enlaces guardados.' : `Sin coincidencias para "${searchTerm}"`}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-4 min-h-[40px] py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map(link => (
            <motion.a
              key={link.id}
              layout
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-white/[0.09] shadow-xs hover:shadow-lg hover:border-gray-300 dark:hover:border-white/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 cursor-pointer"
            >
              <div className="size-12 sm:size-14 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(link.url)}&sz=32`}
                  alt=""
                  className="size-6 sm:size-7 group-hover:hidden"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <HiOutlineExternalLink className="text-xl sm:text-2xl hidden group-hover:block" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-dm-sans font-bold text-base sm:text-lg text-black dark:text-white truncate">{link.title}</h3>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate">{getDomain(link.url)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBookmark(link.id); }}
                className="min-w-[38px] min-h-[38px] p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center"
                title="Eliminar enlace"
              >
                <HiOutlineTrash />
              </button>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
