import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  HiOutlineCurrencyDollar, 
  HiOutlineClipboardList, 
  HiOutlineLockClosed,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineArrowSmRight,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineDownload
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/ToastContext';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    expenses: 0,
    tasks: 0,
    vault: 0,
    debts: 0,
    shopping: 0,
    reminders: 0,
    bookmarks: 0,
    notes: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [exp, tsk, vlt, dbt, shp, rem, bkm, nts] = await Promise.all([
      supabase.from('finance_expenses').select('amount'),
      supabase.from('tasks').select('id').eq('completed', false),
      supabase.from('vault_items').select('id'),
      supabase.from('debts').select('amount').eq('settled', false),
      supabase.from('shopping_list').select('id').eq('bought', false),
      supabase.from('reminders').select('id'),
      supabase.from('bookmarks').select('id'),
      supabase.from('notes').select('id')
    ]);

    setStats({
      expenses: exp.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      tasks: tsk.data?.length || 0,
      vault: vlt.data?.length || 0,
      debts: dbt.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      shopping: shp.data?.length || 0,
      reminders: rem.data?.length || 0,
      bookmarks: bkm.data?.length || 0,
      notes: nts.data?.length || 0
    });
    setLoading(false);
  };

  const exportBackup = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesión no válida');
        return;
      }

      const [exp, sal, tsk, dbt, vlt, shp, rem, nts] = await Promise.all([
        supabase.from('finance_expenses').select('*'),
        supabase.from('finance_salary').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('vault_items').select('*'),
        supabase.from('shopping_list').select('*'),
        supabase.from('reminders').select('*'),
        supabase.from('notes').select('*'),
      ]);

      const backupObj = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        user_email: user.email,
        tables: {
          finance_expenses: exp.data || [],
          finance_salary: sal.data || [],
          tasks: tsk.data || [],
          debts: dbt.data || [],
          vault_items: vlt.data || [],
          shopping_list: shp.data || [],
          reminders: rem.data || [],
          notes: nts.data || [],
        }
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `respaldo_panel_andres_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Respaldo JSON descargado correctamente');
    } catch (err: any) {
      toast.error('Error al exportar respaldo: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const cards = [
    { 
      label: 'Gastos Mensuales', 
      rawVal: `$${stats.expenses.toLocaleString()}`,
      isMonetary: true,
      icon: HiOutlineCurrencyDollar, 
      color: 'bg-blue-500', 
      path: '/admin/panel/finanzas' 
    },
    { 
      label: 'Tareas Pendientes', 
      rawVal: stats.tasks, 
      isMonetary: false,
      icon: HiOutlineClipboardList, 
      color: 'bg-orange-500', 
      path: '/admin/panel/pendientes' 
    },
    { 
      label: 'Cuentas por Cobrar', 
      rawVal: `$${stats.debts.toLocaleString()}`, 
      isMonetary: true,
      icon: HiOutlineUserGroup, 
      color: 'bg-red-500', 
      path: '/admin/panel/deudas' 
    },
    { 
      label: 'Textos en Bóveda', 
      rawVal: stats.vault, 
      isMonetary: false,
      icon: HiOutlineLockClosed, 
      color: 'bg-purple-500', 
      path: '/admin/panel/vault' 
    },
    { 
      label: 'Lista de Compras', 
      rawVal: stats.shopping, 
      isMonetary: false,
      icon: HiOutlineShoppingBag, 
      color: 'bg-green-500', 
      path: '/admin/panel/compras' 
    },
    { 
      label: 'Recordatorios', 
      rawVal: stats.reminders, 
      isMonetary: false,
      icon: HiOutlineCalendar, 
      color: 'bg-pink-500', 
      path: '/admin/panel/recordatorios' 
    },
    { 
      label: 'Notas Importantes', 
      rawVal: stats.notes, 
      isMonetary: false,
      icon: HiOutlineDocumentText, 
      color: 'bg-emerald-500', 
      path: '/admin/panel/notas' 
    },
  ];

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando dashboard...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Hola, <span className="text-gradient">Andrés</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Aquí tienes un resumen de tu actividad actual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportBackup}
            disabled={exporting}
            className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
            title="Descargar una copia de seguridad en JSON con todos tus datos"
          >
            {exporting ? (
              <div className="size-4 border-2 border-gray-400 border-t-black dark:border-t-white rounded-full animate-spin" />
            ) : (
              <HiOutlineDownload className="text-lg text-blue-500" />
            )}
            <span>Exportar Respaldo</span>
          </button>

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
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, idx) => {
          const displayValue = card.isMonetary && isPrivacyMode ? '$••••••' : card.rawVal;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={card.path}
                className="group block bg-white dark:bg-gray-900/90 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${card.color} text-white shadow-lg`}>
                    <card.icon className="text-xl md:text-2xl" />
                  </div>
                  <HiOutlineArrowSmRight className="text-xl md:text-2xl text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-6 md:mt-8">
                  <p className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-1">
                    {card.label}
                  </p>
                  <h3 className="font-dm-sans text-xl md:text-3xl font-bold text-[var(--black)] dark:text-white tracking-tight">
                    {displayValue}
                  </h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
