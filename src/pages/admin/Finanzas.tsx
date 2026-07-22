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
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(true);
  const [submittingCat, setSubmittingCat] = useState<string | null>(null);
  const [savingSalary, setSavingSalary] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '', category: 'comida' });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: expData } = await supabase
      .from('finance_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: constData } = await supabase
      .from('finance_constants')
      .select('salary')
      .single();

    if (expData) setExpenses(expData);
    if (constData) setSalary(constData.salary);
    setLoading(false);
  };

  const handleAddExpense = async (category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newExpense.concept.trim()) {
      toast.error('Escribe el concepto del gasto');
      return;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSubmittingCat(category);
    try {
      const { error } = await supabase.from('finance_expenses').insert([
        {
          user_id: user.id,
          category,
          concept: newExpense.concept.trim(),
          amount: parseFloat(newExpense.amount),
        },
      ]);

      if (error) throw error;

      toast.success('Gasto agregado exitosamente');
      setNewExpense({ concept: '', amount: '', category: 'comida' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el gasto');
    } finally {
      setSubmittingCat(null);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Gasto eliminado');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleUpdateSalary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingSalary(true);
    try {
      const { error } = await supabase.from('finance_constants').upsert({
        user_id: user.id,
        salary,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Salario mensual actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar salario');
    } finally {
      setSavingSalary(false);
    }
  };

  const getCategoryTotal = (cat: string) =>
    expenses.filter((e) => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0);

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
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
            Control de <span className="text-gradient">Finanzas</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
            Gestiona tus gastos fijos y presupuesto mensual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
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

          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="space-y-0.5">
              <p className="font-syne text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gray)]">Salario Mensual</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-dm-sans text-sm">$</span>
                <input
                  type={isPrivacyMode ? 'password' : 'number'}
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  className="font-dm-sans font-bold text-lg outline-none w-28 text-gray-800"
                />
                <button
                  onClick={handleUpdateSalary}
                  disabled={savingSalary}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Guardar Salario"
                >
                  <HiOutlineSave className={`text-gray-600 ${savingSalary ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: 'Salario', value: salary, color: 'text-black' },
          { label: 'Comida', value: getCategoryTotal('comida'), color: 'text-blue-500' },
          { label: 'Insumos', value: getCategoryTotal('insumos'), color: 'text-orange-500' },
          { label: 'Servicios', value: getCategoryTotal('servicios'), color: 'text-purple-500' },
          { label: 'Total Gastos', value: globalTotal, color: 'text-red-500', highlight: true },
        ].map((item) => (
          <div
            key={item.label}
            className={`p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border ${
              item.highlight ? 'border-red-100 bg-red-50/30' : 'border-gray-50'
            } shadow-sm`}
          >
            <p className="font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-1 md:mb-2">
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
              <h2 className="font-dm-sans text-xl font-bold capitalize">{cat}</h2>
              <span className="font-syne text-xs font-bold text-gray-400">
                Total: {formatAmount(getCategoryTotal(cat))}
              </span>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">
                        Concepto
                      </th>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] text-right">
                        Monto
                      </th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.filter((e) => e.category === cat).map((exp) => (
                      <tr key={exp.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-inter text-sm text-gray-600">{exp.concept}</td>
                        <td className="px-6 py-4 font-dm-sans text-sm font-semibold text-right">
                          {formatAmount(exp.amount)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-all lg:opacity-0 lg:group-hover:opacity-100"
                            title="Eliminar gasto"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenses.filter((e) => e.category === cat).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-xs text-gray-400 font-inter">
                          No hay gastos registrados en esta categoría
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 md:p-4 bg-gray-50/30 border-t border-gray-50">
                <div className="flex flex-col gap-2">
                  <input
                    placeholder="Concepto"
                    value={newExpense.category === cat ? newExpense.concept : ''}
                    onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value, category: cat })}
                    className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:border-gray-300 font-inter"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="$0"
                      value={newExpense.category === cat ? newExpense.amount : ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value, category: cat })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:border-gray-300 text-right font-dm-sans font-bold"
                    />
                    <button
                      onClick={() => handleAddExpense(cat)}
                      disabled={submittingCat === cat}
                      className="px-5 py-3 bg-black text-white rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {submittingCat === cat ? (
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
