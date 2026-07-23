import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineDuplicate, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type VaultItem = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export default function Vault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

    try {
      let { data, error } = await supabase
        .from('vault_items')
        .insert([{ 
          user_id: user.id, 
          title: newItem.title, 
          content: newItem.content, 
          category: newItem.category 
        }])
        .select();

      // If category column is missing in Supabase table schema, fallback to inserting without category
      if (error && (error.message.includes("category") || error.code === 'PGRST204')) {
        const fallbackRes = await supabase
          .from('vault_items')
          .insert([{ 
            user_id: user.id, 
            title: newItem.title, 
            content: newItem.content 
          }])
          .select();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;

      if (data) {
        setItems([data[0], ...items]);
        setNewItem({ title: '', content: '', category: 'General' });
        setShowAddForm(false);
        toast.success('Texto guardado en bóveda');
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast.success('Texto eliminado de la bóveda');
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
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando bóveda...</div>;

  return (
    <div className="space-y-12 pb-20">
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
            className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <HiOutlinePlus className="text-2xl" />
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest sm:hidden">Nuevo Registro</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl"
          >
            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">Título (Ej: CURP)</label>
                  <input 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-gray-200 dark:focus:border-gray-600 outline-none font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    placeholder="¿Qué es esto?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">Valor</label>
                  <input 
                    value={newItem.content}
                    onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-gray-200 dark:focus:border-gray-600 outline-none font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    placeholder="El texto a copiar..."
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
              >
                Guardar Texto
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="group bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-500 flex flex-col justify-between"
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-300 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
                <h3 className="font-dm-sans text-xl font-bold text-black dark:text-white break-words">{item.title}</h3>
              </div>

              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden group/content">
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-300 break-all pr-8">{item.content}</p>
                </div>
                
                <button 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
                    copiedId === item.id 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-lg'
                  }`}
                >
                  {copiedId === item.id ? (
                    <>
                      <HiOutlineCheck className="text-lg" />
                      Copiado
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
