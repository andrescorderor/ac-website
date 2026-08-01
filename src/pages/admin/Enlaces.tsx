import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineExternalLink,
  HiX
} from 'react-icons/hi';
import CustomSelect from '@/components/common/CustomSelect';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: string;
};

const defaultCategories = ['General', 'Trabajo', 'Banco', 'Gobierno', 'Herramientas', 'Otro'];

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function Enlaces() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '', category: 'General' });

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });
    if (data) setBookmarks(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newBookmark.title || !newBookmark.url) return;

    // Auto-prepend https:// if missing
    let url = newBookmark.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const { error } = await supabase.from('bookmarks').insert([{
      user_id: user.id,
      title: newBookmark.title,
      url,
      category: newBookmark.category,
    }]);

    if (!error) {
      setNewBookmark({ title: '', url: '', category: 'General' });
      setShowAddForm(false);
      fetchBookmarks();
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (!error) fetchBookmarks();
  };

  const filtered = bookmarks.filter(b => {
    const matchesCat = filterCat === 'all' || b.category === filterCat;
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.url.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Group by category
  const grouped = filtered.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {} as Record<string, Bookmark[]>);

  // Get unique categories from data
  const usedCategories = [...new Set(bookmarks.map(b => b.category))];

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
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Enlaces <span className="text-gradient">Rápidos</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Tus portales y herramientas favoritas a un clic de distancia.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar enlace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg flex items-center gap-2 shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            Nuevo Enlace
          </motion.button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
            filterCat === 'all' ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:text-black dark:hover:text-white'
          }`}
        >
          Todos
        </button>
        {usedCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
              filterCat === cat ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:text-black dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

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
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto max-w-2xl w-full border-none shadow-2xl space-y-6 my-8 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Nuevo Marcador</h2>
                    <p className="font-inter text-xs text-gray-400">Guarda enlaces rápidos para tus herramientas diarias.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre *</label>
                      <input
                        value={newBookmark.title}
                        onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
                        placeholder="Ej: Portal Bancario"
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">URL *</label>
                      <input
                        value={newBookmark.url}
                        onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                        placeholder="ejemplo.com"
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría</label>
                    <CustomSelect
                      value={newBookmark.category}
                      onChange={(val) => setNewBookmark({ ...newBookmark, category: val })}
                      options={defaultCategories.map(cat => ({ value: cat, label: cat }))}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
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

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-inter font-light italic">
          No hay enlaces guardados.
        </div>
      ) : (
        Object.entries(grouped).map(([category, links]) => (
          <section key={category} className="space-y-6">
            <h2 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
              {category} ({links.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map(link => (
                <motion.a
                  key={link.id}
                  layout
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white dark:bg-gray-900 p-6 rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-1 transition-all duration-500 flex items-center gap-5 cursor-pointer"
                >
                  <div className="size-14 shrink-0 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(link.url)}&sz=32`}
                      alt=""
                      className="size-7 group-hover:hidden"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <HiOutlineExternalLink className="text-2xl hidden group-hover:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-dm-sans font-bold text-lg text-black dark:text-white truncate">{link.title}</h3>
                    <p className="font-inter text-xs text-gray-400 truncate">{getDomain(link.url)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBookmark(link.id); }}
                    className="p-2 text-gray-200 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <HiOutlineTrash />
                  </button>
                </motion.a>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
