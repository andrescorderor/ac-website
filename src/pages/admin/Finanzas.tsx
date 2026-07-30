import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineEye, HiOutlineEyeOff, HiOutlineSearch, HiX } from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

type Expense = {
  id: string;
  category: 'comida' | 'insumos' | 'servicios';
  concept: string;
  amount: number;
};

const CATEGORIES_MAP: Record<string, string> = {
  Todas: 'Todas las categorías',
  comida: 'Supermercado & Alimentación',
  insumos: 'Insumos & Casa',
  servicios: 'Servicios & Suscripciones',
};

export default function Finanzas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [savingSalary, setSavingSalary] = useState(false);
  const [submittingCat, setSubmittingCat] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalCat, setModalCat] = useState<'comida' | 'insumos' | 'servicios'>('comida');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
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
    const { data: salData, error: salErr } = await supabase
      .from('finance_salary')
      .select('amount')
      .eq('user_id', user.id);

    if (salErr) {
      toast.error('Error al cargar salario: ' + salErr.message);
    } else if (salData && salData.length > 0) {
      setSalary(salData[0].amount);
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

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nuevo Gasto</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
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
          </motion.button>

          <div className="flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 glass dark:dark-glass px-5 py-2.5 rounded-2xl shadow-sm">
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
          { label: 'Salario', value: salary, color: 'text-black dark:text-white', bg: 'bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass' },
          { label: 'Comida', value: getCategoryTotal('comida'), color: 'text-[var(--color-info)]', bg: 'bg-white dark:bg-gray-900' },
          { label: 'Insumos', value: getCategoryTotal('insumos'), color: 'text-[var(--color-warning)]', bg: 'bg-white dark:bg-gray-900' },
          { label: 'Servicios', value: getCategoryTotal('servicios'), color: 'text-[var(--color-success)]', bg: 'bg-white dark:bg-gray-900' },
          { label: 'Total Gastos', value: globalTotal, color: 'text-[var(--color-danger)]', highlight: true, bg: 'bg-red-50/50 dark:bg-red-950/20' },
        ].map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            key={item.label}
            className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${
              item.highlight 
                ? 'border-red-200/50 dark:border-red-900/50 ' + item.bg
                : 'border-gray-100/50 dark:border-gray-800/50 ' + item.bg
            } shadow-sm hover:shadow-md transition-shadow`}
          >
            <p className="font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 md:mb-2">
              {item.label}
            </p>
            <h3 className={`font-dm-sans text-xl md:text-2xl font-bold ${item.color}`}>
              {formatAmount(item.value)}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Search Bar & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {Object.entries(CATEGORIES_MAP).map(([catKey]) => (
            <button
              key={catKey}
              onClick={() => setFilterCategory(catKey)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterCategory === catKey
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {catKey === 'Todas' ? 'Todas' : catKey}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-64">
          <input
            type="text"
            placeholder="Buscar en gastos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        </div>
      </div>

      {/* Expenses Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['comida', 'insumos', 'servicios'] as const).filter(c => filterCategory === 'Todas' || filterCategory === c).map((cat, catIndex) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + (catIndex * 0.1), duration: 0.4 }}
            key={cat} 
            className="space-y-6"
          >
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

            <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
              <div className="flex-1 p-2 md:p-4 space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {expenses.filter((e) => e.category === cat && (!searchTerm || e.concept.toLowerCase().includes(searchTerm.toLowerCase()))).map((exp) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={exp.id} 
                      className="group bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 flex items-center justify-between transition-colors hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex flex-col">
                        <span className="font-inter text-sm text-gray-700 dark:text-gray-200 font-medium">{exp.concept}</span>
                        <span className="font-dm-sans text-sm font-bold text-[var(--color-info)] dark:text-[var(--vibrant-sky-blue)] mt-1">
                          {formatAmount(exp.amount)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-2 text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 active:scale-95"
                        title="Eliminar gasto"
                      >
                        <HiOutlineTrash />
                      </button>
                    </motion.div>
                  ))}
                  {expenses.filter((e) => e.category === cat && (!searchTerm || e.concept.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 font-inter"
                    >
                      No hay gastos registrados
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Registrar Gasto</h2>
                  <p className="font-inter text-xs text-gray-400">Ingresa la información de tu nuevo gasto financiero.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await handleAddExpense(modalCat);
                setShowAddModal(false);
              }} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Categoría</label>
                    <select
                      value={modalCat}
                      onChange={(e) => {
                        const val = e.target.value as 'comida' | 'insumos' | 'servicios';
                        setModalCat(val);
                        setNewExpense({ ...newExpense, category: val });
                      }}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 capitalize"
                    >
                      <option value="comida" className="dark:bg-gray-800">Comida 🍔</option>
                      <option value="insumos" className="dark:bg-gray-800">Insumos 🛒</option>
                      <option value="servicios" className="dark:bg-gray-800">Servicios ⚡</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Concepto del Gasto *</label>
                    <input
                      required
                      placeholder="Ej. Mercado semanal, Internet, Uber..."
                      value={newExpense.concept}
                      onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value, category: modalCat })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Monto ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value, category: modalCat })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCat === modalCat}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingCat === modalCat ? 'Guardando...' : 'Guardar Gasto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        , document.body))}
      </AnimatePresence>
    </div>
  );
}
