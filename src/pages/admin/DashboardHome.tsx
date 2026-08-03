import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { getPinnedItems, removePinnedItem, PinnedItem, syncPinnedItemsWithSupabase } from '@/lib/pinned';
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
  HiOutlineDownload,
  HiOutlineBell,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/ToastContext';
import MandadoModal from '@/components/admin/MandadoModal';
import { 
  requestNotificationPermission, 
  sendBrowserNotification, 
  scanAndNotifyUpcomingEvents 
} from '@/lib/notifications';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    expenses: 0,
    tasks: 0,
    vault: 0,
    debts: 0,
    shopping: 0,
    reminders: 0,
    bookmarks: 0,
    notes: 0,
    projects: 0,
    checklist: 0,
    recipes: 0,
    plants: 0,
  });
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [pinnedFilter, setPinnedFilter] = useState<string>('all');
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [showMandadoModal, setShowMandadoModal] = useState(false);
  const { toast } = useToast();

  const translateType = (type: string) => {
    switch (type) {
      case 'note': return 'Notas 📝';
      case 'reminder': return 'Fechas 📅';
      case 'task': return 'Tareas ✅';
      case 'debt': return 'Deudas 💸';
      case 'vault': return 'Bóveda 🔒';
      case 'shopping': return 'Compras 🛒';
      case 'project': return 'Proyectos 🎨';
      case 'checklist': return 'Habits 📋';
      case 'recipe': return 'Recetas 🍽️';
      case 'plant': return 'Plantas 🪴';
      default: return type;
    }
  };

  const filteredPinned = pinnedItems.filter(
    (item) => pinnedFilter === 'all' || item.type === pinnedFilter
  );
  
  const displayedPinned = isPinnedCollapsed ? filteredPinned.slice(0, 6) : filteredPinned;
  const activeTypes = Array.from(new Set(pinnedItems.map((item) => item.type)));

  useEffect(() => {
    fetchStats();
    loadPinned();

    const handlePinnedChanged = () => loadPinned();
    window.addEventListener('ac_pinned_changed', handlePinnedChanged);
    return () => window.removeEventListener('ac_pinned_changed', handlePinnedChanged);
  }, []);

  const loadPinned = async () => {
    const rawItems = getPinnedItems();
    if (rawItems.length === 0) {
      setPinnedItems([]);
      return;
    }

    try {
      const [doneTasks, settledDebts, boughtShopping] = await Promise.all([
        supabase.from('tasks').select('id').eq('completed', true),
        supabase.from('debts').select('id').eq('settled', true),
        supabase.from('shopping_list').select('id').eq('bought', true),
      ]);

      const doneTaskIds = new Set(doneTasks.data?.map(t => t.id) || []);
      const settledDebtIds = new Set(settledDebts.data?.map(d => d.id) || []);
      const boughtShoppingIds = new Set(boughtShopping.data?.map(s => s.id) || []);

      const activePinned = rawItems.filter(item => {
        if (item.type === 'task' && doneTaskIds.has(item.id)) return false;
        if (item.type === 'debt' && settledDebtIds.has(item.id)) return false;
        if (item.type === 'shopping' && boughtShoppingIds.has(item.id)) return false;
        return true;
      });

      setPinnedItems(activePinned);
    } catch {
      setPinnedItems(rawItems);
    }
    syncPinnedItemsWithSupabase();
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [exp, tsk, vlt, dbt, shp, rem, bkm, nts, prj, chk, rec, plt] = await Promise.all([
      supabase.from('finance_expenses').select('amount'),
      supabase.from('tasks').select('id').eq('completed', false),
      supabase.from('vault_items').select('id'),
      supabase.from('debts').select('amount').eq('settled', false),
      supabase.from('shopping_list').select('id').eq('bought', false),
      supabase.from('reminders').select('id'),
      supabase.from('bookmarks').select('id'),
      supabase.from('notes').select('id'),
      supabase.from('creative_projects').select('id'),
      supabase.from('monthly_checklist_logs').select('id').eq('month_year', currentMonthYear).eq('completed', true).eq('user_id', user.id),
      supabase.from('recipes').select('id'),
      supabase.from('plants').select('id'),
    ]);

    setStats({
      expenses: exp.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      tasks: tsk.data?.length || 0,
      vault: vlt.data?.length || 0,
      debts: dbt.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      shopping: shp.data?.length || 0,
      reminders: rem.data?.length || 0,
      bookmarks: bkm.data?.length || 0,
      notes: nts.data?.length || 0,
      projects: prj.data?.length || 0,
      checklist: chk.data?.length || 0,
      recipes: rec.data?.length || 0,
      plants: plt?.data?.length || 0,
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

      const [exp, sal, tsk, dbt, vlt, shp, rem, nts, bkm, prj, chkItems, chkLogs, rec, plt] = await Promise.all([
        supabase.from('finance_expenses').select('*'),
        supabase.from('finance_salary').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('vault_items').select('*'),
        supabase.from('shopping_list').select('*'),
        supabase.from('reminders').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('bookmarks').select('*'),
        supabase.from('creative_projects').select('*'),
        supabase.from('monthly_checklist_items').select('*'),
        supabase.from('monthly_checklist_logs').select('*'),
        supabase.from('recipes').select('*'),
        supabase.from('plants').select('*'),
      ]);

      const backupObj = {
        version: '2.0',
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
          bookmarks: bkm.data || [],
          creative_projects: prj.data || [],
          monthly_checklist_items: chkItems.data || [],
          monthly_checklist_logs: chkLogs.data || [],
          recipes: rec.data || [],
          plants: plt.data || [],
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

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Probando notificación PWA...');
      sendBrowserNotification('🔔 Prueba de Notificación', {
        body: 'Las notificaciones de tu panel privado están funcionando perfectamente.',
      });
      scanAndNotifyUpcomingEvents();
    } else {
      toast.info('Habilita las notificaciones en la configuración de tu navegador.');
    }
  };

  const handleUnpin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removePinnedItem(id);
    setPinnedItems((prev) => prev.filter((i) => i.id !== id));
    window.dispatchEvent(new Event('ac_pinned_changed'));
    toast.success('📌 Elemento desfijado del inicio');
  };

  const getItemBadge = (type: string) => {
    switch (type) {
      case 'note': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300';
      case 'reminder': return 'bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300';
      case 'task': return 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300';
      case 'debt': return 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300';
      case 'vault': return 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300';
      case 'shopping': return 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300';
      case 'project': return 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300';
      case 'checklist': return 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300';
      case 'recipe': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
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
    { 
      label: 'Proyectos Creativos', 
      rawVal: stats.projects, 
      isMonetary: false,
      icon: HiOutlineColorSwatch, 
      color: 'bg-violet-500', 
      path: '/admin/panel/proyectos' 
    },
    { 
      label: 'Checklist del Mes', 
      rawVal: `${stats.checklist} completados`, 
      isMonetary: false,
      icon: HiOutlineCheckCircle, 
      color: 'bg-teal-500', 
      path: '/admin/panel/checklist' 
    },
    { 
      label: 'Mis Recetas', 
      rawVal: stats.recipes, 
      isMonetary: false,
      icon: HiOutlineBookOpen, 
      color: 'bg-rose-500', 
      path: '/admin/panel/recetas' 
    },
    { 
      label: 'Jardín & Plantas', 
      rawVal: stats.plants, 
      isMonetary: false,
      icon: HiOutlineSparkles, 
      color: 'bg-emerald-600', 
      path: '/admin/panel/plantas' 
    },
  ];

  if (loading) return (
    <div className="space-y-12 pb-16">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-11 w-36 rounded-2xl" />
          <div className="skeleton h-11 w-36 rounded-2xl" />
          <div className="skeleton h-11 w-36 rounded-2xl" />
        </div>
      </div>
      {/* Pinned section skeleton */}
      <div className="space-y-4">
        <div className="skeleton h-7 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="space-y-4">
        <div className="skeleton h-7 w-28" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-32 rounded-[2rem]" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Hola, <span className="text-gradient">Andrés</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Aquí tienes un resumen de tu actividad actual y tus elementos fijados.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setShowMandadoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md text-xs font-syne font-bold uppercase tracking-wider active:scale-95 transition-all shrink-0 interactive-hover"
            title="Abrir directamente tu listado de Mandado Quincenal e Insumos"
          >
            <span>🥗 Mandado</span>
          </button>

          <button
            onClick={handleTestNotification}
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all shrink-0"
            title="Activar o probar notificaciones flotantes en tu celular/PC"
          >
            <HiOutlineBell className="text-base text-amber-500" />
            <span className="hidden sm:block">Notificaciones</span>
          </button>

          <button
            onClick={exportBackup}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            title="Descargar una copia de seguridad en JSON con todos tus datos"
          >
            {exporting ? (
              <div className="size-4 border-2 border-gray-400 border-t-black dark:border-t-white rounded-full animate-spin" />
            ) : (
              <HiOutlineDownload className="text-base text-blue-500" />
            )}
            <span className="hidden sm:block">Respaldo</span>
          </button>

          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all shrink-0"
          >
            {isPrivacyMode ? (
              <>
                <HiOutlineEyeOff className="text-base text-gray-400" />
                <span className="hidden sm:block">Mostrar</span>
              </>
            ) : (
              <>
                <HiOutlineEye className="text-base text-emerald-500" />
                <span className="hidden sm:block">Privacidad</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 📌 Pinned Elements Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-dm-sans text-xl font-bold text-[var(--black)] dark:text-white flex items-center gap-2">
            <span>📌</span>
            <span>Elementos Fijados</span>
            {pinnedItems.length > 0 && (
              <span className="text-xs font-syne font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
                {pinnedItems.length}
              </span>
            )}
          </h2>
          
          {pinnedItems.length > 6 && (
            <button 
              onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)} 
              className="text-left font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--vibrant-sky-blue)] hover:underline active:scale-95 transition-all shrink-0"
            >
              {isPinnedCollapsed ? `Mostrar Todo (${filteredPinned.length})` : 'Contraer Listado'}
            </button>
          )}
        </div>

        {pinnedItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            <button
              onClick={() => setPinnedFilter('all')}
              className={`px-3 py-1 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                pinnedFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Todos
            </button>
            {activeTypes.map((type) => (
              <button
                key={type}
                onClick={() => setPinnedFilter(type)}
                className={`px-3 py-1 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider transition-all ${
                  pinnedFilter === type
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {translateType(type)}
              </button>
            ))}
          </div>
        )}

        {pinnedItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900/60 rounded-[2rem] p-6 md:p-8 border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-2">
            <p className="font-dm-sans text-base font-bold text-gray-700 dark:text-gray-300">No tienes elementos fijados</p>
            <p className="font-inter text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
              Puedes fijar cualquier nota, recordatorio, tarea o dato importante usando el icono 📍 desde la búsqueda global (<kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl + K</kbd>).
            </p>
          </div>
        ) : filteredPinned.length === 0 ? (
          <div className="bg-white dark:bg-gray-900/60 rounded-[2rem] p-6 md:p-8 border border-dashed border-gray-200 dark:border-gray-800 text-center">
            <p className="font-dm-sans text-sm font-bold text-gray-500 dark:text-gray-400">No hay elementos fijados para esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayedPinned.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (item.type === 'shopping' || item.path.includes('/admin/panel/compras')) {
                          e.preventDefault();
                          setShowMandadoModal(true);
                        }
                      }}
                      className="group block p-5 bg-white dark:bg-gray-900 rounded-3xl border-none hover:border-amber-300 dark:hover:border-amber-700/60 shadow-sm hover:shadow-lg transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${getItemBadge(item.type)}`}>
                          {translateType(item.type)}
                        </span>

                        <button
                          onClick={(e) => { e.preventDefault(); handleUnpin(item.id, e); }}
                          className="px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all text-[10px] font-syne font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
                          title="Desfijar de la pantalla de inicio"
                        >
                          <span>📌</span>
                          <span className="hidden sm:inline">Desfijar</span>
                        </button>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="font-dm-sans font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="font-inter text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredPinned.length > 6 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-all active:scale-95"
                >
                  {isPinnedCollapsed ? `Mostrar ${filteredPinned.length - 6} más` : 'Mostrar menos'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Module Overview Grid */}
      <section className="space-y-4">
        <h2 className="font-dm-sans text-xl font-bold text-[var(--black)] dark:text-white">
          Módulos
        </h2>

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
                  className="group block bg-white dark:bg-gray-900/90 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
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
      </section>
      
      {/* Mandado Modal */}
      <MandadoModal 
        isOpen={showMandadoModal} 
        onClose={() => setShowMandadoModal(false)} 
      />
    </div>
  );
}
