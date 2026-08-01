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
  HiOutlineRefresh,
  HiX
} from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
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
  const [quincenaInputName, setQuincenaInputName] = useState('');
  const [quincenaInputLocation, setQuincenaInputLocation] = useState('');
  const [quincenaInputPrice, setQuincenaInputPrice] = useState('');
  const [quincenaInputType, setQuincenaInputType] = useState<'quincenal' | 'ocasional'>('quincenal');
  const [registeringFinance, setRegisteringFinance] = useState(false);

  const getItemType = (item: ShoppingItem): 'quincenal' | 'ocasional' => {
    if (item.type === 'quincenal' || item.type === 'ocasional') return item.type;
    if (item.category === 'quincenal' || item.category === 'ocasional') return item.category as 'quincenal' | 'ocasional';
    if (item.location?.includes('Quincenal') || item.name.includes('[Quincenal]')) return 'quincenal';
    if (item.location?.includes('Ocasional') || item.location?.includes('Agotar') || item.location?.includes('Agotamiento')) return 'ocasional';
    return 'ocasional';
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

  const handleAddQuincenaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quincenaInputName.trim()) {
      toast.error('Ingresa el nombre del producto para tu mandado quincenal');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const storeText = quincenaInputLocation.trim();
      const locText = storeText
        ? `${quincenaInputType === 'quincenal' ? '🥗 Quincenal' : '📦 Agotamiento'} — ${storeText}`
        : (quincenaInputType === 'quincenal' ? 'Mandado Quincenal 🥗' : 'Hasta Agotar 📦');

      const payload: any = {
        user_id: user.id,
        name: quincenaInputName.trim(),
        location: locText,
        price: quincenaInputPrice ? parseFloat(quincenaInputPrice) : null,
        priority: 'Media',
        type: quincenaInputType,
        bought: false,
      };

      let { data, error } = await supabase.from('shopping_list').insert([payload]).select();

      if (error && error.message?.includes('type')) {
        delete payload.type;
        const res = await supabase.from('shopping_list').insert([payload]).select();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      if (data) {
        setItems([{ ...data[0], type: quincenaInputType }, ...items]);
        setQuincenaInputName('');
        setQuincenaInputLocation('');
        setQuincenaInputPrice('');
        toast.success(`Producto agregado como ${quincenaInputType === 'quincenal' ? 'Quincenal 🥗' : 'Hasta Agotar 📦'}`);
      }
    } catch (err: any) {
      toast.error('Error al agregar: ' + err.message);
    }
  };

  const handleMarkAsAgotado = async (id: string) => {
    try {
      const { error } = await supabase.from('shopping_list').update({ bought: false }).eq('id', id);
      if (error) throw error;

      setItems(items.map((i) => (i.id === id ? { ...i, bought: false } : i)));
      toast.info('⚠️ Producto marcado como Agotado. Agregado a pendientes de la quincena.');
    } catch (err: any) {
      toast.error('Error al marcar como agotado: ' + err.message);
    }
  };

  const handleRegisterExpenseToFinanzas = async (category: 'comida' | 'insumos', concept: string, amount: number) => {
    if (amount <= 0) {
      toast.error('El monto a registrar debe ser mayor a 0');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setRegisteringFinance(true);
    try {
      const { error } = await supabase.from('finance_expenses').insert([
        {
          user_id: user.id,
          concept,
          amount,
          category,
        },
      ]);

      if (error) throw error;

      toast.success(`💸 ¡Gasto de $${amount.toLocaleString()} registrado en Finanzas bajo '${category === 'comida' ? 'Alimentación & Comida' : 'Insumos & Casa'}'!`);
    } catch (err: any) {
      toast.error('Error al registrar gasto en Finanzas: ' + err.message);
    } finally {
      setRegisteringFinance(false);
    }
  };

  const handleRenewQuincenal = async () => {
    const quincenalItems = items.filter((i) => getItemType(i) === 'quincenal');
    if (quincenalItems.length === 0) {
      toast.info('No tienes artículos en tu Mandado Quincenal 🥗');
      return;
    }

    try {
      const quincenalIds = quincenalItems.map((i) => i.id);
      const { error } = await supabase
        .from('shopping_list')
        .update({ bought: false })
        .in('id', quincenalIds);

      if (error) throw error;

      setItems(items.map((i) => (getItemType(i) === 'quincenal' ? { ...i, bought: false } : i)));
      toast.success(`🥗 ¡Mandado quincenal desmarcado! Todos los productos están listos para la nueva quincena.`);
    } catch (err: any) {
      toast.error('Error al renovar mandado quincenal: ' + err.message);
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

  const quincenalList = items.filter((i) => getItemType(i) === 'quincenal');
  const generalList = items.filter((i) => getItemType(i) !== 'quincenal');

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
      {createPortal(
        <AnimatePresence>
          {showQuincenaModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[90vh] overflow-y-auto max-w-3xl w-full border-none shadow-2xl space-y-6 my-6"
              >
                {/* Header of Modal */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥗</span>
                      <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                        Mandado Quincenal — Dieta & Consumo
                      </h2>
                    </div>
                    <p className="font-inter text-xs text-gray-400 mt-1">
                      Listado de compras fijo para cada 2 semanas. Marca o desmarca productos a medida que los compras.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuincenaModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                {/* Progress & Reset Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-syne text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        {quincenalList.filter(i => i.bought).length} de {quincenalList.length} productos comprados
                      </span>
                      {quincenalList.length > 0 && (
                        <span className="text-xs font-dm-sans font-bold text-emerald-600 dark:text-emerald-400">
                          ({Math.round((quincenalList.filter(i => i.bought).length / quincenalList.length) * 100)}%)
                        </span>
                      )}
                    </div>
                    <div className="w-full sm:w-64 bg-emerald-200/60 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                        style={{ width: `${quincenalList.length > 0 ? (quincenalList.filter(i => i.bought).length / quincenalList.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRenewQuincenal}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 interactive-hover shrink-0"
                    title="Desmarca todos los artículos para iniciar una nueva quincena"
                  >
                    <HiOutlineRefresh className="text-base" />
                    <span>Iniciar Nueva Quincena 🔄</span>
                  </button>
                </div>

                {/* Quick Add Form inside Quincena Modal */}
                <form onSubmit={handleAddQuincenaItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Producto (ej. Pechuga, Avena, Detergente...)"
                      value={quincenaInputName}
                      onChange={(e) => setQuincenaInputName(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-emerald-500 text-sm font-inter text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Lugar (ej. Walmart, Costco)"
                      value={quincenaInputLocation}
                      onChange={(e) => setQuincenaInputLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-emerald-500 text-sm font-inter text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <CustomSelect
                      value={quincenaInputType}
                      onChange={(val) => setQuincenaInputType(val as 'quincenal' | 'ocasional')}
                      options={[
                        { value: 'quincenal', label: 'Quincenal (2 semanas) 🥗' },
                        { value: 'ocasional', label: 'Hasta Agotar (Consumible) 📦' },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="$ Precio"
                      value={quincenaInputPrice}
                      onChange={(e) => setQuincenaInputPrice(e.target.value)}
                      className="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-emerald-500 text-sm font-inter text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-12 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <HiOutlinePlus className="text-base" />
                      <span>Agregar a la Quincena</span>
                    </button>
                  </div>
                </form>

                {/* Quincenal List Items */}
                <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1 scrollbar-none">
                  {quincenalList.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-gray-400 space-y-1">
                      <p className="font-dm-sans font-bold text-base">No hay productos en tu mandado quincenal</p>
                      <p className="font-inter text-xs">Agrega arriba los productos de tu consumo recurrente o insumos de cada 2 semanas.</p>
                    </div>
                  ) : (
                    quincenalList.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                          item.bought 
                            ? 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60' 
                            : 'bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            onClick={() => toggleBought(item.id, item.bought)}
                            className="text-2xl transition-transform active:scale-90 shrink-0"
                            title={item.bought ? 'Marcar como pendiente' : 'Marcar como comprado'}
                          >
                            {item.bought ? (
                              <HiOutlineCheckCircle className="text-emerald-500" />
                            ) : (
                              <MdOutlineCircle className="text-gray-300 dark:text-gray-600 hover:text-emerald-500" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-dm-sans font-medium text-sm sm:text-base truncate ${
                                item.bought ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                              }`}>
                                {item.name}
                              </span>

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${
                                getItemType(item) === 'quincenal'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                              }`}>
                                {getItemType(item) === 'quincenal' ? '🥗 Quincenal' : '📦 Hasta Agotar'}
                              </span>
                            </div>

                            {item.location && (
                              <span className="font-inter text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                <HiOutlineLocationMarker className="text-xs shrink-0" />
                                <span className="truncate">{item.location.replace(/^(🥗 Quincenal|📦 Agotamiento) — /, '')}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 justify-end">
                          {/* If item is 'ocasional' (Hasta agotar) and bought, allow marking as Agotado */}
                          {getItemType(item) === 'ocasional' && item.bought && (
                            <button
                              onClick={() => handleMarkAsAgotado(item.id)}
                              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg font-syne text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                              title="Marcar producto como consumido/agotado para volverlo a comprar"
                            >
                              <span>⚠️ Agotado</span>
                            </button>
                          )}

                          {item.price !== null && (
                            <span className="font-dm-sans font-bold text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/80 px-2.5 py-1.5 rounded-lg">
                              ${item.price.toLocaleString()}
                            </span>
                          )}

                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                            title="Eliminar de la quincena"
                          >
                            <HiOutlineTrash className="text-base" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer of Modal & Finanzas Integration */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-xs font-inter text-gray-500 space-y-0.5">
                    <div>
                      Presupuesto estimado total: <strong className="text-gray-900 dark:text-white font-dm-sans text-sm">${quincenalList.reduce((acc, i) => acc + (i.price || 0), 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      Comprados en esta quincena: <strong className="text-emerald-600 dark:text-emerald-400 font-dm-sans text-sm">${quincenalList.filter(i => i.bought).reduce((acc, i) => acc + (i.price || 0), 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={registeringFinance}
                      onClick={() => {
                        const totalComprados = quincenalList.filter(i => i.bought).reduce((acc, i) => acc + (i.price || 0), 0);
                        const totalEstimado = quincenalList.reduce((acc, i) => acc + (i.price || 0), 0);
                        const amountToUse = totalComprados > 0 ? totalComprados : totalEstimado;
                        handleRegisterExpenseToFinanzas('comida', 'Mandado Quincenal (Alimentación)', amountToUse);
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 interactive-hover"
                      title="Registra este gasto en el módulo de Finanzas bajo la categoría Alimentación & Comida"
                    >
                      <span>💸 Registrar en Finanzas (Comida)</span>
                    </button>

                    <button
                      disabled={registeringFinance}
                      onClick={() => {
                        const totalComprados = quincenalList.filter(i => i.bought).reduce((acc, i) => acc + (i.price || 0), 0);
                        const totalEstimado = quincenalList.reduce((acc, i) => acc + (i.price || 0), 0);
                        const amountToUse = totalComprados > 0 ? totalComprados : totalEstimado;
                        handleRegisterExpenseToFinanzas('insumos', 'Mandado Quincenal (Insumos)', amountToUse);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 interactive-hover"
                      title="Registra este gasto en Finanzas bajo la categoría Insumos & Casa"
                    >
                      <span>🏠 Insumos</span>
                    </button>

                    <button
                      onClick={() => setShowQuincenaModal(false)}
                      className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Add Item Modal */}
      {createPortal(
        <AnimatePresence>
          {showAddForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto max-w-2xl w-full border-none shadow-2xl space-y-6 my-8"
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
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${
                      getItemType(item) === 'quincenal'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                    }`}>
                      {getItemType(item) === 'quincenal' ? '🥗 Quincenal' : '📦 Agotamiento'}
                    </span>

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
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
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
