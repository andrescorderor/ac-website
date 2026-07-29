import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type Debt = {
  id: string;
  debtor_name: string;
  amount: number;
  concept: string | null;
  settled: boolean;
  created_at: string;
};

type StatusFilter = 'pending' | 'settled' | 'all';

import { useSearchParams } from 'react-router-dom';

export default function Deudas() {
  const [searchParams] = useSearchParams();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      if (queryParam) setStatusFilter('all');
    }
  }, [searchParams]);
  const [newDebt, setNewDebt] = useState({ debtor_name: '', amount: '', concept: '' });
  const { toast } = useToast();

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

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.debtor_name || !newDebt.amount) {
      toast.error('Nombre de deudor y monto son obligatorios');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([
          {
            user_id: user.id,
            debtor_name: newDebt.debtor_name.trim(),
            concept: newDebt.concept.trim() || null,
            amount: parseFloat(newDebt.amount),
            settled: false,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setDebts([data[0], ...debts]);
        setNewDebt({ debtor_name: '', amount: '', concept: '' });
        toast.success('Cuenta por cobrar registrada');
      }
    } catch (err: any) {
      toast.error('Error al registrar cuenta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSettled = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('debts').update({ settled: !currentStatus }).eq('id', id);
      if (error) throw error;

      setDebts(debts.map((d) => (d.id === id ? { ...d, settled: !currentStatus } : d)));
      toast.info(!currentStatus ? 'Deuda marcada como cobrada 💰' : 'Deuda marcada como pendiente');
    } catch (err: any) {
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;

      setDebts(debts.filter((d) => d.id !== id));
      toast.success('Registro eliminado');
    } catch (err: any) {
      toast.error('Error al eliminar registro: ' + err.message);
    }
  };

  const totalPending = debts.filter((d) => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);

  const filteredDebts = debts.filter((d) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !d.settled
        : d.settled;

    const matchesSearch =
      d.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.concept && d.concept.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Cuentas por <span className="text-gradient">Cobrar</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Lleva el control de quién te debe dinero y por qué.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 px-6 md:px-8 py-4 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-start md:items-end">
          <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Pendiente</p>
          <p className="font-dm-sans text-2xl md:text-3xl font-bold text-red-500 dark:text-red-400">${totalPending.toLocaleString()}</p>
        </div>
      </header>

      {/* Add Form */}
      <div className="bg-white dark:bg-gray-900 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-dm-sans text-lg font-bold text-black dark:text-white mb-4">Registrar Nueva Cuenta por Cobrar</h3>
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Deudor</label>
            <input
              value={newDebt.debtor_name}
              onChange={(e) => setNewDebt({ ...newDebt, debtor_name: e.target.value })}
              placeholder="Nombre"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Concepto</label>
            <input
              value={newDebt.concept}
              onChange={(e) => setNewDebt({ ...newDebt, concept: e.target.value })}
              placeholder="Préstamo, trabajo, etc."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Monto ($)</label>
            <input
              type="number"
              value={newDebt.amount}
              onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 text-sm font-dm-sans font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <HiOutlinePlus className="text-base" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'pending', label: `Pendientes (${debts.filter((d) => !d.settled).length})` },
            { id: 'settled', label: `Pagadas (${debts.filter((d) => d.settled).length})` },
            { id: 'all', label: `Todas (${debts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as StatusFilter)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <input
            type="text"
            placeholder="Buscar deudor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
        </div>
      </div>

      {/* Debts Table / List */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                  Estado
                </th>
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
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-inter text-gray-400 dark:text-gray-500">
                    No se encontraron cuentas por cobrar con este filtro
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <motion.tr 
                    key={debt.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSettled(debt.id, debt.settled)}
                        className={`px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                          debt.settled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 hover:bg-red-200'
                        }`}
                      >
                        {debt.settled ? 'Cobrado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-dm-sans font-bold text-black dark:text-white">{debt.debtor_name}</td>
                    <td className="px-6 py-4 font-inter text-sm text-gray-500 dark:text-gray-400">{debt.concept || '—'}</td>
                    <td className="px-6 py-4 font-dm-sans font-bold text-black dark:text-white text-right">
                      ${debt.amount.toLocaleString()}
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
                            toast.info(isNowPinned ? 'Cuenta por cobrar fijada en el inicio 📌' : 'Cuenta desfijada');
                            setDebts([...debts]);
                          }}
                          className={`p-2 rounded-xl transition-all ${
                            isItemPinned(debt.id)
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                          title={isItemPinned(debt.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                        >
                          {isItemPinned(debt.id) ? '📌' : '📍'}
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          title="Eliminar registro"
                        >
                          <HiOutlineTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
