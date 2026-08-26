import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  HiX,
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';
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
  const [briefing, setBriefing] = useState<{
    plantsToWater: { id: string; nickname: string; emoji: string; daysDiff: number }[];
    upcomingEvents: { id: string; title: string; category: string; daysLeft: number; time?: string }[];
    urgentTasks: { id: string; title: string; due_date?: string; priority?: string }[];
    pendingShoppingCount: number;
    hasAlerts: boolean;
  }>({
    plantsToWater: [],
    upcomingEvents: [],
    urgentTasks: [],
    pendingShoppingCount: 0,
    hasAlerts: false,
  });
  const [isBriefingDismissed, setIsBriefingDismissed] = useState(() => {
    const dismissedDate = localStorage.getItem('ac_briefing_dismissed_date');
    const today = new Date().toISOString().split('T')[0];
    return dismissedDate === today;
  });
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [pinnedFilter, setPinnedFilter] = useState<string>('all');
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [showMandadoModal, setShowMandadoModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
    // 1. Sync first from Supabase to ensure fresh multi-device state
    await syncPinnedItemsWithSupabase();
    const rawItems = getPinnedItems();
    if (rawItems.length === 0) {
      setPinnedItems([]);
      return;
    }

    try {
      const [tasksRes, debtsRes, shoppingRes, notesRes, vaultRes, remindersRes, projectsRes, recipesRes, plantsRes, bookmarksRes] = await Promise.all([
        supabase.from('tasks').select('id, completed'),
        supabase.from('debts').select('id, settled'),
        supabase.from('shopping_list').select('id, bought'),
        supabase.from('notes').select('id'),
        supabase.from('vault_items').select('id'),
        supabase.from('reminders').select('id'),
        supabase.from('creative_projects').select('id'),
        supabase.from('recipes').select('id'),
        supabase.from('plants').select('id'),
        supabase.from('bookmarks').select('id'),
      ]);

      const activeTaskIds = new Set(tasksRes.data?.filter(t => !t.completed).map(t => t.id) || []);
      const activeDebtIds = new Set(debtsRes.data?.filter(d => !d.settled).map(d => d.id) || []);
      const activeShoppingIds = new Set(shoppingRes.data?.filter(s => !s.bought).map(s => s.id) || []);
      
      const existingNoteIds = new Set(notesRes.data?.map(n => n.id) || []);
      const existingVaultIds = new Set(vaultRes.data?.map(v => v.id) || []);
      const existingReminderIds = new Set(remindersRes.data?.map(r => r.id) || []);
      const existingProjectIds = new Set(projectsRes.data?.map(p => p.id) || []);
      const existingRecipeIds = new Set(recipesRes.data?.map(r => r.id) || []);
      const existingPlantIds = new Set(plantsRes.data?.map(p => p.id) || []);
      const existingBookmarkIds = new Set(bookmarksRes.data?.map(b => b.id) || []);

      const validPinned: PinnedItem[] = [];
      const invalidIds: string[] = [];

      for (const item of rawItems) {
        let isAlive = true;
        switch (item.type) {
          case 'task': isAlive = activeTaskIds.has(item.id); break;
          case 'debt': isAlive = activeDebtIds.has(item.id); break;
          case 'shopping': isAlive = activeShoppingIds.has(item.id); break;
          case 'note': isAlive = existingNoteIds.has(item.id); break;
          case 'vault': isAlive = existingVaultIds.has(item.id); break;
          case 'reminder': isAlive = existingReminderIds.has(item.id); break;
          case 'project': isAlive = existingProjectIds.has(item.id); break;
          case 'recipe': isAlive = existingRecipeIds.has(item.id); break;
          case 'plant': isAlive = existingPlantIds.has(item.id); break;
          case 'bookmark': isAlive = existingBookmarkIds.has(item.id); break;
        }

        if (isAlive) {
          validPinned.push(item);
        } else {
          invalidIds.push(item.id);
        }
      }

      if (invalidIds.length > 0) {
        // Asynchronously purge from Supabase
        await supabase.from('user_pinned_items').delete().in('id', invalidIds);
        localStorage.setItem('ac_pinned_items_v1', JSON.stringify(validPinned));
      }

      setPinnedItems(validPinned);
    } catch {
      setPinnedItems(rawItems);
    }
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [exp, tsk, vlt, dbt, shp, rem, bkm, nts, prj, chk, rec, plt] = await Promise.all([
      supabase.from('finance_expenses').select('amount'),
      supabase.from('tasks').select('*').eq('completed', false),
      supabase.from('vault_items').select('id'),
      supabase.from('debts').select('amount').eq('settled', false),
      supabase.from('shopping_list').select('id, name, bought').eq('bought', false),
      supabase.from('reminders').select('*'),
      supabase.from('bookmarks').select('id'),
      supabase.from('notes').select('id').not('category', 'like', 'Fitness_Routine_Data:%'),
      supabase.from('creative_projects').select('id'),
      supabase.from('monthly_checklist_logs').select('id').eq('month_year', currentMonthYear).eq('completed', true).eq('user_id', user.id),
      supabase.from('recipes').select('id'),
      supabase.from('plants').select('*'),
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

    // 🌟 Zero-Cost Local Intelligence for Daily Briefing
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Plants that need watering today or overdue
    const plantsToWater: { id: string; nickname: string; emoji: string; daysDiff: number }[] = [];
    if (plt?.data) {
      for (const p of plt.data) {
        if (!p.last_watered_at || !p.watering_frequency_days) continue;
        const last = new Date(p.last_watered_at + 'T00:00:00');
        const nextWater = new Date(last.getTime() + p.watering_frequency_days * 24 * 60 * 60 * 1000);
        const daysDiff = Math.ceil((nextWater.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 0) {
          plantsToWater.push({
            id: p.id,
            nickname: p.nickname || p.species,
            emoji: p.emoji || '🪴',
            daysDiff,
          });
        }
      }
    }

    // 2. Upcoming events / reminders in the next 3 days
    const upcomingEvents: { id: string; title: string; category: string; daysLeft: number; time?: string }[] = [];
    if (rem?.data) {
      for (const r of rem.data) {
        const dateVal = r.date || r.event_date;
        if (!dateVal) continue;
        let target: Date;
        if (r.recurring) {
          const parts = dateVal.split('-');
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          target = new Date(today.getFullYear(), month, day);
          if (target < today) {
            target = new Date(today.getFullYear() + 1, month, day);
          }
        } else {
          target = new Date(dateVal + 'T00:00:00');
        }
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          upcomingEvents.push({
            id: r.id,
            title: r.title,
            category: r.category,
            daysLeft: diffDays,
            time: r.time,
          });
        }
      }
    }

    // 3. Urgent or high-priority tasks
    const urgentTasks: { id: string; title: string; due_date?: string; priority?: string }[] = [];
    if (tsk?.data) {
      for (const t of tsk.data) {
        if (t.priority === 'Alta' || t.priority === 'Urgente') {
          urgentTasks.push({ id: t.id, title: t.title, due_date: t.due_date, priority: t.priority });
        } else if (t.due_date) {
          const target = new Date(t.due_date + 'T00:00:00');
          const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 2) {
            urgentTasks.push({ id: t.id, title: t.title, due_date: t.due_date, priority: 'Próxima a vencer' });
          }
        }
      }
    }

    const hasAlerts = plantsToWater.length > 0 || upcomingEvents.length > 0 || urgentTasks.length > 0 || (shp.data?.length || 0) > 0;

    setBriefing({
      plantsToWater,
      upcomingEvents,
      urgentTasks: urgentTasks.slice(0, 4),
      pendingShoppingCount: shp.data?.length || 0,
      hasAlerts,
    });

    setLoading(false);
  };

  const exportBackupJson = async () => {
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
        version: '5.3.0',
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

      toast.success('Copia de seguridad JSON descargada correctamente');
      setShowExportModal(false);
    } catch (err: any) {
      toast.error('Error al exportar respaldo: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const exportBackupCsv = async () => {
    setExporting(true);
    try {
      const [exp, tsk, shp, rem] = await Promise.all([
        supabase.from('finance_expenses').select('date, concept, category, amount'),
        supabase.from('tasks').select('title, priority, due_date, completed'),
        supabase.from('shopping_list').select('name, location, price, bought'),
        supabase.from('reminders').select('title, category, date, time'),
      ]);

      let csv = '=== GASTOS ===\nFecha,Concepto,Categoria,Monto\n';
      exp.data?.forEach(e => {
        csv += `"${e.date}","${e.concept || ''}","${e.category || ''}",${e.amount}\n`;
      });

      csv += '\n=== PENDIENTES ===\nTitulo,Prioridad,Fecha Limite,Completada\n';
      tsk.data?.forEach(t => {
        csv += `"${t.title}","${t.priority || ''}","${t.due_date || ''}",${t.completed ? 'SI' : 'NO'}\n`;
      });

      csv += '\n=== LISTA DE COMPRAS Y MANDADO ===\nProducto,Tienda/Pasillo,Precio,Comprado\n';
      shp.data?.forEach(s => {
        csv += `"${s.name}","${s.location || ''}",${s.price || 0},${s.bought ? 'SI' : 'NO'}\n`;
      });

      csv += '\n=== RECORDATORIOS Y FECHAS ===\nTitulo,Categoria,Fecha,Hora\n';
      rem.data?.forEach(r => {
        csv += `"${r.title}","${r.category || ''}","${r.date || ''}","${r.time || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `reporte_general_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Reporte CSV descargado con éxito');
      setShowExportModal(false);
    } catch (err: any) {
      toast.error('Error al generar CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = () => {
    setShowExportModal(false);
    window.print();
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
    { 
      label: 'Gym & Rutinas', 
      rawVal: 'Día A / B', 
      isMonetary: false,
      icon: FaDumbbell, 
      color: 'bg-rose-600', 
      path: '/admin/panel/entrenamiento' 
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
            type="button"
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            title="Exportar copia de seguridad o reporte (JSON, CSV, PDF)"
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

      {/* ☀️ Daily Briefing (Resumen Matutino Inteligente) */}
      {!isBriefingDismissed && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-500/10 via-sky-500/5 to-emerald-500/10 border border-amber-500/20 dark:border-amber-400/20 p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-lg shadow-xs">
                ☀️
              </div>
              <div>
                <h2 className="font-dm-sans text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Resumen Matutino Inteligente
                </h2>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  Estado clave de tus plantas, compromisos próximos y prioridades del día.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('ac_briefing_dismissed_date', today);
                setIsBriefingDismissed(true);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-sm shrink-0"
              title="Ocultar resumen por hoy"
            >
              <HiX />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Plantas que necesitan agua */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>🪴</span> Riego de Plantas
                </span>
                <Link to="/admin/panel/plantas" className="text-[10px] font-syne font-bold text-gray-400 hover:text-emerald-500 transition-colors">
                  Ver Jardín →
                </Link>
              </div>
              {briefing.plantsToWater.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="font-dm-sans text-xs font-bold text-gray-900 dark:text-white">
                    {briefing.plantsToWater.length} {briefing.plantsToWater.length === 1 ? 'planta necesita' : 'plantas necesitan'} agua hoy:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {briefing.plantsToWater.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-inter text-xs font-medium border border-emerald-200/40 dark:border-emerald-800/40">
                        <span>{p.emoji}</span>
                        <span>{p.nickname}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  ✨ Todas tus plantas están hidratadas al día.
                </p>
              )}
            </div>

            {/* 2. Próximos 3 días de eventos / fechas */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <span>📅</span> Fechas Importantes
                </span>
                <Link to="/admin/panel/recordatorios" className="text-[10px] font-syne font-bold text-gray-400 hover:text-pink-500 transition-colors">
                  Ver Todo →
                </Link>
              </div>
              {briefing.upcomingEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {briefing.upcomingEvents.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="font-inter font-medium text-gray-800 dark:text-gray-200 truncate">
                        {e.title}
                      </span>
                      <span className={`shrink-0 font-syne text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        e.daysLeft === 0 
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 animate-pulse'
                          : e.daysLeft === 1
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {e.daysLeft === 0 ? '¡Hoy!' : e.daysLeft === 1 ? 'Mañana' : `En ${e.daysLeft} días`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  🏖️ Sin eventos ni pagos programados en los próximos 3 días.
                </p>
              )}
            </div>

            {/* 3. Tareas Prioritarias & Mandado */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <span>🎯</span> Foco del Día
                </span>
                <Link to="/admin/panel/pendientes" className="text-[10px] font-syne font-bold text-gray-400 hover:text-sky-500 transition-colors">
                  Pendientes →
                </Link>
              </div>
              {briefing.urgentTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {briefing.urgentTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="font-inter font-medium text-gray-800 dark:text-gray-200 truncate">
                        • {t.title}
                      </span>
                      {t.priority && (
                        <span className="shrink-0 font-syne text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
                          {t.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  {briefing.pendingShoppingCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowMandadoModal(true)}
                      className="text-left hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>🛒 Tienes <strong>{briefing.pendingShoppingCount}</strong> productos pendientes en tu mandado.</span>
                      <span className="font-syne text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline shrink-0 ml-1">Abrir →</span>
                    </button>
                  ) : (
                    '🎉 ¡Todo limpio! No tienes tareas urgentes pendientes.'
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

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

      {/* Export & Backup Modal (Rendered in Portal) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showExportModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowExportModal(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6 cursor-default overflow-hidden my-auto"
              >
                <div className="flex items-start justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xl text-white shadow-md">
                      📦
                    </div>
                    <div>
                      <h3 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                        Exportación & Respaldo
                      </h3>
                      <p className="font-inter text-xs text-gray-400 mt-0.5">
                        Descarga tus datos o genera reportes en 1 clic:
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[60vh] scrollbar-thin">
                  {/* 1. JSON Backup */}
                  <button
                    type="button"
                    onClick={exportBackupJson}
                    disabled={exporting}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-2.5 bg-blue-500 text-white rounded-xl shadow-xs shrink-0">🗂️</span>
                      <div>
                        <div className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>Copia Completa (JSON)</span>
                          <span className="text-[9px] font-syne font-bold uppercase tracking-wider bg-blue-500 text-white px-2 py-0.5 rounded-full">Recomendado</span>
                        </div>
                        <p className="font-inter text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Respaldo 100% íntegro de las 14 tablas del sistema listo para restaurar.
                        </p>
                      </div>
                    </div>
                    <HiOutlineDownload className="text-xl text-blue-500 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                  </button>

                  {/* 2. CSV Summary */}
                  <button
                    type="button"
                    onClick={exportBackupCsv}
                    disabled={exporting}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0">📊</span>
                      <div>
                        <div className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white">
                          Reporte para Excel (CSV)
                        </div>
                        <p className="font-inter text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Tablas tabulares de tus finanzas, pendientes y compras de mandado.
                        </p>
                      </div>
                    </div>
                    <HiOutlineDownload className="text-xl text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                  </button>

                  {/* 3. Print / PDF */}
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-2.5 bg-purple-500 text-white rounded-xl shadow-xs shrink-0">📄</span>
                      <div>
                        <div className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white">
                          Imprimir / Guardar como PDF
                        </div>
                        <p className="font-inter text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Abre el diálogo del navegador para imprimir o guardar en PDF.
                        </p>
                      </div>
                    </div>
                    <HiOutlineDownload className="text-xl text-purple-500 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-6 py-2.5 text-xs font-syne font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
