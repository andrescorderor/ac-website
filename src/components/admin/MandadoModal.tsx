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
  type?: 'semanal' | 'quincenal' | 'ocasional';
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
  const [inputType, setInputType] = useState<'semanal' | 'ocasional'>('semanal');
  const [inputCategory, setInputCategory] = useState<'comida' | 'insumos'>('comida');
  const [historyModalItem, setHistoryModalItem] = useState<ShoppingItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<ShoppingItem | null>(null);
  const [spentAmount, setSpentAmount] = useState<string>('');
  const [spentQuantity, setSpentQuantity] = useState<string>('');
  const [stockItem, setStockItem] = useState<ShoppingItem | null>(null);
  const [stockValue, setStockValue] = useState<string>('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);

  // Request screen wake lock when entering Focus Mode (prevent screen from turning off in supermarket)
  useEffect(() => {
    if (isFocusMode && 'wakeLock' in navigator) {
      (navigator as any).wakeLock?.request('screen')
        .then((lock: any) => {
          setWakeLock(lock);
        })
        .catch(() => {});
    } else if (!isFocusMode && wakeLock) {
      wakeLock.release().catch(() => {});
      setWakeLock(null);
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isFocusMode]);

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
    if (item.type === 'semanal' || item.type === 'quincenal' || item.type === 'ocasional') return true;
    if (item.category === 'semanal' || item.category === 'quincenal' || item.category === 'ocasional' || item.category === 'comida' || item.category === 'insumos') return true;
    if (
      item.location?.includes('Semanal') ||
      item.location?.includes('Quincenal') ||
      item.location?.includes('Agotar') ||
      item.location?.includes('Agotamiento') ||
      item.location?.includes('Mandado') ||
      item.location?.includes('Comida') ||
      item.location?.includes('Insumos') ||
      item.location?.includes('🍔') ||
      item.location?.includes('🛒') ||
      item.location?.includes('🥗') ||
      item.location?.includes('📦')
    ) return true;
    return false;
  };

  const getItemType = (item: ShoppingItem): 'semanal' | 'ocasional' => {
    if (item.type === 'semanal' || item.type === 'quincenal') return 'semanal';
    if (item.type === 'ocasional') return 'ocasional';
    if (item.category === 'semanal' || item.category === 'quincenal') return 'semanal';
    if (item.category === 'ocasional') return 'ocasional';
    if (item.location?.includes('Semanal') || item.location?.includes('Quincenal') || item.name.includes('[Semanal]') || item.name.includes('[Quincenal]')) return 'semanal';
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
    if (
      location.startsWith('🍔') ||
      location.startsWith('🛒') ||
      location.includes('Semanal') ||
      location.includes('Quincenal') ||
      location.includes('Agotar') ||
      location.includes('Agotamiento')
    ) {
      return null;
    }
    return location.trim();
  };

  const allMandado = items.filter(isMandadoItem);

  // Normalize diacritics / accents for seamless searching (eg. platano matches Plátanos, limon matches Limón)
  const normalize = (s: string | null | undefined) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Filter out any duplicates with identical product names
  const rawQuincenalList = allMandado.filter((item, index, self) =>
    index === self.findIndex((t) => t.name.trim().toLowerCase() === item.name.trim().toLowerCase())
  );

  const normSearch = normalize(searchTerm.trim());

  const quincenalList = rawQuincenalList
    .filter((item) => {
      const matchesSearch =
        !normSearch ||
        normalize(item.name).includes(normSearch) ||
        (item.location && normalize(item.location).includes(normSearch));
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
      const freqText = inputType === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar';
      const locText = storeText
        ? `${catText} | ${freqText}${cantText} — ${storeText}`
        : `${catText} | ${freqText}${cantText}`;

      const itemPrice = inputPrice ? parseFloat(inputPrice) : null;
      const nowIso = new Date().toISOString();

      const existingItem = editingId ? items.find((i) => i.id === editingId) : null;
      const payload: any = {
        user_id: user.id,
        name: inputName.trim(),
        location: locText,
        price: itemPrice,
        quantity: inputQuantity.trim() || null,
        priority: 'Media',
        type: inputType,
        category: inputCategory,
        bought: existingItem ? existingItem.bought : false,
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

        setItems(items.map((i) => (i.id === editingId ? { ...i, ...payload, type: inputType, category: inputCategory, quantity: inputQuantity.trim() || null, bought: existingItem ? existingItem.bought : i.bought } : i)));
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
        toast.success(`Producto agregado al Mandado (${inputCategory === 'comida' ? 'Comida 🍔' : 'Insumos 🛒'})`);
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  const handleInitiateBuy = (item: ShoppingItem) => {
    setBuyingItem(item);
    setSpentAmount(item.price !== null && item.price !== undefined ? String(item.price) : '');
    setSpentQuantity('');
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingItem) return;

    const parsedPrice = spentAmount ? parseFloat(spentAmount) : (buyingItem.price || 0);
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    const boughtQty = spentQuantity.trim();
    const prevStock = (getItemQuantity(buyingItem) || '').trim();
    const newStock = !boughtQty
      ? prevStock
      : !prevStock || prevStock === '0'
        ? boughtQty
        : /^\d+(\.\d+)?$/.test(prevStock) && /^\d+(\.\d+)?$/.test(boughtQty)
          ? String(parseFloat(prevStock) + parseFloat(boughtQty))
          : `${prevStock} + ${boughtQty}`;
    const cantText = newStock ? ` | Cant: ${newStock}` : '';
    const cleanStore = getCleanStoreLocation(buyingItem.location);
    const catText = getItemCategory(buyingItem) === 'comida' ? '🍔 Comida' : '🛒 Insumos';
    const freqText = getItemType(buyingItem) === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar';
    const updatedLocation = cleanStore
      ? `${catText} | ${freqText}${cantText} — ${cleanStore}`
      : `${catText} | ${freqText}${cantText}`;

    // Update purchase_history
    let updatedHistory = Array.isArray(buyingItem.purchase_history) ? [...buyingItem.purchase_history] : [];
    updatedHistory = [nowIso, ...updatedHistory.filter(ts => ts !== nowIso)];

    try {
      const payload: any = {
        bought: true,
        price: parsedPrice,
        quantity: newStock || null,
        location: updatedLocation,
        updated_at: nowIso,
        purchase_history: updatedHistory,
      };

      let { error } = await supabase
        .from('shopping_list')
        .update(payload)
        .eq('id', buyingItem.id);

      if (error && (error.message?.includes('quantity') || error.message?.includes('purchase_history') || error.message?.includes('updated_at'))) {
        delete payload.quantity;
        delete payload.purchase_history;
        delete payload.updated_at;
        const res = await supabase.from('shopping_list').update(payload).eq('id', buyingItem.id);
        error = res.error;
      }

      if (error) throw error;

      // Update state
      setItems(items.map(i => i.id === buyingItem.id ? {
        ...i,
        bought: true,
        price: parsedPrice,
        quantity: newStock || null,
        location: updatedLocation,
        updated_at: nowIso,
        purchase_history: updatedHistory,
      } : i));

      // Register real purchase expense in finance_expenses
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cat = getItemCategory(buyingItem);
        const qtySuffix = spentQuantity.trim() ? ` (${spentQuantity.trim()})` : '';
        const concept = `Mandado — ${buyingItem.name}${qtySuffix}`;

        const expensePayload: any = {
          user_id: user.id,
          concept,
          amount: parsedPrice,
          category: cat,
          created_at: new Date(todayDate + 'T12:00:00Z').toISOString(),
        };

        // Try inserting with date column, fallback without date if column does not exist in Supabase
        const { error: insErr } = await supabase.from('finance_expenses').insert([{
          ...expensePayload,
          date: todayDate,
        }]);

        if (insErr) {
          // Fallback without date column
          await supabase.from('finance_expenses').insert([expensePayload]);
        }

        window.dispatchEvent(new Event('ac_finance_changed'));
      }

      toast.success(`🛒 Comprado: $${parsedPrice.toLocaleString()} registrado en Finanzas`);
      setBuyingItem(null);
    } catch (err: any) {
      toast.error('Error al registrar compra: ' + err.message);
    }
  };

  const toggleBought = async (id: string, currentStatus: boolean) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // If currently pending, opening checkoff dialog to ask for amount & quantity
    if (!currentStatus) {
      handleInitiateBuy(item);
      return;
    }

    // Unmarking (returning to pending): ask how much is left at home
    setStockItem(item);
    setStockValue(getItemQuantity(item) || '');
  };

  const handleConfirmStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;
    const id = stockItem.id;
    const stock = stockValue.trim();
    const nowIso = new Date().toISOString();
    const cleanStore = getCleanStoreLocation(stockItem.location);
    const catText = getItemCategory(stockItem) === 'comida' ? '🍔 Comida' : '🛒 Insumos';
    const freqText = getItemType(stockItem) === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar';
    const cantText = stock ? ` | Cant: ${stock}` : '';
    const newLocation = cleanStore
      ? `${catText} | ${freqText}${cantText} — ${cleanStore}`
      : `${catText} | ${freqText}${cantText}`;
    try {
      const payload: any = { bought: false, quantity: stock || null, location: newLocation, updated_at: nowIso };
      let { error } = await supabase.from('shopping_list').update(payload).eq('id', id);
      if (error && (error.message?.includes('quantity') || error.message?.includes('updated_at'))) {
        delete payload.quantity;
        delete payload.updated_at;
        const res = await supabase.from('shopping_list').update(payload).eq('id', id);
        error = res.error;
      }
      if (error) throw error;
      setItems(items.map((i) => (i.id === id ? { ...i, bought: false, quantity: stock || null, location: newLocation, updated_at: nowIso } as any : i)));
      toast.info(stock ? `Pendiente · te quedan ${stock} ⏳` : 'Producto devuelto a pendientes ⏳');
      setStockItem(null);
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

  const handleRenewWeekly = async () => {
    if (quincenalList.length === 0) {
      toast.info('No tienes artículos en tu Mandado 🥗');
      return;
    }

    try {
      const weeklyIds = quincenalList.map((i) => i.id);
      const { error } = await supabase
        .from('shopping_list')
        .update({ bought: false })
        .in('id', weeklyIds);

      if (error) throw error;

      setItems(items.map((i) => (isMandadoItem(i) ? { ...i, bought: false } : i)));
      toast.success(`🥗 ¡Mandado desmarcado! Todos los productos están listos para la nueva semana.`);
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
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer transition-all ${
          isFocusMode ? 'p-0 sm:p-0' : 'p-2 sm:p-6 overflow-y-auto'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-white dark:bg-gray-900 border-none shadow-2xl flex flex-col overflow-hidden cursor-default transition-all duration-300 ${
            isFocusMode
              ? 'fixed inset-0 h-screen w-screen max-w-none max-h-none rounded-none p-4 sm:p-6 z-[9999]'
              : 'rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-7 h-[92vh] max-h-[850px] max-w-3xl w-full my-auto'
          }`}
        >
          {/* ═══ FIXED HEADER SECTION ═══ */}
          <div className="shrink-0 space-y-3.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            {/* Title & Close button */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl shrink-0">🥗</span>
                  <h2 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Mandado Semanal & Insumos
                  </h2>
                </div>
                <p className="font-inter text-xs text-gray-400 mt-0.5 truncate">
                  Listado de compras recurrente para tu alimentación semanal e insumos de casa.
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 sm:p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 w-full">
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

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`px-3 py-1.5 font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 interactive-hover shrink-0 ${
                    isFocusMode
                      ? 'bg-amber-500 text-white animate-pulse shadow-amber-500/20'
                      : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40'
                  }`}
                  title={isFocusMode ? 'Desactivar Modo Supermercado' : 'Activar Modo Supermercado (Diseñado para comprar en el súper)'}
                >
                  <span>{isFocusMode ? '🛒 Modo Normal' : '⚡ Modo Súper'}</span>
                </button>

                {!isFocusMode && (
                  <>
                    <button
                      type="button"
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
                      className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 interactive-hover shrink-0"
                    >
                      {showAddForm ? <HiX className="text-sm" /> : <HiOutlinePlus className="text-sm" />}
                      <span>{showAddForm ? (editingId ? 'Cancelar' : 'Ocultar') : '+ Producto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRenewWeekly}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 interactive-hover shrink-0"
                      title="Desmarca todos los artículos para iniciar una nueva semana"
                    >
                      <HiOutlineRefresh className="text-sm" />
                      <span>Renovar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search & Filter Tabs Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl overflow-x-auto shrink-0 scrollbar-none max-w-full">
                {[
                  { key: 'all', label: `Todos (${rawQuincenalList.length})` },
                  { key: 'pending', label: `Pendientes (${rawQuincenalList.filter(i => !i.bought).length})` },
                  { key: 'comida', label: `Comida 🍔` },
                  { key: 'insumos', label: `Insumos 🛒` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
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

              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Buscar en mandado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                />
                <HiOutlineSearch className="absolute left-2.5 top-2 text-xs text-gray-400" />
              </div>
            </div>

            {/* Collapsible Quick Add / Edit Form */}
            <AnimatePresence>
              {showAddForm && !isFocusMode && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddItem}
                  className="overflow-hidden bg-gray-50/90 dark:bg-gray-800/90 p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-syne text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                      {editingId ? '✏️ Editar Producto' : '✨ Nuevo Producto'}
                    </span>
                    {editingId && (
                      <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-amber-500">
                        Modo Edición
                      </span>
                    )}
                  </div>

                  <div className={`grid gap-2.5 ${editingId ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                    <div className={`${editingId ? 'sm:col-span-2' : 'sm:col-span-2'} space-y-1`}>
                      <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Claras de Huevo San Juan"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                      />
                    </div>

                    {editingId && (
                      <div className="space-y-1">
                        <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          Tengo actualmente
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. 1 Litro, 500g, 2 paq"
                          value={inputQuantity}
                          onChange={(e) => setInputQuantity(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Tienda / Pasillo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Walmart, Costco, Frutería"
                        value={inputLocation}
                        onChange={(e) => setInputLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div className="space-y-1">
                      <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Categoría *
                      </label>
                      <CustomSelect
                        value={inputCategory}
                        onChange={(val) => setInputCategory(val as any)}
                        options={[
                          { value: 'comida', label: '🍔 Comida & Despensa' },
                          { value: 'insumos', label: '🛒 Insumos & Limpieza' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Tipo de Compra *
                      </label>
                      <CustomSelect
                        value={inputType}
                        onChange={(val) => setInputType(val as any)}
                        options={[
                          { value: 'semanal', label: '🥗 Semanal (Recurrente)' },
                          { value: 'ocasional', label: '📦 Hasta Agotar (Ocasional)' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          Precio Estimado ($)
                        </label>
                        {inputPrice && (
                          <span className="font-syne text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            {inputType === 'semanal' ? `×4 mensual: $${(parseFloat(inputPrice) * 4 || 0).toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Ej. 65"
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-inter text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId(null);
                      }}
                      className="px-4 py-1.5 text-xs font-syne font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1 shrink-0"
                    >
                      {editingId ? <HiOutlinePencil className="text-base" /> : <HiOutlinePlus className="text-base" />}
                      <span>{editingId ? 'Guardar Cambios' : 'Guardar'}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ═══ SCROLLABLE PRODUCT LIST BODY ═══ */}
          <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-2 pr-1 w-full touch-pan-y overscroll-contain scrollbar-thin">
            {quincenalList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-gray-400 space-y-1 my-auto">
                <p className="font-dm-sans font-bold text-base text-gray-800 dark:text-gray-200">No hay productos en tu mandado semanal</p>
                <p className="font-inter text-xs">Presiona "+ Producto" para registrar más productos.</p>
              </div>
            ) : isFocusMode ? (
              /* 🛒 SUPERMARKET FOCUS MODE: High touch targets, zero clutter, easy one-hand checkoff */
              quincenalList.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  onClick={() => toggleBought(item.id, item.bought)}
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                    item.bought
                      ? 'bg-gray-100/60 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-800 opacity-40 line-through'
                      : 'bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-800 shadow-md hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 overflow-hidden">
                    <div className="text-3xl sm:text-4xl shrink-0">
                      {item.bought ? (
                        <HiOutlineCheckCircle className="text-emerald-500" />
                      ) : (
                        <div className="size-8 rounded-full border-2 border-emerald-500 flex items-center justify-center text-transparent hover:text-emerald-500 transition-all">
                          ✓
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getItemQuantity(item) && (
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Tengo: {getItemQuantity(item)}
                          </span>
                        )}
                        {getCleanStoreLocation(item.location) && (
                          <span className="flex items-center gap-1 font-medium truncate">
                            📍 {getCleanStoreLocation(item.location)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    {item.price !== null && (
                      <span className="font-syne font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/80 px-2.5 py-1 rounded-xl">
                        ${item.price}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              /* 📋 REGULAR MODE WITH FULL EDIT CONTROLS */
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
                      type="button"
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
                            Tengo: {getItemQuantity(item)}
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
                          getItemType(item) === 'semanal'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                            : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                        }`}>
                          {getItemType(item) === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar'}
                        </span>
                      </div>

                      {getCleanStoreLocation(item.location) && (
                        <span className="font-inter text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <HiOutlineLocationMarker className="text-xs shrink-0 text-emerald-500" />
                          <span className="truncate">{getCleanStoreLocation(item.location)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 justify-end flex-wrap sm:flex-nowrap">
                    {getItemType(item) === 'ocasional' && item.bought && (
                      <button
                        type="button"
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
                      type="button"
                      onClick={() => setHistoryModalItem(item)}
                      className="p-1.5 text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-all shrink-0"
                      title="Ver historial de compras"
                    >
                      <HiOutlineClock className="text-base" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all shrink-0"
                      title="Editar producto"
                    >
                      <HiOutlinePencil className="text-base" />
                    </button>

                    <button
                      type="button"
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
                        {getItemCategory(historyModalItem) === 'comida' ? '🍔 Comida' : '🛒 Insumos'} • {getItemType(historyModalItem) === 'semanal' ? '🥗 Semanal' : '📦 Hasta Agotar'}
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

        {/* ═══ MODAL: CHECK-OFF PURCHASE IN SUPERMARKET (MODO SÚPER) ═══ */}
        <AnimatePresence>
          {buyingItem && (
            <div
              className="fixed inset-0 z-[100001] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setBuyingItem(null);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-h-[90vh] overflow-y-auto max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-5 my-auto cursor-default"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                      <HiOutlineCheckCircle className="text-2xl" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                        Tachar como Comprado
                      </span>
                      <h3 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                        {buyingItem.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBuyingItem(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleConfirmPurchase} className="space-y-4">
                  {/* Input 1: ¿Cuánto estás gastando? */}
                  <div className="space-y-1.5">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center justify-between">
                      <span>¿Cuánto estás gastando? ($) *</span>
                      {buyingItem.price !== null && (
                        <span className="text-gray-400 dark:text-gray-500 normal-case font-inter text-[10px]">
                          Estimado: ${buyingItem.price}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-dm-sans font-bold text-lg text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        autoFocus
                        required
                        placeholder="0.00"
                        value={spentAmount}
                        onChange={(e) => setSpentAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none font-dm-sans text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="font-inter text-[11px] text-gray-400">
                      Este gasto se registrará directamente en tu módulo de Finanzas.
                    </p>
                  </div>

                  {/* Input 2: ¿Qué cantidad compraste? */}
                  <div className="space-y-1.5">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      ¿Cuánto compraste?{getItemQuantity(buyingItem) ? ` (tienes ${getItemQuantity(buyingItem)})` : ''}
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 1 kg, 2 paquetes, 500g, 1 litro..."
                      value={spentQuantity}
                      onChange={(e) => setSpentQuantity(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none font-inter text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 transition-all"
                    />
                    {/* Quick Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['1 pza', '2 pzas', '1 kg', '1/2 kg', '1 paq', '2 paq', '1 litro'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setSpentQuantity(chip)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-gray-600 dark:text-gray-300 rounded-xl font-syne text-[10px] font-bold transition-all border border-gray-200/50 dark:border-gray-700/50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBuyingItem(null)}
                      className="w-full sm:w-auto px-5 py-3 text-xs font-syne font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-center order-2 sm:order-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 min-h-[48px] px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <HiOutlineCheckCircle className="text-xl" />
                      <span>Confirmar Compra</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ MODAL: STOCK ACTUAL AL DESMARCAR ═══ */}
        <AnimatePresence>
          {stockItem && (
            <div
              className="fixed inset-0 z-[100001] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
              onClick={(e) => { if (e.target === e.currentTarget) setStockItem(null); }}
            >
              <motion.form
                onSubmit={handleConfirmStock}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] max-h-[90vh] max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="min-w-0">
                    <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">Volver a pendientes</span>
                    <h3 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white truncate">{stockItem.name}</h3>
                  </div>
                  <button type="button" onClick={() => setStockItem(null)} className="cursor-pointer size-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
                    <HiX className="text-xl" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-3">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">¿Cuánto tienes actualmente?</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. 1, 2 litros, medio paquete..."
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none font-inter text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['0', '1', '2', '3', 'Poco'].map((chip) => (
                      <button key={chip} type="button" onClick={() => setStockValue(chip)} className="cursor-pointer min-h-[40px] px-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-600 dark:text-gray-300 rounded-xl font-syne text-xs font-bold border border-gray-200/50 dark:border-gray-700/50">
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex gap-3 p-5 sm:p-6 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => setStockItem(null)} className="cursor-pointer min-h-[48px] px-5 text-xs font-syne font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">Cancelar</button>
                  <button type="submit" className="cursor-pointer flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl">Guardar</button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
}
