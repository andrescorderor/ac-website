import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineShoppingBag, 
  HiOutlineLocationMarker,
  HiOutlineTag,
  HiOutlineFilter,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'bought'>('all');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    location: '', 
    price: '', 
    priority: 'Media' as const 
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .order('priority', { ascending: false }) // This is tricky with text, but we'll manage
      .order('created_at', { ascending: false });
    
    if (data) {
      // Sort priority manually for better control
      const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
      const sorted = [...data].sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
      setItems(sorted);
    }
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newItem.name) return;

    const { error } = await supabase.from('shopping_list').insert([
      {
        user_id: user.id,
        name: newItem.name,
        location: newItem.location || null,
        price: newItem.price ? parseFloat(newItem.price) : null,
        priority: newItem.priority,
      },
    ]);

    if (!error) {
      setNewItem({ name: '', location: '', price: '', priority: 'Media' });
      setShowAddForm(false);
      fetchItems();
    }
  };

  const toggleBought = async (id: string, bought: boolean) => {
    const { error } = await supabase.from('shopping_list').update({ bought: !bought }).eq('id', id);
    if (!error) fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);
    if (!error) fetchItems();
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.bought;
    if (filter === 'bought') return item.bought;
    return true;
  });

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Lista de <span className="text-gradient">Compras</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
            Organiza lo que necesitas comprar y dónde encontrarlo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {(['all', 'pending', 'bought'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                {f === 'all' ? 'Todo' : f === 'pending' ? 'Pendiente' : 'Comprado'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <HiOutlinePlus className="text-2xl" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl mb-8">
              <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">¿Qué necesitas?</label>
                  <input 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Ej: Manzanas, Mouse, etc."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Lugar (Opcional)</label>
                  <input 
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="Tienda o pasillo"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Prioridad</label>
                  <select 
                    value={newItem.priority}
                    onChange={(e) => setNewItem({...newItem, priority: e.target.value as any})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter appearance-none cursor-pointer"
                  >
                    <option value="Alta">Alta 🔥</option>
                    <option value="Media">Media ⚡</option>
                    <option value="Baja">Baja 🌱</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio (Opcional)</label>
                  <input 
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    placeholder="$0.00"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-dm-sans font-bold"
                  />
                </div>
                <button 
                  type="submit"
                  className="md:col-span-4 py-4 bg-black text-white rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                >
                  Agregar a la Lista
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 font-inter font-light italic">
            No hay artículos que coincidan con tu filtro.
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className={`group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 ${item.bought ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <button 
                  onClick={() => toggleBought(item.id, item.bought)}
                  className="text-3xl transition-all active:scale-90"
                >
                  {item.bought ? (
                    <HiOutlineCheckCircle className="text-green-500" />
                  ) : (
                    <MdOutlineCircle className="text-gray-200 hover:text-black" />
                  )}
                </button>
                <div className={`px-3 py-1 rounded-full font-syne text-[9px] font-bold uppercase tracking-widest ${
                  item.priority === 'Alta' ? 'bg-red-50 text-red-500' :
                  item.priority === 'Media' ? 'bg-orange-50 text-orange-500' :
                  'bg-green-50 text-green-500'
                }`}>
                  {item.priority}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={`font-dm-sans text-xl font-bold text-black ${item.bought ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </h3>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  {item.location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <HiOutlineLocationMarker />
                      <span className="font-inter text-xs">{item.location}</span>
                    </div>
                  )}
                  {item.price && (
                    <div className="flex items-center gap-2 text-gray-900 font-dm-sans font-bold">
                      <HiOutlineTag className="text-gray-400" />
                      <span className="text-sm">${item.price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-300">
                  ID: {item.id.slice(0, 8)}
                </span>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
