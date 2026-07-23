import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type Expense = {
  id: string;
  category: 'comida' | 'insumos' | 'servicios';
  concept: string;
  amount: number;
};

export default function Finanzas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [savingSalary, setSavingSalary] = useState(false);
  const [submittingCat, setSubmittingCat] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '', category: 'comida' });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch expenses
    const { data: expData, error: expErr } = await supabase
      .from('finance_expenses')
      .select('*');
    if (expErr) toast.error('Error al cargar gastos: ' + expErr.message);
    else if (expData) setExpenses(expData);

    // Fetch salary
    const { data: salData } = await supabase
      .from('finance_salary')
      .select('amount')
      .eq('user_id', user.id)
      .maybeSingle();

    if (salData) {
      setSalary(salData.amount);
    }
    setLoading(false);
  };

  const handleUpdateSalary = async () => {
    setSavingSalary(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('finance_salary')
        .upsert({ user_id: user.id, amount: salary }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Salario actualizado correctamente');
    } catch (err: any) {
      toast.error('Error al actualizar salario: ' + err.message);
    } finally {
      setSavingSalary(false);
    }
  };

  const handleAddExpense = async (category: string) => {
    if (!newExpense.concept || !newExpense.amount) {
      toast.error('Por favor ingresa concepto y monto');
      return;
    }
    setSubmittingCat(category);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.from('finance_expenses').insert([
        {
          user_id: user.id,
          category,
          concept: newExpense.concept,
          amount: parseFloat(newExpense.amount),
        },
      ]).select();

      if (error) throw error;

      if (data) {
        setExpenses([...expenses, ...data]);
        setNewExpense({ concept: '', amount: '', category: 'comida' });
        toast.success('Gasto registrado');
      }
    } catch (err: any) {
      toast.error('Error al registrar gasto: ' + err.message);
    } finally {
      setSubmittingCat(null);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success('Gasto eliminado');
    } catch (err: any) {
      toast.error('Error al eliminar gasto: ' + err.message);
    }
  };

  const getCategoryTotal = (category: string) => {
    return expenses
      .filter((e) => e.category === category)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const globalTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const formatAmount = (val: number) => {
    if (isPrivacyMode) return '$••••••';
    return `$${val.toLocaleString()}`;
  };

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando finanzas...</div>;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Control de <span className="text-gradient">Finanzas</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Gestiona tu presupuesto mensual y tus gastos fijos/servicios recurrentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            {isPrivacyMode ? (
              <>
                <HiOutlineEyeOff className="text-lg text-gray-400" />
                <span>Mostrar Montos</span>
              </>
            ) : (
              <>
                <HiOutlineEye className="text-lg text-emerald-500" />
                <span>Modo Privacidad</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="space-y-0.5">
              <p className="font-syne text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gray)] dark:text-gray-400">Salario Mensual</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-dm-sans text-sm">$</span>
                <input
                  type={isPrivacyMode ? 'password' : 'number'}
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  className="font-dm-sans font-bold text-lg outline-none w-28 text-gray-800 dark:text-gray-100 bg-transparent"
                />
                <button
                  onClick={handleUpdateSalary}
                  disabled={savingSalary}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                  title="Guardar Salario"
                >
                  <HiOutlineSave className={`text-gray-600 dark:text-gray-300 ${savingSalary ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
        {[
          { label: 'Salario', value: salary, color: 'text-black dark:text-white' },
          { label: 'Comida', value: getCategoryTotal('comida'), color: 'text-blue-500' },
          { label: 'Insumos', value: getCategoryTotal('insumos'), color: 'text-orange-500' },
          { label: 'Servicios', value: getCategoryTotal('servicios'), color: 'text-purple-500' },
          { label: 'Total Gastos', value: globalTotal, color: 'text-red-500', highlight: true },
        ].map((item) => (
          <div
            key={item.label}
            className={`p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl border ${
              item.highlight 
                ? 'border-red-100 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/20' 
                : 'border-gray-50 dark:border-gray-800'
            } shadow-sm`}
          >
            <p className="font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-1 md:mb-2">
              {item.label}
            </p>
            <h3 className={`font-dm-sans text-lg md:text-2xl font-bold ${item.color}`}>
              {formatAmount(item.value)}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['comida', 'insumos', 'servicios'] as const).map((cat) => (
          <div key={cat} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-dm-sans text-xl font-bold capitalize text-black dark:text-white">{cat}</h2>
                {cat === 'servicios' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 font-syne text-[9px] font-bold uppercase tracking-wider">
                    Recurrentes 🔄
                  </span>
                )}
              </div>
              <span className="font-syne text-xs font-bold text-gray-400 dark:text-gray-500">
                Total: {formatAmount(getCategoryTotal(cat))}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                        Concepto
                      </th>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 text-right">
                        Monto
                      </th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {expenses.filter((e) => e.category === cat).map((exp) => (
                      <tr key={exp.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-inter text-sm text-gray-600 dark:text-gray-300">{exp.concept}</td>
                        <td className="px-6 py-4 font-dm-sans text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                          {formatAmount(exp.amount)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all lg:opacity-0 lg:group-hover:opacity-100"
                            title="Eliminar gasto"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenses.filter((e) => e.category === cat).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-xs text-gray-400 dark:text-gray-500 font-inter">
                          No hay gastos registrados en esta categoría
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 md:p-4 bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800">
                <div className="flex flex-col gap-2">
                  <input
                    placeholder="Concepto"
                    value={newExpense.category === cat ? newExpense.concept : ''}
                    onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value, category: cat })}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="$0"
                      value={newExpense.category === cat ? newExpense.amount : ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value, category: cat })}
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-gray-300 dark:focus:border-gray-500 text-right font-dm-sans font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                      onClick={() => handleAddExpense(cat)}
                      disabled={submittingCat === cat}
                      className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {submittingCat === cat ? (
                        <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                      ) : (
                        <HiOutlinePlus className="text-base" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
