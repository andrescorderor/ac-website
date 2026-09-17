import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineSearch, 
  HiX,
  HiOutlineCheckCircle,
  HiCheckCircle,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineScale
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';

export type DebtType = 'receivable' | 'payable';

export type Debt = {
  id: string;
  debtor_name: string;
  amount: number;
  concept: string | null;
  settled: boolean;
  type?: DebtType;
  created_at: string;
};

type StatusFilter = 'pending' | 'settled' | 'all';
type CategoryFilter = 'all' | 'receivable' | 'payable';
type ViewMode = 'cards' | 'table';

/**
 * Detecta el tipo de deuda de forma resiliente considerando la columna 'type'
 * o prefijos en el campo 'concept' si la columna aún no está en la base de datos.
 */
export function getDebtType(debt: Debt): DebtType {
  if (debt.type === 'payable' || debt.type === 'receivable') {
    return debt.type;
  }
  if (debt.concept && debt.concept.startsWith('[Yo Debo]')) {
    return 'payable';
  }
  return 'receivable';
}

/**
 * Remueve prefijos internos de metadatos del concepto para una visualización limpia
 */
export function getCleanConcept(concept: string | null): string {
  if (!concept) return '';
  return concept.replace(/^\[(Yo Debo|Me Deben)\]\s*/i, '');
}

export default function Deudas() {
  const [searchParams] = useSearchParams();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState<{
    debtor_name: string;
    amount: string;
    concept: string;
    type: DebtType;
  }>({
    debtor_name: '',
    amount: '',
    concept: '',
    type: 'receivable',
  });

  // Filters & View state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const { toast } = useToast();

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      if (queryParam) setStatusFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar deudas: ' + error.message);
    else if (data) setDebts(data);
    setLoading(false);
  };

  const handleOpenAddModal = (defaultType?: DebtType) => {
    setEditingDebt(null);
    setFormData({
      debtor_name: '',
      amount: '',
      concept: '',
      type: defaultType || (categoryFilter === 'payable' ? 'payable' : 'receivable'),
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      debtor_name: debt.debtor_name,
      amount: debt.amount.toString(),
      concept: getCleanConcept(debt.concept),
      type: getDebtType(debt),
    });
    setShowModal(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.debtor_name.trim() || !formData.amount) {
      toast.error('El nombre y monto son obligatorios');
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Ingresa un monto válido mayor a 0');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    try {
      const cleanConcept = formData.concept.trim();

      if (editingDebt) {
        // MODO EDICIÓN
        try {
          // Intento nativo con columna 'type'
          const { data, error } = await supabase
            .from('debts')
            .update({
              debtor_name: formData.debtor_name.trim(),
              concept: cleanConcept || null,
              amount: parsedAmount,
              type: formData.type,
            })
            .eq('id', editingDebt.id)
            .select();

          if (error) throw error;
          if (data && data[0]) {
            setDebts(debts.map((d) => (d.id === editingDebt.id ? { ...data[0], type: formData.type } : d)));
            toast.success('Registro actualizado correctamente');
            setShowModal(false);
          }
        } catch (err: any) {
          // Fallback defensivo si la columna 'type' no existe en Supabase
          if (err.code === 'PGRST204' || err.message?.includes('type')) {
            const fallbackConcept = formData.type === 'payable'
              ? `[Yo Debo] ${cleanConcept}`.trim()
              : cleanConcept || null;

            const { data, error: fbErr } = await supabase
              .from('debts')
              .update({
                debtor_name: formData.debtor_name.trim(),
                concept: fallbackConcept,
                amount: parsedAmount,
              })
              .eq('id', editingDebt.id)
              .select();

            if (fbErr) throw fbErr;
            if (data && data[0]) {
              setDebts(debts.map((d) => (d.id === editingDebt.id ? { ...data[0], type: formData.type } : d)));
              toast.success('Registro actualizado');
              setShowModal(false);
            }
          } else {
            throw err;
          }
        }
      } else {
        // MODO CREACIÓN
        try {
          // Intento nativo con columna 'type'
          const { data, error } = await supabase
            .from('debts')
            .insert([
              {
                user_id: user.id,
                debtor_name: formData.debtor_name.trim(),
                concept: cleanConcept || null,
                amount: parsedAmount,
                settled: false,
                type: formData.type,
              },
            ])
            .select();

          if (error) throw error;
          if (data && data[0]) {
            setDebts([{ ...data[0], type: formData.type }, ...debts]);
            toast.success(
              formData.type === 'payable' 
                ? 'Deuda por pagar registrada' 
                : 'Cuenta por cobrar registrada'
            );
            setShowModal(false);
          }
        } catch (err: any) {
          // Fallback defensivo si la columna 'type' no existe en Supabase
          if (err.code === 'PGRST204' || err.message?.includes('type')) {
            const fallbackConcept = formData.type === 'payable'
              ? `[Yo Debo] ${cleanConcept}`.trim()
              : cleanConcept || null;

            const { data, error: fbErr } = await supabase
              .from('debts')
              .insert([
                {
                  user_id: user.id,
                  debtor_name: formData.debtor_name.trim(),
                  concept: fallbackConcept,
                  amount: parsedAmount,
                  settled: false,
                },
              ])
              .select();

            if (fbErr) throw fbErr;
            if (data && data[0]) {
              setDebts([{ ...data[0], type: formData.type }, ...debts]);
              toast.success(
                formData.type === 'payable' 
                  ? 'Deuda por pagar registrada' 
                  : 'Cuenta por cobrar registrada'
              );
              setShowModal(false);
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Marcar cuenta como cobrada/pagada con soporte de Deshacer (Undo)
   */
  const toggleSettled = async (id: string, currentStatus: boolean, debtorName?: string, amount?: number, debtType: DebtType = 'receivable') => {
    const nextStatus = !currentStatus;
    const previousDebts = [...debts];

    // Actualización optimista inmediata en la UI
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, settled: nextStatus } : d)));

    try {
      const { error } = await supabase.from('debts').update({ settled: nextStatus }).eq('id', id);
      if (error) throw error;

      const formattedAmount = amount ? `$${amount.toLocaleString()}` : '';
      const name = debtorName || 'el registro';
      const isPayable = debtType === 'payable';

      if (nextStatus) {
        // Se marcó como resuelta (Cobrada o Pagada) -> Toast con Deshacer
        const message = isPayable
          ? `¡Pago de ${formattedAmount} a ${name} registrado! 💳`
          : `¡Cobro de ${formattedAmount} a ${name} registrado! 💰`;

        toast.undoable(message, async () => {
          try {
            await supabase.from('debts').update({ settled: false }).eq('id', id);
            setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, settled: false } : d)));
            toast.info(`${isPayable ? 'Deuda' : 'Cuenta'} con ${name} reabierta como pendiente ↩️`);
          } catch (err: any) {
            toast.error('Error al deshacer acción: ' + err.message);
          }
        });
      } else {
        // Se reabrió
        toast.info(`${isPayable ? 'Deuda' : 'Cuenta'} con ${name} reabierta como pendiente ⏳`);
      }
    } catch (err: any) {
      // Revertir estado si falló la red
      setDebts(previousDebts);
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const deleteDebt = async (id: string) => {
    const debtToDelete = debts.find((d) => d.id === id);
    if (!debtToDelete) return;

    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;

      setDebts((prev) => prev.filter((d) => d.id !== id));
      
      toast.undoable('Registro eliminado', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = debtToDelete as any;
          const { error: restoreErr } = await supabase.from('debts').insert([{
            id: debtToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchDebts();
          toast.success('Registro restaurado ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar registro: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar registro: ' + err.message);
    }
  };

  // Cálculos financieros separados por categoría
  const receivables = debts.filter((d) => getDebtType(d) === 'receivable');
  const payables = debts.filter((d) => getDebtType(d) === 'payable');

  // Cuentas por Cobrar (Me deben)
  const pendingReceivables = receivables.filter((d) => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);
  const settledReceivables = receivables.filter((d) => d.settled).reduce((acc, curr) => acc + curr.amount, 0);

  // Cuentas por Pagar (Yo debo)
  const pendingPayables = payables.filter((d) => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);
  const settledPayables = payables.filter((d) => d.settled).reduce((acc, curr) => acc + curr.amount, 0);

  // Balance Neto Pendiente = Me Deben - Yo Debo
  const netBalance = pendingReceivables - pendingPayables;

  // Normalizador insensible a acentos
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Filtrado compuesto (Categoría + Estado + Búsqueda)
  const filteredDebts = debts.filter((d) => {
    const dType = getDebtType(d);
    
    // Filtro por categoría (Me deben vs Yo debo)
    const matchesCategory = 
      categoryFilter === 'all' 
        ? true 
        : dType === categoryFilter;

    // Filtro por estado (Pendiente vs Saldada)
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !d.settled
        : d.settled;

    // Filtro por búsqueda
    const normalizedSearch = normalize(searchTerm.trim());
    const cleanConcept = getCleanConcept(d.concept);
    const matchesSearch =
      !normalizedSearch ||
      normalize(d.debtor_name).includes(normalizedSearch) ||
      (cleanConcept && normalize(cleanConcept).includes(normalizedSearch));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-3xl" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10 pb-28 sm:pb-20 max-w-7xl mx-auto">
      {/* ═══ Header ═══ */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Deudas y <span className="text-gradient">Cobros</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Control integral de cuentas por cobrar (te deben) y deudas por pagar (debes a otros).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botón Nueva Deuda */}
          <button
            onClick={() => handleOpenAddModal()}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            <HiOutlinePlus className="text-lg shrink-0" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </header>

      {/* ═══ Tarjetas de Métricas y Balance Neto ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Me Deben (Por Cobrar) */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'receivable' ? 'all' : 'receivable')}
          className={`cursor-pointer bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-5 rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md ${
            categoryFilter === 'receivable'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-gray-200/50 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <HiOutlineTrendingUp className="text-sm" />
              Me Deben (Por Cobrar)
            </span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ${pendingReceivables.toLocaleString()}
          </p>
          <p className="font-inter text-[11px] text-gray-400 mt-1">
            {receivables.filter(d => !d.settled).length} cuentas pendientes · ${settledReceivables.toLocaleString()} ya cobrado
          </p>
        </div>

        {/* Card 2: Yo Debo (Por Pagar) */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'payable' ? 'all' : 'payable')}
          className={`cursor-pointer bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-5 rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md ${
            categoryFilter === 'payable'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-gray-200/50 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <HiOutlineTrendingDown className="text-sm" />
              Yo Debo (Por Pagar)
            </span>
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            ${pendingPayables.toLocaleString()}
          </p>
          <p className="font-inter text-[11px] text-gray-400 mt-1">
            {payables.filter(d => !d.settled).length} deudas pendientes · ${settledPayables.toLocaleString()} ya pagado
          </p>
        </div>

        {/* Card 3: Balance Neto */}
        <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-5 rounded-3xl border border-gray-200/50 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
              <HiOutlineScale className="text-sm" />
              Balance Neto Pendiente
            </span>
            <span className={`text-[10px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              netBalance >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              {netBalance >= 0 ? 'A tu favor' : 'En contra'}
            </span>
          </div>
          <p className={`font-dm-sans text-2xl sm:text-3xl font-extrabold ${
            netBalance >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
          }`}>
            {netBalance >= 0 ? `+$${netBalance.toLocaleString()}` : `-$${Math.abs(netBalance).toLocaleString()}`}
          </p>
          <p className="font-inter text-[11px] text-gray-400 mt-1">
            Diferencia entre lo que te deben y lo que debes
          </p>
        </div>
      </div>

      {/* ═══ Pestañas Principales de Categoría (Me Deben / Yo Debo / Todas) ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Selector de Categoría */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Todas ({debts.length})
          </button>
          <button
            onClick={() => setCategoryFilter('receivable')}
            className={`px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'receivable'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <span className="size-2 rounded-full bg-current" />
            Me Deben ({receivables.length})
          </button>
          <button
            onClick={() => setCategoryFilter('payable')}
            className={`px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'payable'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <span className="size-2 rounded-full bg-current" />
            Yo Debo ({payables.length})
          </button>
        </div>

        {/* Filtro de Estado (Pendientes / Saldadas) y Buscador */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subfiltro de Estado */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-800 shrink-0">
            {[
              { id: 'pending', label: 'Pendientes' },
              { id: 'settled', label: 'Saldadas' },
              { id: 'all', label: 'Todos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all ${
                  statusFilter === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Buscar nombre o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[40px]"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          </div>

          {/* Selector Vista Tarjetas / Tabla (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Vista en Tarjetas"
            >
              <HiOutlineViewGrid className="text-lg" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Vista en Tabla"
            >
              <HiOutlineViewList className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Listado: Vista de Tarjetas (Cards) o Vista de Tabla ═══ */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2.5rem] p-12 text-center border border-gray-200/50 dark:border-gray-800 shadow-sm space-y-4">
          <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl text-gray-400 mx-auto">
            <HiOutlineScale />
          </div>
          <div>
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">
              No hay registros en esta sección
            </p>
            <p className="font-inter text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto mt-1">
              {categoryFilter === 'payable'
                ? '¡Genial! No tienes deudas por pagar pendientes.'
                : categoryFilter === 'receivable'
                ? 'No tienes cuentas por cobrar pendientes.'
                : 'No se encontraron registros con los filtros seleccionados.'}
            </p>
          </div>
          <button
            onClick={() => handleOpenAddModal(categoryFilter === 'payable' ? 'payable' : 'receivable')}
            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <HiOutlinePlus className="text-base" />
            <span>Crear Registro</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ─── VISTA DE TARJETAS (Cards Grid) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredDebts.map((debt) => {
              const dType = getDebtType(debt);
              const isPayable = dType === 'payable';
              const cleanConcept = getCleanConcept(debt.concept);
              const initials = debt.debtor_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative flex flex-col justify-between p-5 sm:p-6 bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] border transition-all duration-300 shadow-xs hover:shadow-xl ${
                    debt.settled
                      ? 'border-gray-200/50 dark:border-gray-800 opacity-75'
                      : isPayable
                      ? 'border-rose-500/30 dark:border-rose-500/20 bg-rose-500/[0.015] hover:border-rose-500/50'
                      : 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.015] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Avatar, Deudor/Acreedor, Tags y Acciones */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`size-11 rounded-2xl flex items-center justify-center font-syne text-xs font-bold shrink-0 shadow-xs ${
                            debt.settled
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              : isPayable
                              ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white'
                              : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white'
                          }`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isPayable
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isPayable ? 'Yo Debo' : 'Me Deben'}
                            </span>
                            {debt.settled && (
                              <span className="text-[9px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                                Saldada
                              </span>
                            )}
                          </div>
                          <h3 className="font-dm-sans font-bold text-lg text-gray-900 dark:text-white truncate mt-1" title={debt.debtor_name}>
                            {debt.debtor_name}
                          </h3>
                        </div>
                      </div>

                      {/* Acciones Secundarias (Fijar, Editar, Eliminar) */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            const isNowPinned = togglePinItem({
                              id: debt.id,
                              type: 'debt',
                              title: `${debt.debtor_name} ($${debt.amount})`,
                              subtitle: cleanConcept || (isPayable ? 'Deuda por pagar' : 'Cuenta por cobrar'),
                              path: '/admin/panel/deudas',
                            });
                            toast.info(isNowPinned ? 'Registro fijado en el inicio 📌' : 'Registro desfijado');
                            setDebts([...debts]);
                          }}
                          className={`p-2 rounded-xl transition-all ${
                            isItemPinned(debt.id)
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                          title={isItemPinned(debt.id) ? 'Desfijar del inicio' : 'Fijar en inicio'}
                        >
                          {isItemPinned(debt.id) ? '📌' : '📍'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(debt)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                          title="Editar registro"
                        >
                          <HiOutlinePencil className="text-base" />
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          title="Eliminar registro"
                        >
                          <HiOutlineTrash className="text-base" />
                        </button>
                      </div>
                    </div>

                    {/* Monto Destacado */}
                    <div className="pt-0.5">
                      <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {isPayable ? 'Monto a Pagar' : 'Monto a Cobrar'}
                      </p>
                      <p
                        className={`font-dm-sans text-3xl font-extrabold tracking-tight ${
                          debt.settled
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : isPayable
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ${debt.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* Concepto / Motivo */}
                    {cleanConcept && (
                      <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/80">
                        <p className="font-inter text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {cleanConcept}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ─── BOTÓN PRINCIPAL DE ACCIÓN (Cobrar / Pagar) ─── */}
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {!debt.settled ? (
                      isPayable ? (
                        /* Botón para Yo Debo -> Marcar como Pagada */
                        <button
                          onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount, 'payable')}
                          className="w-full py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[46px]"
                        >
                          <HiOutlineCheckCircle className="text-xl shrink-0" />
                          <span>Marcar como Pagada</span>
                        </button>
                      ) : (
                        /* Botón para Me Deben -> Marcar como Cobrada */
                        <button
                          onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount, 'receivable')}
                          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[46px]"
                        >
                          <HiOutlineCheckCircle className="text-xl shrink-0" />
                          <span>Marcar como Cobrada</span>
                        </button>
                      )
                    ) : (
                      /* Estado Saldado (Cobrada o Pagada) con botón de Reabrir */
                      <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-dm-sans text-xs font-bold pl-2">
                          <HiCheckCircle className="text-lg shrink-0 text-emerald-500" />
                          <span>{isPayable ? '¡Deuda Pagada!' : '¡Cobro Completado!'}</span>
                        </div>
                        <button
                          onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount, dType)}
                          className="px-3 py-1.5 text-[10px] font-syne font-bold uppercase tracking-wider text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-all flex items-center gap-1 shrink-0"
                          title="Volver a marcar como pendiente"
                        >
                          <HiOutlineRefresh className="text-xs shrink-0" />
                          <span>Reabrir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ─── VISTA EN TABLA (Table View) ─── */
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Persona / Entidad
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Concepto
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-right">
                    Monto
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-center">
                    Acción
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredDebts.map((debt) => {
                  const dType = getDebtType(debt);
                  const isPayable = dType === 'payable';
                  const cleanConcept = getCleanConcept(debt.concept);

                  return (
                    <tr 
                      key={debt.id} 
                      className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-syne font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            isPayable
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isPayable ? 'Yo Debo' : 'Me Deben'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-dm-sans font-bold text-black dark:text-white">
                        {debt.debtor_name}
                      </td>
                      <td className="px-6 py-4 font-inter text-sm text-gray-500 dark:text-gray-400">
                        {cleanConcept || '—'}
                      </td>
                      <td className="px-6 py-4 font-dm-sans font-extrabold text-right text-base">
                        <span className={debt.settled ? 'text-gray-400 line-through' : isPayable ? 'text-rose-500' : 'text-emerald-500'}>
                          ${debt.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!debt.settled ? (
                          <button
                            onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount, dType)}
                            className={`px-4 py-2 text-white rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all shadow-xs hover:scale-105 active:scale-95 inline-flex items-center gap-1.5 min-h-[36px] ${
                              isPayable ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                          >
                            <HiOutlineCheckCircle className="text-base" />
                            <span>{isPayable ? 'Pagar' : 'Cobrar'}</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              <HiCheckCircle className="text-xs text-emerald-500" />
                              {isPayable ? 'Pagada' : 'Cobrada'}
                            </span>
                            <button
                              onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount, dType)}
                              className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg transition-all"
                              title="Reabrir registro"
                            >
                              <HiOutlineRefresh className="text-sm" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const isNowPinned = togglePinItem({
                                id: debt.id,
                                type: 'debt',
                                title: `${debt.debtor_name} ($${debt.amount})`,
                                subtitle: cleanConcept || (isPayable ? 'Deuda por pagar' : 'Cuenta por cobrar'),
                                path: '/admin/panel/deudas',
                              });
                              toast.info(isNowPinned ? 'Registro fijado en inicio 📌' : 'Registro desfijado');
                              setDebts([...debts]);
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              isItemPinned(debt.id)
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                            }`}
                            title={isItemPinned(debt.id) ? 'Desfijar del inicio' : 'Fijar en inicio'}
                          >
                            {isItemPinned(debt.id) ? '📌' : '📍'}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(debt)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                            title="Editar registro"
                          >
                            <HiOutlinePencil className="text-base" />
                          </button>
                          <button
                            onClick={() => deleteDebt(debt.id)}
                            className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all shrink-0"
                            title="Eliminar registro"
                          >
                            <HiOutlineTrash className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Modal: Nuevo / Editar Registro (Bidireccional) ═══ */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowModal(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl my-8 cursor-default overflow-hidden"
              >
                {/* Header Modal */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                      {editingDebt 
                        ? 'Editar Registro de Deuda' 
                        : formData.type === 'payable' 
                        ? 'Registrar Deuda por Pagar' 
                        : 'Registrar Cuenta por Cobrar'}
                    </h2>
                    <p className="font-inter text-xs text-gray-400 mt-0.5">
                      {formData.type === 'payable'
                        ? 'Dinero que tú le debes a otra persona o entidad.'
                        : 'Dinero a tu favor que te deben pagar.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSaveDebt} className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
                    {/* Selector de Tipo (Me Deben vs Yo Debo) */}
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        Tipo de Operación *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, type: 'receivable' })}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                            formData.type === 'receivable'
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                              : 'border-gray-200/60 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <span className="font-dm-sans font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Me Deben
                          </span>
                          <span className="font-inter text-[11px] text-gray-400 leading-tight">
                            Por cobrar (activo a tu favor)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, type: 'payable' })}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                            formData.type === 'payable'
                              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                              : 'border-gray-200/60 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <span className="font-dm-sans font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-rose-500" />
                            Yo Debo
                          </span>
                          <span className="font-inter text-[11px] text-gray-400 leading-tight">
                            Por pagar (deuda a tu cargo)
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Nombre del Deudor / Acreedor */}
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        {formData.type === 'payable' ? '¿A quién le debes? *' : '¿Quién te debe? *'}
                      </label>
                      <input
                        value={formData.debtor_name}
                        onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                        placeholder={formData.type === 'payable' ? 'Ej. Mi hermano, Banco, Amigo...' : 'Ej. Juan Pérez, Cliente X...'}
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[44px]"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Monto */}
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        {formData.type === 'payable' ? 'Monto que debes ($) *' : 'Monto que te deben ($) *'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-lg font-dm-sans font-extrabold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[44px]"
                        required
                      />
                    </div>

                    {/* Concepto / Motivo */}
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        Concepto o Motivo (Opcional)
                      </label>
                      <input
                        value={formData.concept}
                        onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                        placeholder={formData.type === 'payable' ? 'Ej. Préstamo para gastos médicos, compra compartida...' : 'Ej. Préstamo de fin de semana, trabajo freelance...'}
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Footer Modal */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all min-h-[44px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-8 py-3 font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] ${
                        formData.type === 'payable'
                          ? 'bg-rose-500 hover:bg-rose-600 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>{editingDebt ? 'Actualizar Registro' : 'Guardar Registro'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
