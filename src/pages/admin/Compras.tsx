import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineCheckCircle, 
  HiOutlineLocationMarker,
  HiOutlineTag,
  HiOutlineSearch,
  HiX
} from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import MandadoModal from '@/components/admin/MandadoModal';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type ShoppingItem = {
  id: string;
  name: string;
  location: string | null;
  price: number | null;
  priority: 'Baja' | 'Media' | 'Alta';
  type?: 'quincenal' | 'ocasional';
  category?: string | null;
  bought: boolean;
};

import { useSearchParams } from 'react-router-dom';

export default function Compras() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'bought'>('pending');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      if (queryParam) setFilter('all');
    }
  }, [searchParams]);

  const [newItem, setNewItem] = useState({
    name: '',
    location: '',
    price: '',
    priority: 'Media' as 'Baja' | 'Media' | 'Alta',
    type: 'quincenal' as 'quincenal' | 'ocasional',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar lista de compras: ' + error.message);
    else if (data) setItems(data);
    setLoading(false);
  };

  const [showQuincenaModal, setShowQuincenaModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('quincena') === 'true' || searchParams.get('mandado') === 'true') {
      setShowQuincenaModal(true);
    }
  }, [searchParams]);

  const isMandadoItem = (item: ShoppingItem): boolean => {
    if (item.type === 'quincenal' || item.type === 'ocasional') return true;
    if (item.category === 'quincenal' || item.category === 'ocasional' || item.category === 'comida' || item.category === 'insumos') return true;
    if (item.location?.includes('Quincenal') || item.location?.includes('Agotar') || item.location?.includes('Agotamiento') || item.location?.includes('Mandado') || item.location?.includes('Comida') || item.location?.includes('Insumos') || item.location?.includes('🍔') || item.location?.includes('🛒') || item.location?.includes('🥗') || item.location?.includes('📦')) return true;
    return false;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!newItem.name.trim()) {
      toast.error('El nombre del artículo es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        user_id: user.id,
        name: newItem.name.trim(),
        location: newItem.location.trim() || null,
        price: newItem.price ? parseFloat(newItem.price) : null,
        priority: newItem.priority,
        bought: false,
      };

      const { data, error } = await supabase.from('shopping_list').insert([payload]).select();
      if (error) throw error;

      if (data) {
        setItems([data[0], ...items]);
        setNewItem({ name: '', location: '', price: '', priority: 'Media', type: 'ocasional' });
        setShowAddForm(false);
        toast.success('Artículo agregado a la lista de compras');
      }
    } catch (err: any) {
      toast.error('Error al agregar artículo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBought = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('shopping_list').update({ bought: !currentStatus }).eq('id', id);
      if (error) throw error;

      setItems(items.map((i) => (i.id === id ? { ...i, bought: !currentStatus } : i)));
      toast.info(!currentStatus ? 'Artículo comprado 🛒' : 'Artículo marcado como pendiente');
    } catch (err: any) {
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('shopping_list').delete().eq('id', id);
      if (error) throw error;

      setItems(items.filter((i) => i.id !== id));
      toast.success('Artículo eliminado');
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const quincenalList = items.filter(isMandadoItem);
  const generalList = items.filter((i) => !isMandadoItem(i));

  const filteredItems = generalList.filter((i) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'pending' ? !i.bought : i.bought;
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.location && i.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Alta':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border-red-100 dark:border-red-900/40';
      case 'Media':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border-orange-100 dark:border-orange-900/40';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700';
    }
  };

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Lista de <span className="text-gradient">Compras</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Gestiona tus compras generales y accede a tu rutina de mandado quincenal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <input 
              type="text"
              placeholder="Buscar compra general..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <button
            onClick={() => setShowQuincenaModal(true)}
            className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 interactive-hover"
            title="Abre tu listado aislado de mandado quincenal de dieta"
          >
            <span>🥗 Mandado Quincenal</span>
            <span className="px-2 py-0.5 bg-emerald-700/80 rounded-full text-[10px] font-bold">
              {quincenalList.filter(i => !i.bought).length}
            </span>
          </button>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Agregar Artículo</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'pending', label: `Por Comprar (${generalList.filter(i => !i.bought).length})` },
          { id: 'bought', label: `Comprados (${generalList.filter(i => i.bought).length})` },
          { id: 'all', label: `Todos (${generalList.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as 'all' | 'pending' | 'bought')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === tab.id 
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Mandado Quincenal Modal ═══ */}
      <MandadoModal
        isOpen={showQuincenaModal}
        onClose={() => {
          setShowQuincenaModal(false);
          fetchItems();
        }}
      />

      {/* Add Item Modal */}
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
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Agregar Artículo a la Lista</h2>
                  <p className="font-inter text-xs text-gray-400">Registra artículos pendientes por comprar con prioridad y lugar.</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Artículo *</label>
                    <input
                      required
                      value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Ej. Leche de almendras, Cable HDMI..."
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Lugar / Tienda</label>
                    <input
                      value={newItem.location}
                      onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                      placeholder="Ej. Supermercado, Amazon, Farmacia..."
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Precio Estimado ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Prioridad</label>
                    <CustomSelect
                      value={newItem.priority}
                      onChange={(val) => setNewItem({ ...newItem, priority: val as 'Baja' | 'Media' | 'Alta' })}
                      options={[
                        { value: 'Alta', label: 'Alta 🔴' },
                        { value: 'Media', label: 'Media 🟠' },
                        { value: 'Baja', label: 'Baja ⚪' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3.5 rounded-xl font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Guardar Artículo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Grid of Shopping Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border-none shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">Tu lista está vacía</p>
            <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
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
              className={`group p-6 bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden ${
                item.bought ? 'opacity-60' : ''
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
                        <MdOutlineCircle className="text-gray-300 dark:text-gray-600 hover:text-gray-400" />
                      )}
                    </button>
                    <h4 className={`font-dm-sans font-bold text-lg leading-snug ${item.bought ? 'line-through text-gray-400 dark:text-gray-500' : 'text-black dark:text-white'}`}>
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                {(item.location || item.price !== null) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-50 dark:border-gray-800">
                    {item.location && (
                      <div className="flex items-center gap-1.5 font-inter">
                        <HiOutlineLocationMarker className="text-gray-400 dark:text-gray-500 text-sm" />
                        <span>{item.location}</span>
                      </div>
                    )}

                    {item.price !== null && (
                      <div className="flex items-center gap-1 font-dm-sans font-bold text-black dark:text-white ml-auto">
                        <HiOutlineTag className="text-gray-400 dark:text-gray-500 text-sm" />
                        <span>${item.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end items-center gap-1 pt-2">
                <button
                  onClick={() => {
                    const isNowPinned = togglePinItem({
                      id: item.id,
                      type: 'shopping',
                      title: item.name,
                      subtitle: item.location ? `Lugar: ${item.location}` : 'Lista de Compras',
                      path: '/admin/panel/compras',
                    });
                    toast.info(isNowPinned ? 'Artículo fijado en el inicio 📌' : 'Artículo desfijado');
                    setItems([...items]);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isItemPinned(item.id)
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                  title={isItemPinned(item.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                >
                  {isItemPinned(item.id) ? '📌' : '📍'}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0"
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
