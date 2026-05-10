import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HiOutlineTrash } from 'react-icons/hi';

type Debt = {
  id: string;
  debtor_name: string;
  concept: string;
  amount: number;
  settled: boolean;
};

export default function Deudas() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDebt, setNewDebt] = useState({ debtor_name: '', concept: '', amount: '' });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    const { data } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDebts(data);
    setLoading(false);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newDebt.debtor_name || !newDebt.amount) return;

    const { error } = await supabase.from('debts').insert([
      {
        user_id: user.id,
        debtor_name: newDebt.debtor_name,
        concept: newDebt.concept || null,
        amount: parseFloat(newDebt.amount),
      },
    ]);

    if (!error) {
      setNewDebt({ debtor_name: '', concept: '', amount: '' });
      fetchDebts();
    }
  };

  const toggleSettled = async (id: string, settled: boolean) => {
    const { error } = await supabase.from('debts').update({ settled: !settled }).eq('id', id);
    if (!error) fetchDebts();
  };

  const deleteDebt = async (id: string) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (!error) fetchDebts();
  };

  const totalPending = debts.filter(d => !d.settled).reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

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
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Deudor</label>
            <input 
              value={newDebt.debtor_name}
              onChange={(e) => setNewDebt({...newDebt, debtor_name: e.target.value})}
              placeholder="Nombre"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 text-sm font-inter"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Concepto</label>
            <input 
              value={newDebt.concept}
              onChange={(e) => setNewDebt({...newDebt, concept: e.target.value})}
              placeholder="Préstamo, etc."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 text-sm font-inter"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Monto</label>
            <input 
              type="number"
              value={newDebt.amount}
              onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
              placeholder="$0.00"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 text-sm font-dm-sans font-bold"
              required
            />
          </div>
          <button 
            type="submit"
            className="py-3 bg-black text-white rounded-xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
          >
            Registrar
          </button>
        </form>
      </div>

      {/* Debts List - Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {debts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[2.5rem] text-gray-400 font-inter font-light italic border border-gray-100">
            Nadie te debe nada actualmente.
          </div>
        ) : (
          debts.map((debt) => (
            <div key={debt.id} className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 ${debt.settled ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-dm-sans font-bold text-lg text-black">{debt.debtor_name}</h3>
                  <p className="font-inter text-xs text-gray-500 mt-1">{debt.concept || 'Sin concepto'}</p>
                </div>
                <p className="font-dm-sans font-bold text-xl text-black">${debt.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={() => toggleSettled(debt.id, debt.settled)}
                  className={`px-6 py-2 rounded-full font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
                    debt.settled 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {debt.settled ? 'Saldada' : 'Pendiente'}
                </button>
                <button 
                  onClick={() => deleteDebt(debt.id)}
                  className="p-3 text-red-400 bg-red-50 rounded-2xl transition-all"
                >
                  <HiOutlineTrash className="text-xl" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Debts List - Desktop Table View */}
      <div className="hidden md:block bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 text-left">Deudor</th>
              <th className="px-8 py-6 font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 text-left">Concepto</th>
              <th className="px-8 py-6 font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Monto</th>
              <th className="px-8 py-6 font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Estado</th>
              <th className="px-8 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {debts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-inter font-light italic">
                  Nadie te debe nada actualmente.
                </td>
              </tr>
            ) : (
              debts.map((debt) => (
                <tr key={debt.id} className={`group ${debt.settled ? 'opacity-40' : ''}`}>
                  <td className="px-8 py-6 font-dm-sans font-bold text-black">{debt.debtor_name}</td>
                  <td className="px-8 py-6 font-inter text-sm text-gray-500">{debt.concept || '-'}</td>
                  <td className="px-8 py-6 font-dm-sans font-bold text-right text-lg">${debt.amount.toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => toggleSettled(debt.id, debt.settled)}
                      className={`px-4 py-1.5 rounded-full font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
                        debt.settled 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      }`}
                    >
                      {debt.settled ? 'Saldada' : 'Pendiente'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => deleteDebt(debt.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <HiOutlineTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
