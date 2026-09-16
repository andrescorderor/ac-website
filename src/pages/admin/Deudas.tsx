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
  HiOutlineCurrencyDollar,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineClock
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';

type Debt = {
  id: string;
  debtor_name: string;
  amount: number;
  concept: string | null;
  settled: boolean;
  created_at: string;
};

type StatusFilter = 'pending' | 'settled' | 'all';
type ViewMode = 'cards' | 'table';

export default function Deudas() {
  const [searchParams] = useSearchParams();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({ debtor_name: '', amount: '', concept: '' });

  // Filters & View state
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

  const handleOpenAddModal = () => {
    setEditingDebt(null);
    setFormData({ debtor_name: '', amount: '', concept: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      debtor_name: debt.debtor_name,
      amount: debt.amount.toString(),
      concept: debt.concept || '',
    });
    setShowModal(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.debtor_name.trim() || !formData.amount) {
      toast.error('Nombre de deudor y monto son obligatorios');
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
      if (editingDebt) {
        // Modo Edición
        const { data, error } = await supabase
          .from('debts')
          .update({
            debtor_name: formData.debtor_name.trim(),
            concept: formData.concept.trim() || null,
            amount: parsedAmount,
          })
          .eq('id', editingDebt.id)
          .select();

        if (error) throw error;
        if (data && data[0]) {
          setDebts(debts.map((d) => (d.id === editingDebt.id ? data[0] : d)));
          toast.success('Cuenta por cobrar actualizada correctamente');
          setShowModal(false);
        }
      } else {
        // Modo Creación
        const { data, error } = await supabase
          .from('debts')
          .insert([
            {
              user_id: user.id,
              debtor_name: formData.debtor_name.trim(),
              concept: formData.concept.trim() || null,
              amount: parsedAmount,
              settled: false,
            },
          ])
          .select();

        if (error) throw error;
        if (data && data[0]) {
          setDebts([data[0], ...debts]);
          toast.success('Cuenta por cobrar registrada');
          setShowModal(false);
        }
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Marcar cuenta como cobrada / reabrir como pendiente con soporte de Deshacer (Undo)
   */
  const toggleSettled = async (id: string, currentStatus: boolean, debtorName?: string, amount?: number) => {
    const nextStatus = !currentStatus;
    const previousDebts = [...debts];

    // Actualización optimista inmediata en la UI
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, settled: nextStatus } : d)));

    try {
      const { error } = await supabase.from('debts').update({ settled: nextStatus }).eq('id', id);
      if (error) throw error;

      const formattedAmount = amount ? `$${amount.toLocaleString()}` : '';
      const name = debtorName || 'la cuenta';

      if (nextStatus) {
        // Se marcó como cobrada -> Toast informativo con botón de Deshacer
        toast.undoable(`¡Cobro de ${formattedAmount} a ${name} registrado! 💰`, async () => {
          try {
            await supabase.from('debts').update({ settled: false }).eq('id', id);
            setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, settled: false } : d)));
            toast.info(`Cobro a ${name} reabierto como pendiente ↩️`);
          } catch (err: any) {
            toast.error('Error al deshacer cobro: ' + err.message);
          }
        });
      } else {
        // Se reabrió como pendiente
        toast.info(`Cuenta de ${name} reabierta como pendiente ⏳`);
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
      
      toast.undoable('Registro de deuda eliminado', async () => {
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
          toast.success('Deuda restaurada ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar deuda: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar registro: ' + err.message);
    }
  };

  // Cálculo de totales financieros
  const totalPending = debts.filter((d) => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);
  const totalSettled = debts.filter((d) => d.settled).reduce((acc, curr) => acc + curr.amount, 0);
  const grandTotal = totalPending + totalSettled;
  const collectionPercentage = Math.round((totalSettled / (grandTotal || 1)) * 100);

  // Normalizador insensible a acentos
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredDebts = debts.filter((d) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !d.settled
        : d.settled;

    const normalizedSearch = normalize(searchTerm.trim());
    const matchesSearch =
      !normalizedSearch ||
      normalize(d.debtor_name).includes(normalizedSearch) ||
      (d.concept && normalize(d.concept).includes(normalizedSearch));

    return matchesStatus && matchesSearch;
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
      <div className="skeleton h-24 rounded-3xl" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10 pb-28 sm:pb-20 max-w-7xl mx-auto">
      {/* ═══ Header ═══ */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Cuentas por <span className="text-gradient">Cobrar</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Control de cobros pendientes y deudas a tu favor con registro en un toque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Card Resumen Pendiente */}
          <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass px-5 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
              <HiOutlineClock />
            </div>
            <div>
              <p className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Por Cobrar</p>
              <p className="font-dm-sans text-xl font-bold text-red-500 dark:text-red-400 leading-tight">
                ${totalPending.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card Resumen Cobrado */}
          <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass px-5 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
              <HiOutlineCurrencyDollar />
            </div>
            <div>
              <p className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Ya Cobrado</p>
              <p className="font-dm-sans text-xl font-bold text-emerald-500 dark:text-emerald-400 leading-tight">
                ${totalSettled.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Botón Nueva Cuenta */}
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            <HiOutlinePlus className="text-lg shrink-0" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </header>

      {/* ═══ Collection Progress Bar ═══ */}
      {debts.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-5 sm:p-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-syne text-xs font-bold uppercase tracking-wider">
            <span className="text-gray-600 dark:text-gray-300">Progreso Total de Cobros</span>
            <span className="text-emerald-500 dark:text-emerald-400">
              {collectionPercentage}% Cobrado (${totalSettled.toLocaleString()} de ${grandTotal.toLocaleString()})
            </span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200/50 dark:border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* ═══ Filter Tabs, Search & View Mode Switcher ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'pending', label: `Pendientes (${debts.filter((d) => !d.settled).length})` },
            { id: 'settled', label: `Cobradas (${debts.filter((d) => d.settled).length})` },
            { id: 'all', label: `Todas (${debts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as StatusFilter)}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[40px] ${
                statusFilter === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800/90 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador y Selector de Vista */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar deudor o concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[42px]"
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

      {/* ═══ Content: Cards View (Default & Mobile) OR Table View ═══ */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2.5rem] p-12 text-center border border-gray-200/50 dark:border-gray-800 shadow-sm space-y-3">
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">No hay cuentas por cobrar</p>
          <p className="font-inter text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
            {statusFilter === 'pending'
              ? '¡Excelente! No tienes cuentas pendientes de cobro en este momento.'
              : 'No se encontraron registros con este filtro o término de búsqueda.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ─── VISTA DE TARJETAS (Cards Grid) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredDebts.map((debt) => {
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
                      ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.02]'
                      : 'border-gray-200/60 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  {/* Card Header: Deudor, Avatar & Acciones Rápidas */}
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar con Iniciales */}
                        <div
                          className={`size-11 rounded-2xl flex items-center justify-center font-syne text-xs font-bold shrink-0 shadow-xs ${
                            debt.settled
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white'
                              : 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-dm-sans font-bold text-lg text-gray-900 dark:text-white truncate" title={debt.debtor_name}>
                            {debt.debtor_name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-syne font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              debt.settled
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {debt.settled ? <HiCheckCircle className="text-xs" /> : <HiOutlineClock className="text-xs" />}
                            {debt.settled ? 'Cobrada' : 'Pendiente'}
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción secundaria: Editar, Fijar, Eliminar */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const isNowPinned = togglePinItem({
                              id: debt.id,
                              type: 'debt',
                              title: `${debt.debtor_name} ($${debt.amount})`,
                              subtitle: debt.concept || undefined,
                              path: '/admin/panel/deudas',
                            });
                            toast.info(isNowPinned ? 'Cuenta fijada en el inicio 📌' : 'Cuenta desfijada');
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
                          title="Editar cuenta"
                        >
                          <HiOutlinePencil className="text-base" />
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          title="Eliminar cuenta"
                        >
                          <HiOutlineTrash className="text-base" />
                        </button>
                      </div>
                    </div>

                    {/* Monto destacado */}
                    <div className="pt-1">
                      <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Monto</p>
                      <p
                        className={`font-dm-sans text-3xl font-extrabold tracking-tight ${
                          debt.settled
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        ${debt.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* Concepto / Motivo */}
                    {debt.concept && (
                      <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/80">
                        <p className="font-inter text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {debt.concept}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ─── BOTÓN PRINCIPAL DE COBRO (Ultra Intuitivo) ─── */}
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {!debt.settled ? (
                      <button
                        onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount)}
                        className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[46px]"
                      >
                        <HiOutlineCheckCircle className="text-xl shrink-0" />
                        <span>Marcar como Cobrada</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-dm-sans text-xs font-bold pl-2">
                          <HiCheckCircle className="text-lg shrink-0 text-emerald-500" />
                          <span>¡Cobro Completado!</span>
                        </div>
                        <button
                          onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount)}
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
                    Deudor
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Concepto
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-right">
                    Monto
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-center">
                    Estado y Cobro
                  </th>
                  <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredDebts.map((debt) => (
                  <tr 
                    key={debt.id} 
                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-dm-sans font-bold text-black dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <span className={`size-2.5 rounded-full shrink-0 ${debt.settled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{debt.debtor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-inter text-sm text-gray-500 dark:text-gray-400">
                      {debt.concept || '—'}
                    </td>
                    <td className="px-6 py-4 font-dm-sans font-extrabold text-black dark:text-white text-right text-base">
                      ${debt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!debt.settled ? (
                        <button
                          onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all shadow-xs hover:scale-105 active:scale-95 inline-flex items-center gap-1.5 min-h-[36px]"
                        >
                          <HiOutlineCheckCircle className="text-base" />
                          <span>Cobrar</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <HiCheckCircle className="text-xs" />
                            Cobrada
                          </span>
                          <button
                            onClick={() => toggleSettled(debt.id, debt.settled, debt.debtor_name, debt.amount)}
                            className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg transition-all"
                            title="Reabrir como pendiente"
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
                              subtitle: debt.concept || undefined,
                              path: '/admin/panel/deudas',
                            });
                            toast.info(isNowPinned ? 'Cuenta fijada en el inicio 📌' : 'Cuenta desfijada');
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
                          title="Editar cuenta"
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Modal: Nueva Cuenta o Editar Cuenta por Cobrar ═══ */}
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
                      {editingDebt ? 'Editar Cuenta por Cobrar' : 'Nueva Cuenta por Cobrar'}
                    </h2>
                    <p className="font-inter text-xs text-gray-400">
                      {editingDebt 
                        ? 'Modifica el deudor, monto o concepto de esta cuenta.' 
                        : 'Registra el deudor, concepto y monto pendiente de cobro.'}
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
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        Deudor *
                      </label>
                      <input
                        value={formData.debtor_name}
                        onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-h-[44px]"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        Monto ($) *
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

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        Concepto / Motivo (Opcional)
                      </label>
                      <input
                        value={formData.concept}
                        onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                        placeholder="Ej. Préstamo de fin de semana, trabajo freelance..."
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
                      className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {submitting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>{editingDebt ? 'Actualizar Cuenta' : 'Guardar Cuenta'}</span>
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
