import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave } from 'react-icons/hi';

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
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '', category: 'comida' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch expenses
    const { data: expData } = await supabase
      .from('finance_expenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Fetch salary
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
    if (!user || !newExpense.concept || !newExpense.amount) return;

    const { error } = await supabase.from('finance_expenses').insert([
      {
        user_id: user.id,
        category,
        concept: newExpense.concept,
        amount: parseFloat(newExpense.amount),
      },
    ]);

    if (!error) {
      setNewExpense({ concept: '', amount: '', category: 'comida' });
      fetchData();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleUpdateSalary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('finance_constants').upsert({
      user_id: user.id,
      salary,
      updated_at: new Date().toISOString(),
    });

    if (!error) alert('Salario actualizado');
  };

  const getCategoryTotal = (cat: string) => 
    expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0);

  const globalTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Control de <span className="text-gradient">Finanzas</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
            Gestiona tus gastos fijos y presupuesto mensual.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="space-y-1">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gray)]">Salario Mensual</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-dm-sans">$</span>
              <input 
                type="number" 
                value={salary} 
                onChange={(e) => setSalary(parseFloat(e.target.value))}
                className="font-dm-sans font-bold text-xl outline-none w-32"
              />
              <button onClick={handleUpdateSalary} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <HiOutlineSave className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Salario', value: salary, color: 'text-black' },
          { label: 'Comida', value: getCategoryTotal('comida'), color: 'text-blue-500' },
          { label: 'Insumos', value: getCategoryTotal('insumos'), color: 'text-orange-500' },
          { label: 'Servicios', value: getCategoryTotal('servicios'), color: 'text-purple-500' },
          { label: 'Total Gastos', value: globalTotal, color: 'text-red-500', highlight: true },
        ].map((item) => (
          <div key={item.label} className={`p-6 bg-white rounded-3xl border ${item.highlight ? 'border-red-100 bg-red-50/30' : 'border-gray-50'} shadow-sm`}>
            <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">{item.label}</p>
            <h3 className={`font-dm-sans text-2xl font-bold ${item.color}`}>
              ${item.value.toLocaleString()}
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
                Total: ${getCategoryTotal(cat).toLocaleString()}
              </span>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Concepto</th>
                      <th className="px-6 py-4 font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] text-right">Monto</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.filter(e => e.category === cat).map((exp) => (
                      <tr key={exp.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-inter text-sm text-gray-600">{exp.concept}</td>
                        <td className="px-6 py-4 font-dm-sans text-sm font-semibold text-right">${exp.amount.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-all lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50/30 border-t border-gray-50">
                <div className="flex gap-2">
                  <input 
                    placeholder="Concepto"
                    value={newExpense.category === cat ? newExpense.concept : ''}
                    onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value, category: cat })}
                    className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-gray-300"
                  />
                  <input 
                    type="number"
                    placeholder="$$"
                    value={newExpense.category === cat ? newExpense.amount : ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value, category: cat })}
                    className="w-20 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-gray-300 text-right"
                  />
                  <button 
                    onClick={() => handleAddExpense(cat)}
                    className="p-2 bg-black text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <HiOutlinePlus />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
