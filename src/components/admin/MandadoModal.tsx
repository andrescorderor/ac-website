import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineCheckCircle, HiOutlineTrash, HiOutlineRefresh, HiOutlineLocationMarker, HiOutlineSearch, HiOutlinePencil, HiOutlineClock, HiX } from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';

type ShoppingItem = {
  id: string;
  name: string;
  location: string | null;
  price: number | null;
  priority: 'Baja' | 'Media' | 'Alta';
  type?: 'quincenal' | 'ocasional';
  category?: string | null;
  bought: boolean;
  purchase_history?: string[] | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type MandadoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MandadoModal({ isOpen, onClose }: MandadoModalProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [inputName, setInputName] = useState('');
  const [inputQuantity, setInputQuantity] = useState('');
  const [inputLocation, setInputLocation] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputType, setInputType] = useState<'quincenal' | 'ocasional'>('quincenal');
  const [inputCategory, setInputCategory] = useState<'comida' | 'insumos'>('comida');
  const [historyModalItem, setHistoryModalItem] = useState<ShoppingItem | null>(null);

  const handleOpenEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setInputName(item.name);
    setInputQuantity(getItemQuantity(item) || '');
    setInputLocation(getCleanStoreLocation(item.location) || '');
    setInputPrice(item.price !== null ? String(item.price) : '');
    setInputType(getItemType(item));
    setInputCategory(getItemCategory(item));
    setShowAddForm(true);
  };

  useEffect(() => {
    if (isOpen) {
      fetchItemsAndAutoSeed();
    }
  }, [isOpen]);

  const fetchItemsAndAutoSeed = async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data);

      // Check if mandado items already exist
      const existingMandado = data.filter(isMandadoItem);
      if (existingMandado.length === 0) {
        // Automatically insert the 63 base items into the database
        await handleImportInitialList();
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'comida' | 'insumos'>('all');

  const isMandadoItem = (item: ShoppingItem): boolean => {
    if (item.type === 'quincenal' || item.type === 'ocasional') return true;
    if (item.category === 'quincenal' || item.category === 'ocasional' || item.category === 'comida' || item.category === 'insumos') return true;
    if (item.location?.includes('Quincenal') || item.location?.includes('Agotar') || item.location?.includes('Agotamiento') || item.location?.includes('Mandado') || item.location?.includes('Comida') || item.location?.includes('Insumos') || item.location?.includes('🍔') || item.location?.includes('🛒') || item.location?.includes('🥗') || item.location?.includes('📦')) return true;
    return false;
  };

  const getItemType = (item: ShoppingItem): 'quincenal' | 'ocasional' => {
    if (item.type === 'quincenal' || item.type === 'ocasional') return item.type;
    if (item.category === 'quincenal' || item.category === 'ocasional') return item.category as 'quincenal' | 'ocasional';
    if (item.location?.includes('Quincenal') || item.name.includes('[Quincenal]')) return 'quincenal';
    if (item.location?.includes('Ocasional') || item.location?.includes('Agotar') || item.location?.includes('Agotamiento')) return 'ocasional';
    return 'ocasional';
  };

  const getItemCategory = (item: ShoppingItem): 'comida' | 'insumos' => {
    if (item.category === 'comida' || item.category === 'insumos') return item.category as 'comida' | 'insumos';
    if (item.location?.includes('Insumos') || item.location?.includes('Casa') || item.location?.includes('🛒')) return 'insumos';
    return 'comida';
  };

  const getItemQuantity = (item: ShoppingItem): string | null => {
    if ((item as any).quantity !== undefined && (item as any).quantity !== null && String((item as any).quantity).trim() !== '') {
      return String((item as any).quantity);
    }
    if (item.location) {
      const match = item.location.match(/Cant:\s*([^—|]+)/i);
      if (match) return match[1].trim();
    }
    return null;
  };

  const getCleanStoreLocation = (location: string | null): string | null => {
    if (!location) return null;
    if (location.includes('—')) {
      const parts = location.split('—');
      const store = parts[parts.length - 1].trim();
      return store || null;
    }
    if (location.startsWith('🍔') || location.startsWith('🛒') || location.includes('Quincenal') || location.includes('Agotar') || location.includes('Agotamiento')) {
      return null;
    }
    return location.trim();
  };

  const allMandado = items.filter(isMandadoItem);

  // Filter out any duplicates with identical product names
  const rawQuincenalList = allMandado.filter((item, index, self) =>
    index === self.findIndex((t) => t.name.trim().toLowerCase() === item.name.trim().toLowerCase())
  );

  const quincenalList = rawQuincenalList
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (activeTab === 'pending') return !item.bought;
      if (activeTab === 'comida') return getItemCategory(item) === 'comida';
      if (activeTab === 'insumos') return getItemCategory(item) === 'insumos';
      return true;
    })
    .sort((a, b) => {
      if (a.bought !== b.bought) return a.bought ? 1 : -1; // Pending first!
      return 0;
    });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error('Ingresa el nombre del producto para tu mandado');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const cantText = inputQuantity.trim() ? ` | Cant: ${inputQuantity.trim()}` : '';
      const storeText = inputLocation.trim();
      const catText = inputCategory === 'comida' ? '🍔 Comida' : '🛒 Insumos';
      const freqText = inputType === 'quincenal' ? '🥗 Quincenal' : '📦 Hasta Agotar';
      const locText = storeText
        ? `${catText} | ${freqText}${cantText} — ${storeText}`
        : `${catText} | ${freqText}${cantText}`;

      const itemPrice = inputPrice ? parseFloat(inputPrice) : null;
      const nowIso = new Date().toISOString();

      const payload: any = {
        user_id: user.id,
        name: inputName.trim(),
        location: locText,
        price: itemPrice,
        quantity: inputQuantity.trim() || null,
        priority: 'Media',
        type: inputType,
        category: inputCategory,
        bought: false,
        updated_at: nowIso,
      };

      if (editingId) {
        let { error } = await supabase
          .from('shopping_list')
          .update(payload)
          .eq('id', editingId);

        if (error && (error.message?.includes('quantity') || error.message?.includes('type') || error.message?.includes('category') || error.message?.includes('updated_at'))) {
          delete payload.quantity;
          delete payload.type;
          delete payload.category;
          delete payload.updated_at;
          const res = await supabase.from('shopping_list').update(payload).eq('id', editingId);
          error = res.error;
        }

        if (error) throw error;

        setItems(items.map((i) => (i.id === editingId ? { ...i, ...payload, type: inputType, category: inputCategory, quantity: inputQuantity.trim() || null } : i)));
        setInputName('');
        setInputQuantity('');
        setInputLocation('');
        setInputPrice('');
        setEditingId(null);
        setShowAddForm(false);
        toast.success('Producto actualizado correctamente ✨');
        return;
      }

      let { data, error } = await supabase.from('shopping_list').insert([payload]).select();

      if (error && (error.message?.includes('quantity') || error.message?.includes('type') || error.message?.includes('category') || error.message?.includes('updated_at'))) {
        delete payload.quantity;
        delete payload.type;
        delete payload.category;
        delete payload.updated_at;
        const res = await supabase.from('shopping_list').insert([payload]).select();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      if (data) {
        setItems([{ ...data[0], type: inputType, category: inputCategory, quantity: inputQuantity.trim() || null, updated_at: nowIso }, ...items]);
        setInputName('');
        setInputQuantity('');
        setInputLocation('');
        setInputPrice('');
        setShowAddForm(false);

        // AUTOMATIC FINANZAS LOGGING - ONLY FOR QUINCENAL (NON-EXHAUSTIBLE) ITEMS
        if (itemPrice && itemPrice > 0 && inputType === 'quincenal') {
          await supabase.from('finance_expenses').insert([{
            user_id: user.id,
            concept: `Mandado — ${payload.name}`,
            amount: itemPrice,
            category: inputCategory,
          }]);
          window.dispatchEvent(new Event('ac_finance_changed'));
          toast.success(`💸 $${itemPrice.toLocaleString()} en ${inputCategory === 'comida' ? 'Comida 🍔' : 'Insumos 🛒'} auto-registrado en Finanzas`);
        } else {
          toast.success(`Producto agregado al Mandado (${inputCategory === 'comida' ? 'Comida 🍔' : 'Insumos 🛒'})`);
        }
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  const toggleBought = async (id: string, currentStatus: boolean) => {
    const item = items.find((i) => i.id === id);
    const nowIso = new Date().toISOString();
    const newStatus = !currentStatus;

    // Build new purchase_history array
    let updatedHistory = Array.isArray(item?.purchase_history) ? [...item.purchase_history] : [];
    if (newStatus) {
      // Append current purchase timestamp if marking as bought
      updatedHistory = [nowIso, ...updatedHistory.filter(ts => ts !== nowIso)];
    }

    try {
      let { error } = await supabase
        .from('shopping_list')
        .update({ bought: newStatus, updated_at: nowIso, purchase_history: updatedHistory })
        .eq('id', id);

      if (error && (error.message?.includes('purchase_history') || error.message?.includes('updated_at'))) {
        const fallback = await supabase
          .from('shopping_list')
          .update({ bought: newStatus, updated_at: nowIso })
          .eq('id', id);
        if (fallback.error && fallback.error.message?.includes('updated_at')) {
          await supabase.from('shopping_list').update({ bought: newStatus }).eq('id', id);
        }
      } else if (error) {
        throw error;
      }

      setItems(items.map((i) => (i.id === id ? { ...i, bought: newStatus, updated_at: nowIso, purchase_history: updatedHistory } : i)));

      // AUTOMATIC FINANZAS LOGGING WHEN MARKING MANDADO ITEM AS BOUGHT (ONLY FOR QUINCENAL ITEMS)
      if (newStatus && item && item.price && item.price > 0 && getItemType(item) === 'quincenal') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const cat = getItemCategory(item);
          await supabase.from('finance_expenses').insert([{
            user_id: user.id,
            concept: `Mandado — ${item.name}`,
            amount: item.price,
            category: cat,
          }]);
          window.dispatchEvent(new Event('ac_finance_changed'));
          toast.success(`🛒 Comprado + 💸 $${item.price.toLocaleString()} auto-registrado en Finanzas (${cat === 'comida' ? 'Comida 🍔' : 'Insumos 🛒'})`);
          return;
        }
      }

      toast.info(newStatus ? 'Artículo comprado 🛒' : 'Artículo marcado como pendiente');
    } catch (err: any) {
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const handleMarkAsAgotado = async (id: string) => {
    try {
      const { error } = await supabase.from('shopping_list').update({ bought: false }).eq('id', id);
      if (error) throw error;

      setItems(items.map((i) => (i.id === id ? { ...i, bought: false } : i)));
      toast.info('⚠️ Producto marcado como Agotado. Listo para comprar nuevamente.');
    } catch (err: any) {
      toast.error('Error al marcar como agotado: ' + err.message);
    }
  };

  const handleRenewQuincenal = async () => {
    if (quincenalList.length === 0) {
      toast.info('No tienes artículos en tu Mandado 🥗');
      return;
    }

    try {
      const quincenalIds = quincenalList.map((i) => i.id);
      const { error } = await supabase
        .from('shopping_list')
        .update({ bought: false })
        .in('id', quincenalIds);

      if (error) throw error;

      setItems(items.map((i) => (isMandadoItem(i) ? { ...i, bought: false } : i)));
      toast.success(`🥗 ¡Mandado desmarcado! Todos los productos están listos para la nueva quincena.`);
    } catch (err: any) {
      toast.error('Error al renovar mandado: ' + err.message);
    }
  };

  const handleImportInitialList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    const comidaItems = [
      { name: 'Banana peppers', price: null, bought: false },
      { name: 'Pollo (1 kg/semana)', price: 200, bought: true },
      { name: 'Carne', price: 250, bought: true },
      { name: 'Vino', price: 300, bought: true },
      { name: 'Helado Cookies & Cream', price: 160, bought: true },
      { name: 'Aceite', price: 80, bought: true },
      { name: 'Lata de aceitunas', price: 60, bought: true },
      { name: 'Palmitos', price: 60, bought: true },
      { name: 'Aguacate', price: 60, bought: true },
      { name: 'Queso Panela', price: 54, bought: true },
      { name: 'Lechuga', price: 49, bought: true },
      { name: 'Leche', price: 44, bought: true },
      { name: 'Linaza', price: 38, bought: true },
      { name: 'Jitomate', price: 34, bought: true },
      { name: 'San Pellegrino', price: 33, bought: true },
      { name: 'Yema de huevo / Tetrapack', price: 33, bought: true },
      { name: 'Limón', price: 31, bought: true },
      { name: 'Azúcar', price: 30, bought: true },
      { name: 'Champiñones', price: 30, bought: true },
      { name: 'Plátanos', price: 20, bought: true },
      { name: 'Ajonjolí', price: 17, bought: true },
      { name: 'Tortillas', price: 15, bought: true },
      { name: 'Halls', price: 12, bought: true },
      { name: 'Pepinillos', price: 69, bought: true },
      { name: 'Jitomates deshidratados', price: null, bought: true },
      { name: 'Semillas', price: null, bought: true },
      { name: 'Jengibre', price: null, bought: true },
      { name: 'Gordo lobo té', price: null, bought: true },
      { name: 'Pimiento', price: 89, bought: true },
      { name: 'Garrafón', price: null, bought: true },
      { name: 'Rice papers', price: null, bought: true },
      { name: 'Especias', price: null, bought: true },
      { name: 'Sal', price: null, bought: true },
      { name: 'Cúrcuma', price: null, bought: true },
    ];

    const insumosItems = [
      { name: 'Papel de baño', price: 150, bought: true },
      { name: 'Trapeador', price: 130, bought: true },
      { name: 'Jabón ropa', price: 120, bought: true },
      { name: 'Jabón de trastes', price: 82, bought: true },
      { name: 'Cubeta', price: 80, bought: true },
      { name: 'Servilletas', price: 61, bought: true },
      { name: 'Jabón piso Pinol', price: 60, bought: true },
      { name: 'Bote basura grande', price: 40, bought: true },
      { name: 'Ziplock', price: 35, bought: true },
      { name: 'Guantes', price: 30, bought: true },
      { name: 'Bolsas basura', price: null, bought: true },
      { name: 'Mini bote de basura', price: null, bought: true },
      { name: 'Esponja de trastes', price: null, bought: true },
      { name: 'Spray de baño', price: null, bought: true },
      { name: 'Jabón manos', price: null, bought: true },
      { name: 'Bote jabón trastes', price: null, bought: true },
      { name: 'Encendedores', price: null, bought: false },
      { name: 'Perfume / Perfume gym', price: 400, bought: true },
      { name: 'Enjuague bucal', price: 80, bought: true },
      { name: 'Shampoo', price: 80, bought: true },
      { name: 'Crema facial', price: 72, bought: true },
      { name: 'Crema corporal', price: 70, bought: true },
      { name: 'Pasta de Dientes', price: 60, bought: true },
      { name: 'Cera para pelo', price: 56, bought: true },
      { name: 'Desodorante', price: null, bought: true },
      { name: 'Acondicionador', price: null, bought: true },
      { name: 'Exfoliante', price: null, bought: true },
      { name: 'Minoxidil', price: null, bought: true },
      { name: 'Vitaminas 760', price: null, bought: true },
    ];

    const records = [
      ...comidaItems.map(item => ({
        user_id: user.id,
        name: item.name,
        price: item.price,
        bought: item.bought,
        priority: 'Media',
        location: '🍔 Comida | 🥗 Quincenal',
      })),
      ...insumosItems.map(item => ({
        user_id: user.id,
        name: item.name,
        price: item.price,
        bought: item.bought,
        priority: 'Media',
        location: '🛒 Insumos | 🥗 Quincenal',
      })),
    ];

    try {
      const { data, error } = await supabase.from('shopping_list').insert(records).select();
      if (error) throw error;

      if (data) {
        setItems([...data, ...items]);
        toast.success(`📥 ¡Lista registrada! ${data.length} productos agregados al Mandado`);
      }
    } catch (err: any) {
      toast.error('Error al registrar lista: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    try {
      const { error } = await supabase.from('shopping_list').delete().eq('id', id);
      if (error) throw error;

      setItems(items.filter((i) => i.id !== id));
      
      toast.undoable('Producto eliminado del mandado', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = itemToDelete as any;
          const payload: any = {
            id: itemToDelete.id,
            user_id: user.id,
            ...rest,
          };
          let { error: restoreErr } = await supabase.from('shopping_list').insert([payload]);
          if (restoreErr && (restoreErr.message?.includes('quantity') || restoreErr.message?.includes('type') || restoreErr.message?.includes('category') || restoreErr.message?.includes('updated_at'))) {
            delete payload.quantity;
            delete payload.type;
            delete payload.category;
            delete payload.updated_at;
            const res = await supabase.from('shopping_list').insert([payload]);
            restoreErr = res.error;
          }
          if (restoreErr) throw restoreErr;
          setItems((prev) => [itemToDelete, ...prev]);
          toast.success('Producto del mandado restaurado ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar producto: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-7 h-[92vh] max-h-[850px] max-w-3xl w-full border-none shadow-2xl flex flex-col overflow-hidden my-auto cursor-default"
        >
          {/* ═══ FIXED HEADER SECTION ═══ */}
          <div className="shrink-0 space-y-3.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            {/* Title & Close button */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl shrink-0">🥗</span>
                  <h2 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Mandado Quincenal & Insumos
                  </h2>
                </div>
                <p className="font-inter text-xs text-gray-400 mt-0.5 truncate">
                  Listado de compras recurrente para tu alimentación e insumos de casa.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Progress & Control Buttons Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 sm:p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 w-full">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-syne text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {rawQuincenalList.filter(i => i.bought).length} de {rawQuincenalList.length} comprados
                  </span>
                  {rawQuincenalList.length > 0 && (
                    <span className="text-xs font-dm-sans font-bold text-emerald-600 dark:text-emerald-400">
                      ({Math.round((rawQuincenalList.filter(i => i.bought).length / rawQuincenalList.length) * 100)}%)
                    </span>
                  )}
                </div>
                <div className="w-full max-w-xs bg-emerald-200/60 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${rawQuincenalList.length > 0 ? (rawQuincenalList.filter(i => i.bought).length / rawQuincenalList.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <button
                  onClick={() => {
                    if (showAddForm && editingId) {
                      setEditingId(null);
                      setInputName('');
                      setInputQuantity('');
                      setInputLocation('');
                      setInputPrice('');
                    }
                    setShowAddForm(!showAddForm);
                  }}
                  className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 interactive-hover shrink-0"
                >
                  {showAddForm ? <HiX className="text-sm" /> : <HiOutlinePlus className="text-sm" />}
                  <span>{showAddForm ? (editingId ? 'Cancelar Edición' : 'Ocultar Formulario') : '+ Agregar Producto'}</span>
                </button>

                <button
                  onClick={handleRenewQuincenal}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 interactive-hover shrink-0"
                  title="Desmarca todos los artículos para iniciar una nueva quincena"
                >
                  <HiOutlineRefresh className="text-sm" />
                  <span>Nueva Quincena 🔄</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Tabs Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl overflow-x-auto shrink-0 scrollbar-none">
                {[
                  { key: 'all', label: `Todos (${rawQuincenalList.length})` },
                  { key: 'pending', label: `Pendientes (${rawQuincenalList.filter(i => !i.bought).length})` },
                  { key: 'comida', label: `Comida 🍔` },
                  { key: 'insumos', label: `Insumos 🛒` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1 rounded-lg font-syne text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-xs min-w-[160px]">
                <input
                  type="text"
                  placeholder="Buscar en mandado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400"
                />
                <HiOutlineSearch className="absolute left-2.5 top-1.5 text-xs text-gray-400" />
              </div>
            </div>

            {/* Collapsible Quick Add / Edit Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddItem}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80 w-full relative z-20"
                >
                  <div>
                    <label className="block font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Producto *</label>
                    <input
                      type="text"
                      placeholder="Pechuga, Detergente..."
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Cantidad</label>
                    <input
                      type="text"
                      placeholder="ej. 1, 2, 500g, 1 kg"
                      value={inputQuantity}
                      onChange={(e) => setInputQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Categoría</label>
                    <CustomSelect
                      value={inputCategory}
                      onChange={(val) => setInputCategory(val as 'comida' | 'insumos')}
                      options={[
                        { value: 'comida', label: 'Comida 🍔' },
                        { value: 'insumos', label: 'Insumos 🛒' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Frecuencia</label>
                    <CustomSelect
                      value={inputType}
                      onChange={(val) => setInputType(val as 'quincenal' | 'ocasional')}
                      options={[
                        { value: 'quincenal', label: 'Quincenal 🥗' },
                        { value: 'ocasional', label: 'Hasta Agotar 📦' },
                      ]}
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                    <div>
                      <label className="block font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Precio Total ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00 (Precio total)"
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                      <input
                        type="text"
                        placeholder="Lugar / Tienda (ej. Walmart, Costco)"
                        value={inputLocation}
                        onChange={(e) => setInputLocation(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0 h-[32px]"
                      >
                        {editingId ? <HiOutlinePencil className="text-base" /> : <HiOutlinePlus className="text-base" />}
                        <span>{editingId ? 'Guardar Cambios' : 'Guardar'}</span>
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ═══ SCROLLABLE PRODUCT LIST BODY ═══ */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2 pr-1 w-full touch-pan-y overscroll-contain scrollbar-thin">
            {quincenalList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-gray-400 space-y-1 my-auto">
                <p className="font-dm-sans font-bold text-base text-gray-800 dark:text-gray-200">No hay productos en tu mandado quincenal</p>
                <p className="font-inter text-xs">Presiona "+ Agregar Producto" para registrar más productos.</p>
              </div>
            ) : (
              quincenalList.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all gap-2.5 w-full min-w-0 ${
                    item.bought 
                      ? 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60' 
                      : 'bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 shadow-xs hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <button
                      onClick={() => toggleBought(item.id, item.bought)}
                      className="text-2xl transition-transform active:scale-90 shrink-0 mt-0.5 sm:mt-0"
                      title={item.bought ? 'Marcar como pendiente' : 'Marcar como comprado'}
                    >
                      {item.bought ? (
                        <HiOutlineCheckCircle className="text-emerald-500" />
                      ) : (
                        <MdOutlineCircle className="text-gray-300 dark:text-gray-600 hover:text-emerald-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-dm-sans font-bold text-sm sm:text-base break-words ${
                          item.bought ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.name}
                        </span>

                        {getItemQuantity(item) && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shrink-0">
                            Cant: {getItemQuantity(item)}
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider shrink-0 ${
                          getItemCategory(item) === 'comida'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                        }`}>
                          {getItemCategory(item) === 'comida' ? '🍔 Comida' : '🛒 Insumos'}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider shrink-0 ${
                          getItemType(item) === 'quincenal'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                            : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                        }`}>
                          {getItemType(item) === 'quincenal' ? '🥗 Quincenal' : '📦 Hasta Agotar'}
                        </span>

                        {item.bought && (item.updated_at || item.created_at) && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center gap-1" title="Fecha en que se completó/compró">
                            <span>🗓️</span>
                            <span>
                              {new Date(item.updated_at || item.created_at || '').toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </span>
                        )}
                      </div>

                      {getCleanStoreLocation(item.location) && (
                        <span className="font-inter text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <HiOutlineLocationMarker className="text-xs shrink-0 text-emerald-500" />
                          <span className="truncate">{getCleanStoreLocation(item.location)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap sm:flex-nowrap">
                    {getItemType(item) === 'ocasional' && item.bought && (
                      <button
                        onClick={() => handleMarkAsAgotado(item.id)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg font-syne text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                        title="Marcar producto como consumido/agotado para volverlo a comprar"
                      >
                        <span>⚠️ Agotado</span>
                      </button>
                    )}

                    {item.price !== null && (
                      <span className="font-dm-sans font-bold text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/80 px-2.5 py-1 rounded-lg shrink-0">
                        ${item.price.toLocaleString()}
                      </span>
                    )}

                    <button
                      onClick={() => setHistoryModalItem(item)}
                      className="p-1.5 text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-all shrink-0"
                      title="Ver historial de compras"
                    >
                      <HiOutlineClock className="text-base" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all shrink-0"
                      title="Editar producto"
                    >
                      <HiOutlinePencil className="text-base" />
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0"
                      title="Eliminar del mandado"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ═══ FIXED FOOTER SECTION (ALWAYS VISIBLE) ═══ */}
          <div className="shrink-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full bg-white dark:bg-gray-900">
            <div className="text-xs font-inter text-gray-500 space-y-0.5 min-w-0">
              <div>
                Presupuesto total: <strong className="text-gray-900 dark:text-white font-dm-sans text-sm">${rawQuincenalList.reduce((acc, i) => acc + (i.price || 0), 0).toLocaleString()}</strong>
              </div>
              <div className="truncate text-xs">
                Comida: <strong className="text-amber-600 dark:text-amber-400 font-dm-sans">${rawQuincenalList.filter(i => getItemCategory(i) === 'comida').reduce((acc, i) => acc + (i.price || 0), 0).toLocaleString()}</strong> | Insumos: <strong className="text-indigo-600 dark:text-indigo-400 font-dm-sans">${rawQuincenalList.filter(i => getItemCategory(i) === 'insumos').reduce((acc, i) => acc + (i.price || 0), 0).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 text-center shrink-0"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ NESTED MODAL: PURCHASE HISTORY MODAL ═══ */}
        <AnimatePresence>
          {historyModalItem && (
            <div
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setHistoryModalItem(null);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6 my-auto cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 text-sky-500 rounded-2xl">
                      <HiOutlineClock className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        Historial de Compra
                      </h3>
                      <p className="font-inter text-xs text-gray-400">
                        {historyModalItem.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryModalItem(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <HiX className="text-lg" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Summary Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-syne font-bold uppercase tracking-wider text-gray-400">Estado Actual:</span>
                      <span className={`px-2 py-0.5 rounded-full font-syne text-[10px] font-bold uppercase tracking-wider ${
                        historyModalItem.bought
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
                      }`}>
                        {historyModalItem.bought ? '✓ Comprado' : '⏳ Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-syne font-bold uppercase tracking-wider text-gray-400">Categoría & Tipo:</span>
                      <span className="font-dm-sans font-medium text-gray-700 dark:text-gray-200">
                        {getItemCategory(historyModalItem) === 'comida' ? '🍔 Comida' : '🛒 Insumos'} • {getItemType(historyModalItem) === 'quincenal' ? '🥗 Quincenal' : '📦 Hasta Agotar'}
                      </span>
                    </div>

                    {historyModalItem.price !== null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-syne font-bold uppercase tracking-wider text-gray-400">Precio Registrado:</span>
                        <span className="font-dm-sans font-bold text-gray-900 dark:text-white">
                          ${historyModalItem.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* List of Historical Purchase Dates */}
                  <div className="space-y-2">
                    <h4 className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Fechas Registradas ({
                        (() => {
                          const historyList: string[] = [];
                          if (Array.isArray(historyModalItem.purchase_history)) {
                            historyList.push(...historyModalItem.purchase_history);
                          }
                          if (historyModalItem.updated_at && !historyList.includes(historyModalItem.updated_at)) {
                            historyList.push(historyModalItem.updated_at);
                          }
                          if (historyModalItem.created_at && !historyList.includes(historyModalItem.created_at)) {
                            historyList.push(historyModalItem.created_at);
                          }
                          return historyList.length;
                        })()
                      })
                    </h4>

                    {(() => {
                      const historyList: string[] = [];
                      if (Array.isArray(historyModalItem.purchase_history)) {
                        historyList.push(...historyModalItem.purchase_history);
                      }
                      if (historyModalItem.updated_at && !historyList.includes(historyModalItem.updated_at)) {
                        historyList.push(historyModalItem.updated_at);
                      }
                      if (historyModalItem.created_at && !historyList.includes(historyModalItem.created_at)) {
                        historyList.push(historyModalItem.created_at);
                      }

                      // Sort descending by date
                      const sorted = historyList
                        .filter(Boolean)
                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                      if (sorted.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-gray-400 font-inter bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                            Aún no se registran fechas de compra para este producto.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                          {sorted.map((dateStr, idx) => {
                            const dateObj = new Date(dateStr);
                            const formattedDate = !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleDateString('es-MX', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : dateStr;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="font-dm-sans text-xs font-medium text-gray-800 dark:text-gray-200 truncate capitalize">
                                    {formattedDate}
                                  </span>
                                </div>
                                {idx === 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-syne font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                                    Última compra
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setHistoryModalItem(null)}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 text-center shadow-md"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
}
