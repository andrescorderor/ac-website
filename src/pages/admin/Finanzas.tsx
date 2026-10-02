import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineEye, 
  HiOutlineEyeOff, 
  HiOutlineSearch, 
  HiX,
  HiOutlineCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineClock,
  HiOutlineRefresh
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import MandadoModal from '@/components/admin/MandadoModal';
import { motion, AnimatePresence } from 'framer-motion';

export type Expense = {
  id: string;
  category: 'comida' | 'insumos' | 'servicios';
  concept: string;
  amount: number;
  date?: string | null;
  created_at?: string | null;
};

export type RecurrenceDist = 'split' | 'q1' | 'q2';

export interface ParsedExpenseInfo {
  isBase: boolean;
  recurrenceDist: RecurrenceDist;
  cleanConcept: string;
  isMandado: boolean;
}

/**
 * Helper to identify whether an expense is a permanent Base Fija or a variable/dated purchase.
 * - [Fijo] or [Fijo Q1] or [Fijo Q2] -> Permanent Base Fija applied every month.
 * - [Ocasional] -> Specific variable expense of that month.
 * - Defaults:
 *   - 'servicios' (without Mandado prefix) defaults to Base Fija (split 50/50).
 *   - 'comida' or 'insumos' or starting with 'Mandado — ' default to variable monthly purchase.
 */
export const parseExpenseInfo = (exp: Expense): ParsedExpenseInfo => {
  const concept = exp.concept || '';
  const isMandado = concept.startsWith('Mandado — ') || concept.startsWith('Mandado - ');

  if (concept.includes('[Fijo Q1]')) {
    return {
      isBase: true,
      recurrenceDist: 'q1',
      cleanConcept: concept.replace(/\[Fijo Q1\]/g, '').trim(),
      isMandado: false,
    };
  }
  if (concept.includes('[Fijo Q2]')) {
    return {
      isBase: true,
      recurrenceDist: 'q2',
      cleanConcept: concept.replace(/\[Fijo Q2\]/g, '').trim(),
      isMandado: false,
    };
  }
  if (concept.includes('[Fijo]')) {
    return {
      isBase: true,
      recurrenceDist: 'split',
      cleanConcept: concept.replace(/\[Fijo\]/g, '').trim(),
      isMandado: false,
    };
  }
  if (concept.includes('[Ocasional]')) {
    return {
      isBase: false,
      recurrenceDist: 'split',
      cleanConcept: concept.replace(/\[Ocasional\]/g, '').trim(),
      isMandado,
    };
  }

  // Automatic heuristic for backward compatibility:
  if (exp.category === 'servicios' && !isMandado) {
    return {
      isBase: true,
      recurrenceDist: 'split',
      cleanConcept: concept.trim(),
      isMandado: false,
    };
  }

  return {
    isBase: false,
    recurrenceDist: 'split',
    cleanConcept: concept.trim(),
    isMandado,
  };
};

const CATEGORIES_MAP: Record<string, string> = {
  Todas: 'Todas las categorías',
  servicios: 'Servicios & Base Fija',
  comida: 'Supermercado & Mandado',
  insumos: 'Insumos & Casa',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type PeriodFilter = 'month' | 'q1' | 'q2';
type ViewMode = 'categories' | 'history';
type HistoryFilter = 'all' | 'base' | 'variable';

export default function Finanzas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [savingSalary, setSavingSalary] = useState(false);
  const [submittingCat, setSubmittingCat] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMandadoModal, setShowMandadoModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  
  // Date and Period Filter State
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');

  // Form State for new expense
  const [newExpense, setNewExpense] = useState({
    concept: '',
    amount: '',
    category: 'servicios' as 'comida' | 'insumos' | 'servicios',
    date: new Date().toISOString().split('T')[0],
    isBase: true,
    quincenaDist: 'split' as RecurrenceDist,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    const handleFinanceChanged = () => fetchData();
    window.addEventListener('ac_finance_changed', handleFinanceChanged);
    return () => window.removeEventListener('ac_finance_changed', handleFinanceChanged);
  }, []);

  const handleMandadoModalClose = () => {
    setShowMandadoModal(false);
    fetchData();
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Query ordered by created_at to avoid crashing if `date` column doesn't exist yet
      const [expRes, salRes] = await Promise.all([
        supabase
          .from('finance_expenses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('finance_salary')
          .select('amount')
          .eq('user_id', user.id),
      ]);

      if (expRes.error) throw expRes.error;

      if (expRes.data) {
        setExpenses(expRes.data);
      }

      if (salRes.data && salRes.data.length > 0) {
        setSalary(salRes.data[0].amount);
      }
    } catch (err: any) {
      toast.error('Error al cargar finanzas: ' + err.message);
    } finally {
      setLoading(false);
    }
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
      toast.success('Salario mensual actualizado correctamente');
    } catch (err: any) {
      toast.error('Error al actualizar salario: ' + err.message);
    } finally {
      setSavingSalary(false);
    }
  };

  const handleAddExpense = async (category: 'comida' | 'insumos' | 'servicios') => {
    if (!newExpense.concept || !newExpense.amount) {
      toast.error('Por favor ingresa concepto y monto');
      return;
    }
    setSubmittingCat(category);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const expenseDate = newExpense.date || new Date().toISOString().split('T')[0];
      let finalConcept = newExpense.concept.trim();

      if (newExpense.isBase) {
        if (newExpense.quincenaDist === 'q1') {
          finalConcept = `[Fijo Q1] ${finalConcept}`;
        } else if (newExpense.quincenaDist === 'q2') {
          finalConcept = `[Fijo Q2] ${finalConcept}`;
        } else {
          if (category !== 'servicios') {
            finalConcept = `[Fijo] ${finalConcept}`;
          }
        }
      } else {
        if (category === 'servicios') {
          finalConcept = `[Ocasional] ${finalConcept}`;
        }
      }

      const expensePayload: any = {
        user_id: user.id,
        category,
        concept: finalConcept,
        amount: parseFloat(newExpense.amount),
        created_at: new Date(expenseDate + 'T12:00:00Z').toISOString(),
      };

      let insertedData: any = null;
      // Try inserting with date column first, fallback without date if column doesn't exist
      const { data: insData, error: insErr } = await supabase
        .from('finance_expenses')
        .insert([{ ...expensePayload, date: expenseDate }])
        .select();

      if (insErr) {
        const { data: fbData, error: fbErr } = await supabase
          .from('finance_expenses')
          .insert([expensePayload])
          .select();
        if (fbErr) throw fbErr;
        insertedData = fbData;
      } else {
        insertedData = insData;
      }

      if (insertedData && insertedData[0]) {
        setExpenses([insertedData[0], ...expenses]);
        setNewExpense({
          concept: '',
          amount: '',
          category: 'servicios',
          date: new Date().toISOString().split('T')[0],
          isBase: true,
          quincenaDist: 'split',
        });
        toast.success(newExpense.isBase ? 'Gasto Base Recurrente registrado ✨' : 'Gasto registrado correctamente ✨');
      }
    } catch (err: any) {
      toast.error('Error al registrar gasto: ' + err.message);
    } finally {
      setSubmittingCat(null);
    }
  };

  const handleToggleRecurrence = async (exp: Expense) => {
    const info = parseExpenseInfo(exp);
    let newConcept = '';

    if (info.isBase) {
      newConcept = exp.category === 'servicios' ? `[Ocasional] ${info.cleanConcept}` : info.cleanConcept;
    } else {
      newConcept = exp.category === 'servicios' ? info.cleanConcept : `[Fijo] ${info.cleanConcept}`;
    }

    try {
      const { error } = await supabase
        .from('finance_expenses')
        .update({ concept: newConcept })
        .eq('id', exp.id);

      if (error) throw error;
      setExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, concept: newConcept } : e));
      toast.success(info.isBase ? 'Cambiado a Gasto de este mes 📅' : 'Cambiado a Base Fija Recurrente 🔄');
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  const handleCycleQuincenaDist = async (exp: Expense) => {
    const info = parseExpenseInfo(exp);
    if (!info.isBase) return;

    let nextDist: RecurrenceDist = 'split';
    if (info.recurrenceDist === 'split') nextDist = 'q1';
    else if (info.recurrenceDist === 'q1') nextDist = 'q2';
    else nextDist = 'split';

    let newConcept = '';
    if (nextDist === 'q1') {
      newConcept = `[Fijo Q1] ${info.cleanConcept}`;
    } else if (nextDist === 'q2') {
      newConcept = `[Fijo Q2] ${info.cleanConcept}`;
    } else {
      newConcept = exp.category === 'servicios' ? info.cleanConcept : `[Fijo] ${info.cleanConcept}`;
    }

    try {
      const { error } = await supabase
        .from('finance_expenses')
        .update({ concept: newConcept })
        .eq('id', exp.id);

      if (error) throw error;
      setExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, concept: newConcept } : e));
      const label = nextDist === 'split' ? 'Ambas Quincenas (50/50)' : nextDist === 'q1' ? 'Solo 1ra Quincena (Q1)' : 'Solo 2da Quincena (Q2)';
      toast.success(`Distribución: ${label}`);
    } catch (err: any) {
      toast.error('Error al cambiar distribución: ' + err.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find((e) => e.id === id);
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));

      toast.undoable('Gasto eliminado', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = expenseToDelete as any;
          const { error: restoreErr } = await supabase.from('finance_expenses').insert([{
            id: expenseToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchData();
          toast.success('Gasto restaurado ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar gasto: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar gasto: ' + err.message);
    }
  };

  // Helper to extract year, month, day and quincena
  const getExpenseMeta = (exp: Expense) => {
    const dateStr = exp.date || (exp.created_at ? exp.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-').map(Number);
    const day = !isNaN(d) ? d : 1;
    const month = !isNaN(m) ? m - 1 : new Date().getMonth(); // 0-indexed
    const year = !isNaN(y) ? y : new Date().getFullYear();
    const quincena: 1 | 2 = day <= 15 ? 1 : 2;
    return { year, month, day, quincena, cleanDate };
  };

  // ═══ SEPARACIÓN DE BASE FIJA RECURRENTE VS GASTOS VARIABLES DE MANDADO ═══
  const baseExpensesList = useMemo(() => {
    return expenses.filter(e => parseExpenseInfo(e).isBase);
  }, [expenses]);

  const variableExpensesList = useMemo(() => {
    return expenses.filter(e => !parseExpenseInfo(e).isBase);
  }, [expenses]);

  // Gastos variables filtrados estrictamente por Mes y Año seleccionados
  const currentMonthVariableExpenses = useMemo(() => {
    return variableExpensesList.filter((e) => {
      const meta = getExpenseMeta(e);
      return meta.year === selectedYear && meta.month === selectedMonth;
    });
  }, [variableExpensesList, selectedYear, selectedMonth]);

  const q1VariableExpenses = useMemo(() => {
    return currentMonthVariableExpenses.filter((e) => getExpenseMeta(e).quincena === 1);
  }, [currentMonthVariableExpenses]);

  const q2VariableExpenses = useMemo(() => {
    return currentMonthVariableExpenses.filter((e) => getExpenseMeta(e).quincena === 2);
  }, [currentMonthVariableExpenses]);

  // Cuánto impacta un gasto base según el período visto (Mes, Q1, Q2)
  const getBaseExpenseAmountForPeriod = (exp: Expense, period: PeriodFilter): number => {
    const info = parseExpenseInfo(exp);
    if (!info.isBase) return 0;
    if (period === 'month') return exp.amount;
    if (period === 'q1') {
      if (info.recurrenceDist === 'q1') return exp.amount;
      if (info.recurrenceDist === 'q2') return 0;
      return exp.amount / 2;
    }
    if (period === 'q2') {
      if (info.recurrenceDist === 'q2') return exp.amount;
      if (info.recurrenceDist === 'q1') return 0;
      return exp.amount / 2;
    }
    return exp.amount;
  };

  // Totales de Base Fija por Período
  const baseMonthTotal = useMemo(() => {
    return baseExpensesList.reduce((acc, e) => acc + e.amount, 0);
  }, [baseExpensesList]);

  const baseQ1Total = useMemo(() => {
    return baseExpensesList.reduce((acc, e) => acc + getBaseExpenseAmountForPeriod(e, 'q1'), 0);
  }, [baseExpensesList]);

  const baseQ2Total = useMemo(() => {
    return baseExpensesList.reduce((acc, e) => acc + getBaseExpenseAmountForPeriod(e, 'q2'), 0);
  }, [baseExpensesList]);

  // Totales de Mandado y Variables
  const varMonthTotal = useMemo(() => {
    return currentMonthVariableExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [currentMonthVariableExpenses]);

  const varQ1Total = useMemo(() => {
    return q1VariableExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [q1VariableExpenses]);

  const varQ2Total = useMemo(() => {
    return q2VariableExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [q2VariableExpenses]);

  // Totales Combinados (Base Fija + Mandado/Variables)
  const totalQ1 = baseQ1Total + varQ1Total;
  const totalQ2 = baseQ2Total + varQ2Total;
  const totalMonth = baseMonthTotal + varMonthTotal;

  // Totales del período activo seleccionado
  const activeBaseTotal = selectedPeriod === 'month' ? baseMonthTotal : selectedPeriod === 'q1' ? baseQ1Total : baseQ2Total;
  const activeVariableTotal = selectedPeriod === 'month' ? varMonthTotal : selectedPeriod === 'q1' ? varQ1Total : varQ2Total;
  const periodTotalSpent = activeBaseTotal + activeVariableTotal;
  const periodSalary = selectedPeriod === 'month' ? salary : salary / 2;
  const periodRemaining = periodSalary - periodTotalSpent;

  // Lista activa de gastos para mostrar en la vista
  const activePeriodBaseExpenses = useMemo(() => {
    return baseExpensesList.filter((e) => {
      const info = parseExpenseInfo(e);
      if (selectedPeriod === 'month') return true;
      if (selectedPeriod === 'q1') return info.recurrenceDist !== 'q2';
      if (selectedPeriod === 'q2') return info.recurrenceDist !== 'q1';
      return true;
    });
  }, [baseExpensesList, selectedPeriod]);

  const activePeriodVariableExpenses = useMemo(() => {
    if (selectedPeriod === 'q1') return q1VariableExpenses;
    if (selectedPeriod === 'q2') return q2VariableExpenses;
    return currentMonthVariableExpenses;
  }, [selectedPeriod, q1VariableExpenses, q2VariableExpenses, currentMonthVariableExpenses]);

  const activePeriodExpenses = useMemo(() => {
    return [...activePeriodBaseExpenses, ...activePeriodVariableExpenses];
  }, [activePeriodBaseExpenses, activePeriodVariableExpenses]);

  // Total por categoría para el período activo
  const getCategoryTotal = (category: string) => {
    let sum = 0;
    activePeriodBaseExpenses.filter((e) => e.category === category).forEach((e) => {
      sum += getBaseExpenseAmountForPeriod(e, selectedPeriod);
    });
    activePeriodVariableExpenses.filter((e) => e.category === category).forEach((e) => {
      sum += e.amount;
    });
    return sum;
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const formatAmount = (val: number) => {
    if (isPrivacyMode) return '$••••••';
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10 pb-28 sm:pb-20 max-w-7xl mx-auto">
      {/* ═══ Header ═══ */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Control de <span className="text-gradient">Finanzas</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Base fija recurrente de servicios mensual y gastos acumulativos de mandado por quincena.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowMandadoModal(true)}
            className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-syne text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 min-h-[44px]"
            title="Abrir lista de Mandado Semanal y Modo Súper"
          >
            <span>🥗 Mandado Semanal & Modo Súper</span>
          </button>

          <button
            onClick={() => {
              setNewExpense({
                concept: '',
                amount: '',
                category: 'servicios',
                date: new Date().toISOString().split('T')[0],
                isBase: true,
                quincenaDist: 'split',
              });
              setShowAddModal(true);
            }}
            className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 min-h-[44px]"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nuevo Gasto / Base Fija</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all min-h-[44px]"
          >
            {isPrivacyMode ? (
              <>
                <HiOutlineEyeOff className="text-lg text-gray-400" />
                <span>Mostrar</span>
              </>
            ) : (
              <>
                <HiOutlineEye className="text-lg text-emerald-500" />
                <span>Ocultar</span>
              </>
            )}
          </motion.button>

          <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 glass dark:dark-glass px-4 py-2 rounded-2xl shadow-xs border border-gray-200/50 dark:border-gray-700/50 min-h-[44px]">
            <div className="space-y-0.5">
              <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 block leading-tight">
                Salario Mensual
              </span>
              <span className="font-inter text-[10px] text-gray-400 dark:text-gray-500 block leading-tight">
                (Q: {formatAmount(salary / 2)})
              </span>
            </div>
            <div className="relative">
              <span className="text-gray-400 font-dm-sans font-bold text-xs">$</span>
              <input
                type={isPrivacyMode ? "password" : "number"}
                step="50"
                value={salary}
                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                onBlur={handleUpdateSalary}
                className="w-24 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white font-dm-sans font-bold text-sm text-gray-900 dark:text-white outline-none text-right transition-colors pl-1"
              />
            </div>
            {savingSalary && <span className="text-[9px] font-syne text-gray-400 animate-pulse">...</span>}
          </div>
        </div>
      </header>

      {/* ═══ BARRA DE CONTROL DE PERÍODO (MES & QUINCENA) ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/70 dark:bg-gray-900/70 glass dark:dark-glass p-3 sm:p-4 rounded-3xl border border-gray-200/60 dark:border-gray-800 shadow-xs">
        {/* Selector de Mes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-1 border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={handlePrevMonth}
              className="cursor-pointer p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition-all"
              title="Mes anterior"
            >
              <HiChevronLeft className="text-base" />
            </button>
            <span className="font-syne font-bold text-xs sm:text-sm uppercase tracking-wider px-3 min-w-[130px] sm:min-w-[150px] text-center text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
              <HiOutlineCalendar className="text-emerald-500 shrink-0" />
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            </span>
            <button
              onClick={handleNextMonth}
              className="cursor-pointer p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition-all"
              title="Mes siguiente"
            >
              <HiChevronRight className="text-base" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={handleResetToCurrentMonth}
              className="cursor-pointer px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Mes Actual
            </button>
          )}
        </div>

        {/* Pestañas de Quincena vs Mes */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`cursor-pointer px-3.5 py-2 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedPeriod === 'month'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>📅 Mes Completo</span>
          </button>
          <button
            onClick={() => setSelectedPeriod('q1')}
            className={`cursor-pointer px-3.5 py-2 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedPeriod === 'q1'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span className="size-2 rounded-full bg-current" />
            <span>1ra Quincena (1-15)</span>
          </button>
          <button
            onClick={() => setSelectedPeriod('q2')}
            className={`cursor-pointer px-3.5 py-2 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedPeriod === 'q2'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
            }`}
          >
            <span className="size-2 rounded-full bg-current" />
            <span>2da Quincena (16-Fin)</span>
          </button>
        </div>
      </div>

      {/* ═══ TARJETAS COMPARATIVAS DE QUINCENAS (RESUMEN QUINCENAL CON BASE + MANDADO) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Q1 Card */}
        <div 
          onClick={() => setSelectedPeriod('q1')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md ${
            selectedPeriod === 'q1'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass border-gray-200/50 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              1ra Quincena (Días 1 al 15)
            </span>
            <span className={`text-[10px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              (salary / 2) - totalQ1 >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
            }`}>
              {(salary / 2) - totalQ1 >= 0 ? 'Ahorro' : 'Déficit'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Total Comprometido</p>
              <p className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(totalQ1)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Restante Quincena</p>
              <p className={`font-dm-sans text-lg font-bold ${
                (salary / 2) - totalQ1 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatAmount((salary / 2) - totalQ1)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-inter text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-gray-700 dark:text-gray-300">Base Fija:</span> {formatAmount(baseQ1Total)}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-emerald-600 dark:text-emerald-400">Mandado:</span> {formatAmount(varQ1Total)}
            </span>
          </div>
        </div>

        {/* Q2 Card */}
        <div 
          onClick={() => setSelectedPeriod('q2')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md ${
            selectedPeriod === 'q2'
              ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
              : 'bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass border-gray-200/50 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500" />
              2da Quincena (Días 16 al Fin)
            </span>
            <span className={`text-[10px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              (salary / 2) - totalQ2 >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
            }`}>
              {(salary / 2) - totalQ2 >= 0 ? 'Ahorro' : 'Déficit'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Total Comprometido</p>
              <p className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(totalQ2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Restante Quincena</p>
              <p className={`font-dm-sans text-lg font-bold ${
                (salary / 2) - totalQ2 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatAmount((salary / 2) - totalQ2)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-inter text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-gray-700 dark:text-gray-300">Base Fija:</span> {formatAmount(baseQ2Total)}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-sky-600 dark:text-sky-400">Mandado:</span> {formatAmount(varQ2Total)}
            </span>
          </div>
        </div>

        {/* Mes Completo Summary Card */}
        <div 
          onClick={() => setSelectedPeriod('month')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md ${
            selectedPeriod === 'month'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
              : 'bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass border-gray-200/50 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-500" />
              Total Mes Completo
            </span>
            <span className={`text-[10px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              salary - totalMonth >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
            }`}>
              {salary - totalMonth >= 0 ? 'Ahorro Mes' : 'Déficit Mes'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Total Gastado</p>
              <p className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(totalMonth)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400">Restante Salario</p>
              <p className={`font-dm-sans text-lg font-bold ${
                salary - totalMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatAmount(salary - totalMonth)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-inter text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-gray-700 dark:text-gray-300">Base Fija:</span> {formatAmount(baseMonthTotal)}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-syne font-bold text-purple-600 dark:text-purple-400">Mandado:</span> {formatAmount(varMonthTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ TARJETAS DE MÉTRICAS DEL PERÍODO SELECCIONADO ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {[
          { 
            label: selectedPeriod === 'month' ? 'Presupuesto Mes' : 'Presupuesto Quincena', 
            value: periodSalary, 
            color: 'text-gray-900 dark:text-white', 
            bg: 'bg-white dark:bg-gray-900' 
          },
          { 
            label: 'Base Fija (Recurrente)', 
            value: activeBaseTotal, 
            color: 'text-purple-600 dark:text-purple-400', 
            bg: 'bg-white dark:bg-gray-900',
            badge: `${baseExpensesList.length} fijos`
          },
          { 
            label: 'Mandado & Compras', 
            value: activeVariableTotal, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-white dark:bg-gray-900',
            badge: `${activePeriodVariableExpenses.length} items`
          },
          { 
            label: 'Servicios', 
            value: getCategoryTotal('servicios'), 
            color: 'text-[var(--color-info)]', 
            bg: 'bg-white dark:bg-gray-900' 
          },
          { 
            label: 'Total Período', 
            value: periodTotalSpent, 
            color: 'text-[var(--color-danger)]', 
            bg: 'bg-red-50/50 dark:bg-red-950/20', 
            border: 'border-red-200/50 dark:border-red-900/50' 
          },
          { 
            label: 'Restante Período', 
            value: periodRemaining, 
            color: periodRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', 
            bg: periodRemaining >= 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-red-50/50 dark:bg-red-950/20',
            border: periodRemaining >= 0 ? 'border-emerald-200/50 dark:border-emerald-900/50' : 'border-red-200/50 dark:border-red-900/50',
            badge: periodRemaining >= 0 ? 'Ahorro' : 'Déficit'
          },
        ].map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            key={item.label}
            className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border ${
              item.border || 'border-gray-100/50 dark:border-gray-800/50'
            } ${item.bg} shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden`}
          >
            <div className="flex justify-between items-center mb-1">
              <p className="font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-syne font-bold uppercase tracking-wider ${
                  item.badge === 'Ahorro'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
                    : item.badge === 'Déficit'
                    ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </div>
            <h3 className={`font-dm-sans text-xl md:text-2xl font-bold ${item.color}`}>
              {formatAmount(item.value)}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* ═══ VISTA PRINCIPAL: SWITCH ENTRE CATEGORÍAS & HISTORIAL CRONOLÓGICO ═══ */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Selector de Vista: Columnas vs Historial Cronológico */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shrink-0">
            <button
              onClick={() => setViewMode('categories')}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all ${
                viewMode === 'categories'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Por Categorías
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'history'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <HiOutlineClock className="text-sm" />
              <span>📜 Historial y Base Fija ({activePeriodExpenses.length})</span>
            </button>
          </div>

          {/* Filtros de Categoría y Buscador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {viewMode === 'categories' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {Object.entries(CATEGORIES_MAP).map(([catKey, label]) => (
                  <button
                    key={catKey}
                    onClick={() => setFilterCategory(catKey)}
                    className={`cursor-pointer px-3.5 py-2 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      filterCategory === catKey
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Buscar en gastos del período..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none font-inter text-xs shadow-2xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-emerald-500"
              />
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            </div>
          </div>
        </div>

        {/* ═══ VISTA 1: COLUMNAS POR CATEGORÍA ═══ */}
        {viewMode === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {(['servicios', 'comida', 'insumos'] as const)
              .filter(c => filterCategory === 'Todas' || filterCategory === c)
              .map((cat, catIndex) => {
                const catExpenses = activePeriodExpenses.filter(
                  (e) => e.category === cat && (!searchTerm || e.concept.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + (catIndex * 0.08), duration: 0.3 }}
                    key={cat} 
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="font-dm-sans text-xl font-bold capitalize text-black dark:text-white">
                          {cat === 'servicios' ? 'Servicios & Base Fija ⚡' : cat === 'comida' ? 'Mandado & Comida 🍔' : 'Insumos & Casa 🛒'}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (cat === 'servicios') {
                              setNewExpense({
                                concept: '',
                                amount: '',
                                category: 'servicios',
                                date: new Date().toISOString().split('T')[0],
                                isBase: true,
                                quincenaDist: 'split',
                              });
                              setShowAddModal(true);
                            } else {
                              setShowMandadoModal(true);
                            }
                          }}
                          className="cursor-pointer px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black font-syne text-[10px] font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center gap-1"
                          title={cat === 'servicios' ? 'Registrar servicio o gasto fijo recurrente' : 'Abrir Mandado para comprar en Modo Súper'}
                        >
                          <HiOutlinePlus className="text-xs" />
                          <span>{cat === 'servicios' ? '+ Base Fija' : 'Modo Súper'}</span>
                        </button>
                        <span className="font-syne text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-xs">
                          Total: <span className="text-[var(--color-info)] dark:text-[var(--vibrant-sky-blue)]">{formatAmount(getCategoryTotal(cat))}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] overflow-hidden shadow-xs border border-gray-200/50 dark:border-gray-800 flex flex-col">
                      <div className="flex-1 p-3 md:p-4 space-y-2.5 max-h-[480px] overflow-y-auto scrollbar-thin">
                        <AnimatePresence>
                          {catExpenses.map((exp) => {
                            const meta = getExpenseMeta(exp);
                            const info = parseExpenseInfo(exp);
                            const effectiveAmount = info.isBase 
                              ? getBaseExpenseAmountForPeriod(exp, selectedPeriod)
                              : exp.amount;

                            return (
                              <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                key={exp.id} 
                                className="group bg-white dark:bg-gray-800/90 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between transition-colors hover:border-gray-300 dark:hover:border-gray-600 gap-3"
                              >
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-inter text-sm text-gray-800 dark:text-gray-100 font-medium truncate">
                                      {info.cleanConcept}
                                    </span>
                                    
                                    {info.isBase ? (
                                      <button
                                        type="button"
                                        onClick={() => handleCycleQuincenaDist(exp)}
                                        className="cursor-pointer px-2 py-0.5 rounded-full text-[8px] font-syne font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 hover:scale-105 transition-all flex items-center gap-1"
                                        title="Clic para cambiar distribución: 50/50, Solo Q1 o Solo Q2"
                                      >
                                        <HiOutlineRefresh className="text-[10px]" />
                                        <span>
                                          Base Fija ({info.recurrenceDist === 'split' ? '50/50' : info.recurrenceDist.toUpperCase()})
                                        </span>
                                      </button>
                                    ) : (
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-syne font-bold uppercase tracking-wider ${
                                        meta.quincena === 1
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                          : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                      }`}>
                                        Q{meta.quincena} ({meta.day} {MONTH_NAMES[meta.month].slice(0, 3)})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-dm-sans text-sm font-bold text-[var(--color-info)] dark:text-[var(--vibrant-sky-blue)]">
                                      {formatAmount(effectiveAmount)}
                                    </span>
                                    {info.isBase && selectedPeriod !== 'month' && info.recurrenceDist === 'split' && (
                                      <span className="text-[10px] font-inter text-gray-400">
                                        ({formatAmount(exp.amount)}/mes)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleToggleRecurrence(exp)}
                                    className="cursor-pointer p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-xs"
                                    title={info.isBase ? "Cambiar a gasto ocasional de este mes" : "Convertir en Base Fija mensual recurrente"}
                                  >
                                    <HiOutlineRefresh className="text-sm" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="cursor-pointer p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 active:scale-95 shrink-0"
                                    title="Eliminar gasto"
                                  >
                                    <HiOutlineTrash className="text-base" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}

                          {catExpenses.length === 0 && (
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 font-inter"
                            >
                              No hay gastos en esta categoría para el período seleccionado
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}

        {/* ═══ VISTA 2: HISTORIAL Y BASE FIJA ═══ */}
        {viewMode === 'history' && (
          <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] border border-gray-200/50 dark:border-gray-800 shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 gap-3">
              <div>
                <h3 className="font-dm-sans text-lg font-bold text-gray-900 dark:text-white">
                  Histórico y Base Fija • {selectedPeriod === 'q1' ? '1ra Quincena' : selectedPeriod === 'q2' ? '2da Quincena' : 'Mes Completo'} ({MONTH_NAMES[selectedMonth]} {selectedYear})
                </h3>
                <p className="font-inter text-xs text-gray-400">
                  Desglose de la base mensual fija recurrente y las compras reales de mandado acumuladas.
                </p>
              </div>

              {/* Subfiltro de Historial: Todos / Solo Base Fija / Solo Mandado */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                    historyFilter === 'all'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({activePeriodExpenses.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('base')}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                    historyFilter === 'base'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                >
                  <span>📌 Base Fija ({activePeriodBaseExpenses.length})</span>
                </button>
                <button
                  onClick={() => setHistoryFilter('variable')}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                    historyFilter === 'variable'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <span>🥗 Mandado ({activePeriodVariableExpenses.length})</span>
                </button>
              </div>
            </div>

            {activePeriodExpenses.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <p className="font-dm-sans font-bold text-base text-gray-700 dark:text-gray-300">
                  No hay gastos registrados en este período
                </p>
                <p className="font-inter text-xs">
                  Al tachar compras en el Modo Súper o registrar base fija de servicios, aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activePeriodExpenses
                  .filter((e) => {
                    const info = parseExpenseInfo(e);
                    if (historyFilter === 'base' && !info.isBase) return false;
                    if (historyFilter === 'variable' && info.isBase) return false;
                    if (searchTerm && !e.concept.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const infoA = parseExpenseInfo(a);
                    const infoB = parseExpenseInfo(b);
                    // Base items pinned first in list
                    if (infoA.isBase && !infoB.isBase) return -1;
                    if (!infoA.isBase && infoB.isBase) return 1;
                    const dateA = a.date || a.created_at || '';
                    const dateB = b.date || b.created_at || '';
                    return dateB.localeCompare(dateA);
                  })
                  .map((exp) => {
                    const meta = getExpenseMeta(exp);
                    const info = parseExpenseInfo(exp);
                    const effectiveAmount = info.isBase 
                      ? getBaseExpenseAmountForPeriod(exp, selectedPeriod)
                      : exp.amount;

                    return (
                      <div
                        key={exp.id}
                        className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                          info.isBase
                            ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 hover:border-purple-400'
                            : 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            info.isBase
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                              : exp.category === 'comida'
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            <span className="text-lg">
                              {info.isBase ? '🔄' : exp.category === 'comida' ? '🥗' : '🛒'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-dm-sans font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                {info.cleanConcept}
                              </span>

                              {info.isBase ? (
                                <button
                                  type="button"
                                  onClick={() => handleCycleQuincenaDist(exp)}
                                  className="cursor-pointer px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:scale-105 transition-all flex items-center gap-1"
                                  title="Clic para cambiar distribución: 50/50, Solo Q1 o Solo Q2"
                                >
                                  <HiOutlineRefresh className="text-[10px]" />
                                  <span>
                                    Base Fija • {info.recurrenceDist === 'split' ? 'Ambas Q (50/50)' : info.recurrenceDist === 'q1' ? 'Solo Q1' : 'Solo Q2'}
                                  </span>
                                </button>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${
                                  meta.quincena === 1
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                }`}>
                                  {meta.quincena === 1 ? '1ra Quincena' : '2da Quincena'}
                                </span>
                              )}

                              <span className="px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {exp.category}
                              </span>
                            </div>

                            <p className="font-inter text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {info.isBase 
                                ? '📌 Siempre cobrado mensualmente de base' 
                                : `📅 ${meta.day} de ${MONTH_NAMES[meta.month]} de ${meta.year}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white block">
                              {formatAmount(effectiveAmount)}
                            </span>
                            {info.isBase && selectedPeriod !== 'month' && info.recurrenceDist === 'split' && (
                              <span className="font-inter text-[10px] text-gray-400 block">
                                Total: {formatAmount(exp.amount)}/mes
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleRecurrence(exp)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-all"
                            title={info.isBase ? "Cambiar a gasto ocasional de este mes" : "Convertir en Base Fija mensual"}
                          >
                            <HiOutlineRefresh className="text-base" />
                          </button>

                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="cursor-pointer p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all active:scale-95 shrink-0"
                            title="Eliminar gasto"
                          >
                            <HiOutlineTrash className="text-base" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODAL: AGREGAR GASTO / BASE FIJA CON SOPORTE DE DISTRIBUCIÓN ═══ */}
      {createPortal(
        <AnimatePresence>
          {showAddModal && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAddModal(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-lg w-full border-none shadow-2xl my-8 cursor-default overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Registrar Gasto Financiero ⚡</h2>
                    <p className="font-inter text-xs text-gray-400">Configura un gasto base recurrente o un gasto fechado del mes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="cursor-pointer p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await handleAddExpense(newExpense.category || 'servicios');
                  setShowAddModal(false);
                }} className="flex flex-col flex-1 min-h-0">
                  {/* Body */}
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                    {/* Switch: Base Fija vs Gasto de este mes */}
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                        Tipo de Compromiso *
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <button
                          type="button"
                          onClick={() => setNewExpense({ ...newExpense, isBase: true })}
                          className={`cursor-pointer py-2.5 px-3 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            newExpense.isBase
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-gray-600 dark:text-gray-300 hover:text-purple-600'
                          }`}
                        >
                          <HiOutlineRefresh className="text-sm" />
                          <span>🔄 Base Fija</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewExpense({ ...newExpense, isBase: false })}
                          className={`cursor-pointer py-2.5 px-3 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            !newExpense.isBase
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
                          }`}
                        >
                          <HiOutlineCalendar className="text-sm" />
                          <span>📅 Este Mes</span>
                        </button>
                      </div>
                      <p className="font-inter text-[11px] text-gray-400 mt-1.5">
                        {newExpense.isBase
                          ? 'Se cobra siempre cada mes como base fija (Internet, Renta, Suscripciones, etc.).'
                          : 'Aplica únicamente a la fecha/quincena específica elegida.'}
                      </p>
                    </div>

                    {/* Distribución Quincenal para Base Fija */}
                    {newExpense.isBase && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl space-y-2"
                      >
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">
                          Distribución en Quincenas
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'split', label: 'Ambas (50/50)' },
                            { id: 'q1', label: 'Solo 1ª Q (1-15)' },
                            { id: 'q2', label: 'Solo 2ª Q (16-Fin)' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setNewExpense({ ...newExpense, quincenaDist: item.id as RecurrenceDist })}
                              className={`cursor-pointer py-2 px-1 text-center rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider transition-all ${
                                newExpense.quincenaDist === item.id
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-purple-200/50 dark:border-purple-800/40'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Categoría *</label>
                      <CustomSelect
                        value={newExpense.category}
                        onChange={(val) => setNewExpense({ ...newExpense, category: val as any })}
                        options={[
                          { value: 'servicios', label: 'Servicios & Suscripciones ⚡' },
                          { value: 'comida', label: 'Supermercado & Mandado 🍔' },
                          { value: 'insumos', label: 'Insumos & Casa 🛒' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Concepto del Gasto / Servicio *</label>
                      <input
                        required
                        placeholder="Ej. Internet Totalplay, Renta, Luz CFE, Spotify..."
                        value={newExpense.concept}
                        onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-emerald-500"
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
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-emerald-500"
                      />
                    </div>

                    {!newExpense.isBase && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Fecha del Gasto *</label>
                        <CustomDatePicker
                          value={newExpense.date}
                          onChange={(val) => setNewExpense({ ...newExpense, date: val })}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="cursor-pointer px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCat !== null}
                      className="cursor-pointer px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submittingCat !== null ? 'Guardando...' : newExpense.isBase ? 'Guardar Base Fija' : 'Guardar Gasto'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mandado Modal Overlay */}
      <MandadoModal
        isOpen={showMandadoModal}
        onClose={handleMandadoModalClose}
      />
    </div>
  );
}
