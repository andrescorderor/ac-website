import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineLocationMarker,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineSearch
} from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';

type ShoppingItem = {
  id: string;
  name: string;
  location: string | null;
  price: number | null;
  priority: 'Alta' | 'Media' | 'Baja';
  bought: boolean;
};

export default function Compras() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'bought' | 'all'>('pending');
  const [newItem, setNewItem] = useState<{
    name: string;
    location: string;
    price: string;
    priority: 'Alta' | 'Media' | 'Baja';
  }>({ 
    name: '', 
    location: '', 
    price: '', 
    priority: 'Media' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Error al cargar la lista de compras');
    } else if (data) {
      const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
      const sorted = [...data].sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
      setItems(sorted);
    }
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newItem.name.trim()) {
      toast.error('Escribe el nombre del artículo');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('shopping_list').insert([
        {
          user_id: user.id,
          name: newItem.name.trim(),
          location: newItem.location?.trim() || null,
          price: newItem.price ? parseFloat(newItem.price) : null,
          priority: newItem.priority,
        },
      ]);

      if (error) throw error;

      toast.success('Artículo agregado a la lista');
      setNewItem({ name: '', location: '', price: '', priority: 'Media' });
      setShowAddForm(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar artículo');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBought = async (id: string, bought: boolean) => {
    try {
      const { error } = await supabase.from('shopping_list').update({ bought: !bought }).eq('id', id);
      if (error) throw error;
      toast.info(bought ? 'Artículo marcado como pendiente' : 'Artículo marcado como comprado 🛒');
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('shopping_list').delete().eq('id', id);
      if (error) throw error;
      toast.success('Artículo eliminado');
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !item.bought) || 
                         (filter === 'bought' && item.bought);
    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Alta': return 'bg-red-50 text-red-600 border-red-100';
      case 'Media': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Baja': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando lista...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
            Lista de <span className="text-gradient">Compras</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
            Controla lo que necesitas comprar, prioridades y dónde encontrarlo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder="Buscar artículo o tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'pending', label: `Por Comprar (${items.filter(i => !i.bought).length})` },
          { id: 'bought', label: `Comprados (${items.filter(i => i.bought).length})` },
          { id: 'all', label: `Todos (${items.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as 'all' | 'pending' | 'bought')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === tab.id 
                ? 'bg-black text-white shadow-md' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Item Modal / Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAddItem}
            className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)]">Agregar Artículo a la Lista</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Nombre del Artículo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Leche de almendras, Cable HDMI..."
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Lugar / Tienda (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Walmart, Amazon, Supermercado"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Precio Estimado ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-dm-sans font-bold text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Prioridad
                </label>
                <div className="flex gap-3">
                  {(['Baja', 'Media', 'Alta'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setNewItem({ ...newItem, priority: p })}
                      className={`flex-1 py-3 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all border ${
                        newItem.priority === p 
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Artículo</span>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Shopping Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700">Tu lista está vacía</p>
            <p className="font-inter text-sm text-gray-400">
              {filter === 'pending'
                ? '¡No tienes compras pendientes por realizar!'
                : 'No se encontraron artículos con este filtro.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 bg-white rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-sm relative overflow-hidden group ${
                item.bought ? 'border-gray-100 bg-gray-50/50 opacity-60' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleBought(item.id, item.bought)}
                      className="text-2xl transition-transform active:scale-90"
                    >
                      {item.bought ? (
                        <HiOutlineCheckCircle className="text-emerald-500" />
                      ) : (
                        <MdOutlineCircle className="text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                    <h4 className={`font-dm-sans font-bold text-lg leading-snug ${item.bought ? 'line-through text-gray-400' : 'text-black'}`}>
                      {item.name}
                    </h4>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider border shrink-0 ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>

                {(item.location || item.price !== null) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
                    {item.location && (
                      <div className="flex items-center gap-1.5 font-inter">
                        <HiOutlineLocationMarker className="text-gray-400 text-sm" />
                        <span>{item.location}</span>
                      </div>
                    )}

                    {item.price !== null && (
                      <div className="flex items-center gap-1 font-dm-sans font-bold text-black ml-auto">
                        <HiOutlineTag className="text-gray-400 text-sm" />
                        <span>${item.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Eliminar artículo"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
