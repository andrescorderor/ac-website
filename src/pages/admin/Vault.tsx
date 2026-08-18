import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineDuplicate, HiOutlineCheck, HiOutlineTrash, HiX } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import AutoFormattedText from '@/components/common/AutoFormattedText';

type VaultItem = {
  id: string;
  title: string;
  content: string;
  category: string;
};

const CATEGORIES = ['Todas', 'General', 'Passwords', 'IDs', 'Tarjetas', 'Personal', 'Otro'];

import { useSearchParams } from 'react-router-dom';

export default function Vault() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'General' });
  const { toast } = useToast();

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar la bóveda: ' + error.message);
    else if (data) setItems(data);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!newItem.title.trim() || !newItem.content.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      const payload: Record<string, any> = {
        user_id: user.id,
        title: newItem.title.trim(),
        content: newItem.content.trim(),
        category: newItem.category || 'General',
      };

      let { data, error } = await supabase
        .from('vault_items')
        .insert([payload])
        .select();

      // Fallback: If category column is missing in Supabase schema cache
      if (error && (error.message?.includes('category') || error.code === 'PGRST204')) {
        delete payload.category;
        const fallbackRes = await supabase
          .from('vault_items')
          .insert([payload])
          .select();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;

      if (data && data[0]) {
        const savedItem = {
          ...data[0],
          category: data[0].category || newItem.category || 'General',
        };
        setItems([savedItem, ...items]);
      }
      setNewItem({ title: '', content: '', category: 'General' });
      setShowAddForm(false);
      toast.success('Texto guardado en la bóveda');
    } catch (err: any) {
      toast.error('Error al guardar en la bóveda: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    try {
      const { error } = await supabase.from('vault_items').delete().eq('id', id);
      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      
      toast.undoable('Texto eliminado de la bóveda', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = itemToDelete as any;
          const payload: any = {
            id: itemToDelete.id,
            user_id: user.id,
            ...rest,
          };
          let { error: restoreErr } = await supabase.from('vault_items').insert([payload]);
          if (restoreErr && (restoreErr.message?.includes('category') || restoreErr.code === 'PGRST204')) {
            delete payload.category;
            const fallbackRes = await supabase.from('vault_items').insert([payload]);
            restoreErr = fallbackRes.error;
          }
          if (restoreErr) throw restoreErr;
          fetchVaultItems();
          toast.success('Texto restaurado en la bóveda ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar texto: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => 
    (selectedCategory === 'Todas' || item.category === selectedCategory) &&
    (!searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-40 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Bóveda de <span className="text-gradient">Textos</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Guarda datos recurrentes (CURP, RFC, Cuentas) para copiarlos rápidamente.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder="Buscar texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 interactive-hover"
          >
            <HiOutlinePlus className="text-2xl" />
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest sm:hidden">Nuevo Registro</span>
          </button>
        </div>
      </header>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
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
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto max-w-xl w-full border-none shadow-2xl space-y-6 my-8 cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Agregar Texto a la Bóveda</h2>
                    <p className="font-inter text-xs text-gray-400">Guarda información sensible o útil para copiar rápido.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>
                
            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">Título (Ej: CURP)</label>
                  <input 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                    placeholder="¿Qué es esto?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">Categoría</label>
                  <CustomSelect
                    value={newItem.category}
                    onChange={(val) => setNewItem({...newItem, category: val})}
                    options={CATEGORIES.filter(c => c !== 'Todas').map(c => ({ value: c, label: c }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">Valor / Texto a Copiar</label>
                  <textarea 
                    rows={5}
                    value={newItem.content}
                    onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm min-h-[140px] resize-y leading-relaxed"
                    placeholder="Escribe o pega aquí el texto, código, JSON o información a guardar..."
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg interactive-hover"
              >
                Guardar Texto
              </button>
            </form>
          
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 dark:text-gray-500 font-inter font-light italic">
            No se encontraron textos que coincidan con tu búsqueda.
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Título</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const isNowPinned = togglePinItem({
                          id: item.id,
                          type: 'vault',
                          title: item.title,
                          subtitle: item.content,
                          path: '/admin/panel/vault',
                        });
                        toast.info(isNowPinned ? 'Texto de bóveda fijado en el inicio 📌' : 'Texto desfijado');
                        setItems([...items]);
                      }}
                      className={`p-1.5 rounded-xl transition-all ${
                        isItemPinned(item.id)
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      }`}
                      title={isItemPinned(item.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                    >
                      {isItemPinned(item.id) ? '📌' : '📍'}
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
                <h3 className="font-dm-sans text-xl font-bold text-black dark:text-white break-words">{item.title}</h3>
              </div>

              <div className="mt-6 space-y-4">
                <div 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className="bg-white dark:bg-gray-800/80 p-4 rounded-2xl relative overflow-hidden group/content shadow-inner cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 border border-transparent transition-all"
                  title="Haz clic para copiar"
                >
                  <AutoFormattedText text={item.content} className="font-mono text-sm text-gray-600 dark:text-gray-300 pr-8" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 group-hover/content:opacity-100 transition-opacity">
                    {copiedId === item.id ? (
                      <HiOutlineCheck className="text-green-500 text-base" />
                    ) : (
                      <HiOutlineDuplicate className="text-gray-400 text-base" />
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all interactive-hover ${
                    copiedId === item.id 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-lg'
                  }`}
                >
                  {copiedId === item.id ? (
                    <>
                      <HiOutlineCheck className="text-lg" />
                      Copiado al Portapapeles
                    </>
                  ) : (
                    <>
                      <HiOutlineDuplicate className="text-lg" />
                      Copiar Valor
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
