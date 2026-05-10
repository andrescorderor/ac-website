import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineExternalLink
} from 'react-icons/hi';

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

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Enlaces <span className="text-gradient">Rápidos</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
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
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <HiOutlinePlus className="text-2xl" />
          </button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
            filterCat === 'all' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:text-black'
          }`}
        >
          Todos
        </button>
        {usedCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
              filterCat === cat ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl mb-8">
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                  <input
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
                    placeholder="Ej: Portal Bancario"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">URL</label>
                  <input
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                    placeholder="ejemplo.com"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría</label>
                  <select
                    value={newBookmark.category}
                    onChange={(e) => setNewBookmark({...newBookmark, category: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter appearance-none cursor-pointer"
                  >
                    {defaultCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="md:col-span-3 py-4 bg-black text-white rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                >
                  Guardar Enlace
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-inter font-light italic">
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
                  className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-500 flex items-center gap-5 cursor-pointer"
                >
                  <div className="size-14 shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden group-hover:bg-black group-hover:text-white transition-all duration-500">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(link.url)}&sz=32`}
                      alt=""
                      className="size-7 group-hover:hidden"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <HiOutlineExternalLink className="text-2xl hidden group-hover:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-dm-sans font-bold text-lg text-black truncate">{link.title}</h3>
                    <p className="font-inter text-xs text-gray-400 truncate">{getDomain(link.url)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBookmark(link.id); }}
                    className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
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
