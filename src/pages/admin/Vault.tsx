import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineDuplicate, HiOutlineCheck } from 'react-icons/hi';

type VaultItem = {
  id: string;
  title: string;
  content: string;
};

export default function Vault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newItem.title || !newItem.content) return;

    const { error } = await supabase.from('vault_items').insert([
      {
        user_id: user.id,
        title: newItem.title,
        content: newItem.content,
      },
    ]);

    if (!error) {
      setNewItem({ title: '', content: '' });
      setShowAddForm(false);
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('vault_items').delete().eq('id', id);
    if (!error) fetchItems();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Textos <span className="text-gradient">Importantes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
            Guarda CURP, RFC, tarjetas y más para copiar rápido.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder="Buscar texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
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
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl"
          >
            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Título (Ej: CURP)</label>
                  <input 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none font-inter transition-all"
                    placeholder="¿Qué es esto?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Valor</label>
                  <input 
                    value={newItem.content}
                    onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none font-inter transition-all"
                    placeholder="El texto a copiar..."
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-black text-white rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
              >
                Guardar Texto
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 font-inter font-light italic">
            No se encontraron textos que coincidan con tu búsqueda.
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-500 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</span>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
                <h3 className="font-dm-sans text-xl font-bold text-black break-words">{item.title}</h3>
              </div>

              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative overflow-hidden group/content">
                  <p className="font-mono text-sm text-gray-600 break-all pr-8">{item.content}</p>
                </div>
                
                <button 
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
                    copiedId === item.id 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                    : 'bg-gray-50 text-gray-400 hover:bg-black hover:text-white hover:shadow-lg'
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
