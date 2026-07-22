import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type Debt = {
  id: string;
  debtor_name: string;
  concept: string;
  amount: number;
  settled: boolean;
};

type StatusFilter = 'pending' | 'settled' | 'all';

export default function Deudas() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [newDebt, setNewDebt] = useState({ debtor_name: '', concept: '', amount: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar deudas');
    } else if (data) {
      setDebts(data);
    }
    setLoading(false);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newDebt.debtor_name.trim()) {
      toast.error('El nombre del deudor es obligatorio');
      return;
    }
    if (!newDebt.amount || parseFloat(newDebt.amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('debts').insert([
        {
          user_id: user.id,
          debtor_name: newDebt.debtor_name.trim(),
          concept: newDebt.concept?.trim() || null,
          amount: parseFloat(newDebt.amount),
        },
      ]);

      if (error) throw error;

      toast.success('Cuenta por cobrar registrada');
      setNewDebt({ debtor_name: '', concept: '', amount: '' });
      fetchDebts();
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar registro');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSettled = async (id: string, settled: boolean) => {
    try {
      const { error } = await supabase.from('debts').update({ settled: !settled }).eq('id', id);
      if (error) throw error;
      toast.info(settled ? 'Cuenta marcada como pendiente' : 'Cuenta marcada como pagada / cobrada 🎉');
      fetchDebts();
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado');
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro eliminado');
      fetchDebts();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const totalPending = debts.filter((d) => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);

  const filteredDebts = debts.filter((d) => {
    const matchesSearch =
      d.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.concept?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !d.settled
        : d.settled;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando deudas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
            Cuentas por <span className="text-gradient">Cobrar</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
            Lleva el control de quién te debe dinero y por qué.
          </p>
        </div>
        <div className="bg-white px-6 md:px-8 py-4 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-start md:items-end">
          <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Pendiente</p>
          <p className="font-dm-sans text-2xl md:text-3xl font-bold text-red-500">${totalPending.toLocaleString()}</p>
        </div>
      </header>

      {/* Add Form */}
      <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="font-dm-sans text-lg font-bold text-black mb-4">Registrar Nueva Cuenta por Cobrar</h3>
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Deudor</label>
            <input
              value={newDebt.debtor_name}
              onChange={(e) => setNewDebt({ ...newDebt, debtor_name: e.target.value })}
              placeholder="Nombre"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 ring-gray-100 text-sm font-inter"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Concepto</label>
            <input
              value={newDebt.concept}
              onChange={(e) => setNewDebt({ ...newDebt, concept: e.target.value })}
              placeholder="Préstamo, trabajo, etc."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 ring-gray-100 text-sm font-inter"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Monto ($)</label>
            <input
              type="number"
              value={newDebt.amount}
              onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 ring-gray-100 text-sm font-dm-sans font-bold"
              required
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
          />
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
        </div>
      </div>

      {/* Debts Table / List */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">
                  Estado
                </th>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">
                  Deudor
                </th>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">
                  Concepto
                </th>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] text-right">
                  Monto
                </th>
                <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-inter text-gray-400">
                    No se encontraron cuentas por cobrar con este filtro
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSettled(debt.id, debt.settled)}
                        className={`px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                          debt.settled
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {debt.settled ? 'Cobrado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-dm-sans font-bold text-black">{debt.debtor_name}</td>
                    <td className="px-6 py-4 font-inter text-sm text-gray-500">{debt.concept || '—'}</td>
                    <td className="px-6 py-4 font-dm-sans font-bold text-black text-right">
                      ${debt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteDebt(debt.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar registro"
                      >
                        <HiOutlineTrash className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
