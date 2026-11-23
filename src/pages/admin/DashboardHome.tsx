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
  HiOutlineBell,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineCamera,
  HiX,
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/ToastContext';
import MandadoModal from '@/components/admin/MandadoModal';
import TicketScannerModal from '@/components/admin/TicketScannerModal';
import { parseExpenseInfo } from '@/pages/admin/Finanzas';
import { parseTaskMeta } from '@/lib/taskMeta';
import { 
  requestNotificationPermission, 
  sendBrowserNotification, 
  scanAndNotifyUpcomingEvents 
} from '@/lib/notifications';
import { fetchWithCache, invalidateCache } from '@/lib/cache';

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
    urgentTasks: { id: string; title: string; due_date?: string; priority?: string; area?: string }[];
    pendingShoppingCount: number;
    quincenaAvailable: number;
    quincenaLabel: string;
    quincenaBudget: number;
    hasAlerts: boolean;
  }>({
    plantsToWater: [],
    upcomingEvents: [],
    urgentTasks: [],
    pendingShoppingCount: 0,
    quincenaAvailable: 0,
    quincenaLabel: '1ª Quincena',
    quincenaBudget: 0,
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
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [showMandadoModal, setShowMandadoModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
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

    const handlePinnedChanged = () => {
      setPinnedItems(getPinnedItems());
    };
    window.addEventListener('ac_pinned_changed', handlePinnedChanged);
    return () => window.removeEventListener('ac_pinned_changed', handlePinnedChanged);
  }, []);

  const loadPinned = async () => {
    // 1. Sync first from Supabase silently to avoid re-triggering ac_pinned_changed loops
    await syncPinnedItemsWithSupabase({ silent: true });
    const rawItems = getPinnedItems();
    if (rawItems.length === 0) {
      setPinnedItems([]);
      return;
    }

    try {
      const typesPresent = new Set(rawItems.map(i => i.type));

      const [tasksRes, debtsRes, shoppingRes, notesRes, vaultRes, remindersRes, projectsRes, recipesRes, plantsRes, bookmarksRes] = await Promise.all([
        typesPresent.has('task') ? supabase.from('tasks').select('id, completed') : Promise.resolve({ data: [] }),
        typesPresent.has('debt') ? supabase.from('debts').select('id, settled') : Promise.resolve({ data: [] }),
        typesPresent.has('shopping') ? supabase.from('shopping_list').select('id, bought') : Promise.resolve({ data: [] }),
        typesPresent.has('note') ? supabase.from('notes').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('vault') ? supabase.from('vault_items').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('reminder') ? supabase.from('reminders').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('project') ? supabase.from('creative_projects').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('recipe') ? supabase.from('recipes').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('plant') ? supabase.from('plants').select('id') : Promise.resolve({ data: [] }),
        typesPresent.has('bookmark') ? supabase.from('bookmarks').select('id') : Promise.resolve({ data: [] }),
      ]);

      const activeTaskIds = new Set((tasksRes.data as any[])?.filter(t => !t.completed).map(t => t.id) || []);
      const activeDebtIds = new Set((debtsRes.data as any[])?.filter(d => !d.settled).map(d => d.id) || []);
      const activeShoppingIds = new Set((shoppingRes.data as any[])?.filter(s => !s.bought).map(s => s.id) || []);
      
      const existingNoteIds = new Set((notesRes.data as any[])?.map(n => n.id) || []);
      const existingVaultIds = new Set((vaultRes.data as any[])?.map(v => v.id) || []);
      const existingReminderIds = new Set((remindersRes.data as any[])?.map(r => r.id) || []);
      const existingProjectIds = new Set((projectsRes.data as any[])?.map(p => p.id) || []);
      const existingRecipeIds = new Set((recipesRes.data as any[])?.map(r => r.id) || []);
      const existingPlantIds = new Set((plantsRes.data as any[])?.map(p => p.id) || []);
      const existingBookmarkIds = new Set((bookmarksRes.data as any[])?.map(b => b.id) || []);

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
        await supabase.from('user_pinned_items').delete().in('id', invalidIds);
        try {
          localStorage.setItem('ac_pinned_items_v1', JSON.stringify(validPinned));
        } catch {
          // Ignore storage quota / private mode errors
        }
      }

      setPinnedItems(validPinned);
    } catch {
      setPinnedItems(rawItems);
    }
  };

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    try {
      const cachedDashboard = await fetchWithCache('dashboard_stats_and_briefing', async () => {
        const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        const [exp, tsk, vlt, dbt, shp, rem, bkm, nts, prj, chk, rec, plt, sal] = await Promise.all([
          supabase.from('finance_expenses').select('amount, category, concept, date, created_at'),
          supabase.from('tasks').select('id, title, description, priority, due_date').eq('completed', false),
          supabase.from('vault_items').select('*', { count: 'exact', head: true }),
          supabase.from('debts').select('amount').eq('settled', false),
          supabase.from('shopping_list').select('id', { count: 'exact', head: true }).eq('bought', false),
          supabase.from('reminders').select('id, title, category, date, time, recurring'),
          supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
          supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .not('category', 'like', 'Fitness_Routine_Data:%')
            .not('category', 'like', 'System_Store:%'),
          supabase.from('creative_projects').select('*', { count: 'exact', head: true }),
          supabase.from('monthly_checklist_logs').select('*', { count: 'exact', head: true }).eq('month_year', currentMonthYear).eq('completed', true).eq('user_id', user.id),
          supabase.from('recipes').select('*', { count: 'exact', head: true }),
          supabase.from('plants').select('id, nickname, species, emoji, watering_frequency_days, last_watered_at'),
          supabase.from('finance_salary').select('amount').eq('user_id', user.id).limit(1),
        ]);

        const computedStats = {
          expenses: exp.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
          tasks: tsk.data?.length || 0,
          vault: vlt.count || 0,
          debts: dbt.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
          shopping: shp.count || 0,
          reminders: rem.data?.length || 0,
          bookmarks: bkm.count || 0,
          notes: nts.count || 0,
          projects: prj.count || 0,
          checklist: chk.count || 0,
          recipes: rec.count || 0,
          plants: plt.data?.length || 0,
        };

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

        // 2. Upcoming events / reminders in the next 5 days
        const upcomingEvents: { id: string; title: string; category: string; daysLeft: number; time?: string }[] = [];
        if (rem?.data) {
          for (const r of rem.data) {
            const dateVal = (r as any).date || (r as any).event_date;
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
            const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 5) {
              upcomingEvents.push({
                id: r.id,
                title: r.title,
                category: r.category,
                daysLeft: diffDays,
                time: r.time,
              });
            }
          }
          upcomingEvents.sort((a, b) => a.daysLeft - b.daysLeft);
        }

        // 3. Overdue, urgent, high-priority, or near-term tasks (with Area metadata)
        const urgentTasks: { id: string; title: string; due_date?: string; priority?: string; area?: string }[] = [];
        if (tsk?.data) {
          for (const t of tsk.data) {
            const meta = parseTaskMeta(t);
            const diffDays = t.due_date
              ? Math.round((new Date(t.due_date + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : null;
            if (diffDays !== null && diffDays < 0) {
              urgentTasks.push({ id: t.id, title: t.title, due_date: t.due_date, priority: 'Vencida', area: meta.area });
            } else if (meta.priority === 'Alta' || meta.priority === 'Urgente') {
              urgentTasks.push({ id: t.id, title: t.title, due_date: t.due_date, priority: meta.priority, area: meta.area });
            } else if (diffDays !== null && diffDays >= 0 && diffDays <= 5) {
              urgentTasks.push({ id: t.id, title: t.title, due_date: t.due_date, priority: 'Próxima', area: meta.area });
            }
          }
          const rank: Record<string, number> = { Vencida: 0, Urgente: 1, Alta: 2, Próxima: 3 };
          urgentTasks.sort((a, b) => (rank[a.priority || ''] ?? 4) - (rank[b.priority || ''] ?? 4));
        }

        // 4. Current Quincena Balance
        const salaryMonthly = Number(sal?.data?.[0]?.amount || 0);
        const quincenaBudget = salaryMonthly / 2;
        const nowDate = new Date();
        const isQ1 = nowDate.getDate() <= 15;
        const curY = nowDate.getFullYear();
        const curM = nowDate.getMonth();
        let quincenaSpent = 0;

        (exp?.data || []).forEach((e: any) => {
          const info = parseExpenseInfo(e);
          if (info.isBase) {
            if (info.recurrenceDist === 'split') quincenaSpent += Number(e.amount || 0) / 2;
            else if (info.recurrenceDist === 'q1' && isQ1) quincenaSpent += Number(e.amount || 0);
            else if (info.recurrenceDist === 'q2' && !isQ1) quincenaSpent += Number(e.amount || 0);
          } else {
            const dStr = (e.date || e.created_at || '').split('T')[0];
            if (!dStr) return;
            const [y, m, d] = dStr.split('-').map(Number);
            if (y === curY && m - 1 === curM) {
              const expQ1 = (d || 1) <= 15;
              if (expQ1 === isQ1) quincenaSpent += Number(e.amount || 0);
            }
          }
        });

        const quincenaAvailable = quincenaBudget - quincenaSpent;
        const hasAlerts = plantsToWater.length > 0 || upcomingEvents.length > 0 || urgentTasks.length > 0 || (shp.count || 0) > 0;

        return {
          stats: computedStats,
          briefing: {
            plantsToWater,
            upcomingEvents,
            urgentTasks: urgentTasks.slice(0, 4),
            pendingShoppingCount: shp.count || 0,
            quincenaAvailable,
            quincenaLabel: isQ1 ? '1ª Quincena' : '2ª Quincena',
            quincenaBudget,
            hasAlerts,
          }
        };
      }, 4 * 60 * 1000);

      setStats(cachedDashboard.stats);
      setBriefing(cachedDashboard.briefing);
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
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

  const handleQuickCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
      if (error) throw error;
      setBriefing((prev) => ({
        ...prev,
        urgentTasks: prev.urgentTasks.filter((t) => t.id !== taskId),
      }));
      setStats((prev) => ({ ...prev, tasks: Math.max(0, prev.tasks - 1) }));
      invalidateCache('dashboard');
      toast.success('Tarea completada desde Mi Día 🎉');
    } catch (err: any) {
      toast.error('Error al completar tarea: ' + err.message);
    }
  };

  const handleQuickWaterPlant = async (plantId: string, nickname: string) => {
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('plants')
        .update({ last_watered_at: todayIso })
        .eq('id', plantId);
      if (error) throw error;
      setBriefing((prev) => ({
        ...prev,
        plantsToWater: prev.plantsToWater.filter((p) => p.id !== plantId),
      }));
      invalidateCache('dashboard');
      toast.success(`💧 ${nickname} marcada como regada hoy`);
    } catch (err: any) {
      toast.error('Error al registrar riego: ' + err.message);
    }
  };

  const handleUnpin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removePinnedItem(id);
    setPinnedItems((prev) => prev.filter((i) => i.id !== id));
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
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-9 w-56" />
          <div className="skeleton h-4 w-72 hidden sm:block" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="skeleton h-11 w-32 rounded-2xl" />
          <div className="skeleton h-11 w-32 rounded-2xl" />
          <div className="skeleton h-11 w-32 rounded-2xl" />
        </div>
      </div>
      {/* Pinned section skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-7 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-7 w-28" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-9 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Hola, <span className="text-gradient">Andrés</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1.5 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Resumen accionable de tu día, elementos fijados y acceso rápido a tus módulos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMandadoModal(true)}
            className="flex items-center justify-center gap-2 px-4 min-h-[44px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm text-xs font-syne font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
            title="Abrir directamente tu listado de Mandado Semanal e Insumos"
          >
            <span>🥗 Mandado</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className="flex items-center justify-center gap-2 px-3.5 min-h-[44px] py-2 bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all cursor-pointer"
            title={isPrivacyMode ? 'Mostrar montos financieros' : 'Ocultar montos financieros'}
          >
            {isPrivacyMode ? (
              <>
                <HiOutlineEyeOff className="text-base text-gray-400" />
                <span>Mostrar</span>
              </>
            ) : (
              <>
                <HiOutlineEye className="text-base text-emerald-500" />
                <span>Privacidad</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            className="flex items-center justify-center gap-2 px-3.5 min-h-[44px] py-2 bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs text-xs font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all cursor-pointer"
            title="Activar o probar notificaciones flotantes en tu celular o computadora"
          >
            <HiOutlineBell className="text-base text-amber-500" />
            <span className="hidden sm:inline">Alertas</span>
          </button>
        </div>
      </header>

      {/* ☀️ Vista Mi Día Accionable */}
      {!isBriefingDismissed && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-amber-500/[0.08] via-sky-500/[0.05] to-emerald-500/[0.08] border border-amber-500/25 dark:border-amber-400/25 p-4 sm:p-6 shadow-xs"
        >
          <div className="flex items-start justify-between gap-3 mb-3.5 sm:mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-2xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-lg shrink-0">
                ☀️
              </div>
              <div className="min-w-0">
                <h2 className="font-dm-sans text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Mi Día Accionable
                </h2>
                <p className="hidden sm:block font-inter text-xs text-gray-500 dark:text-gray-400">
                  Completa prioridades, registra riegos y monitorea tu quincena al instante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/admin/panel/calendario"
                className="inline-flex items-center gap-1.5 px-3 min-h-[38px] py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 text-[11px] font-syne font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:border-[var(--vibrant-sky-blue)] transition-all cursor-pointer"
              >
                <span>📅</span>
                <span className="hidden sm:inline">Calendario 360°</span>
                <span className="sm:hidden">Agenda</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  localStorage.setItem('ac_briefing_dismissed_date', today);
                  setIsBriefingDismissed(true);
                }}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-sm shrink-0 cursor-pointer"
                title="Ocultar resumen por hoy"
              >
                <HiX />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* 1. Plantas con 1-tap regar */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-emerald-500/20 dark:border-emerald-400/20 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>🪴</span> Riego Hoy
                </span>
                <Link to="/admin/panel/plantas" className="text-[11px] font-syne font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors">
                  Ver Jardín →
                </Link>
              </div>
              {briefing.plantsToWater.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {briefing.plantsToWater.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickWaterPlant(p.id, p.nickname)}
                      title="Clic para marcar como regada hoy"
                      className="inline-flex items-center gap-1.5 px-3 min-h-[36px] py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-inter text-xs font-medium border border-emerald-200/70 dark:border-emerald-800/60 transition-all cursor-pointer"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.nickname}</span>
                      <span>💧</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  ✨ Todas tus plantas hidratadas al día.
                </p>
              )}
            </div>

            {/* 2. Próximos 3 días de eventos / fechas */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-pink-500/20 dark:border-pink-400/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <span>📅</span> Fechas Próximas
                </span>
                <Link to="/admin/panel/recordatorios" className="text-[11px] font-syne font-bold text-gray-500 dark:text-gray-400 hover:text-pink-500 transition-colors">
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
                      <span className={`shrink-0 font-syne text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        e.daysLeft === 0 
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 animate-pulse'
                          : e.daysLeft === 1
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}>
                        {e.daysLeft === 0 ? '¡Hoy!' : e.daysLeft === 1 ? 'Mañana' : `En ${e.daysLeft}d`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  🏖️ Sin eventos en los próximos 5 días.
                </p>
              )}
            </div>

            {/* 3. Tareas Prioritarias con check rápido */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-sky-500/20 dark:border-sky-400/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <span>🎯</span> Foco del Día
                </span>
                <Link to="/admin/panel/pendientes" className="text-[11px] font-syne font-bold text-gray-500 dark:text-gray-400 hover:text-sky-500 transition-colors">
                  Tablero →
                </Link>
              </div>
              {briefing.urgentTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {briefing.urgentTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickCompleteTask(t.id)}
                        className="flex items-center gap-2 text-left min-w-0 min-h-[32px] group cursor-pointer"
                        title="Marcar completada"
                      >
                        <span className="size-4 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-emerald-500 group-hover:bg-emerald-500/20 shrink-0" />
                        <span className="font-inter font-medium text-gray-800 dark:text-gray-200 truncate group-hover:line-through">
                          {t.title}
                        </span>
                      </button>
                      <span className={`shrink-0 font-syne text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        t.priority === 'Vencida'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                          : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                      }`}>
                        {t.priority === 'Vencida' ? 'Vencida' : t.area || t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  🎉 Sin tareas urgentes pendientes.
                </p>
              )}
            </div>

            {/* 4. Saldo Quincena Actual & Ticket Scanner */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-indigo-500/20 dark:border-indigo-400/20 shadow-xs space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-syne text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>💵</span> {briefing.quincenaLabel}
                </span>
                <Link to="/admin/panel/finanzas" className="text-[11px] font-syne font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                  Finanzas →
                </Link>
              </div>
              <div>
                <p className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                  {isPrivacyMode
                    ? '$••••••'
                    : `$${briefing.quincenaAvailable.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                </p>
                <span className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  Disponible · {briefing.pendingShoppingCount} en mandado
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-700 dark:text-sky-300 font-syne text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <HiOutlineCamera className="text-sm" />
                <span>Escanear Ticket</span>
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* 📌 Pinned Elements Section */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-dm-sans text-lg sm:text-xl font-bold text-[var(--black)] dark:text-white flex items-center gap-2">
            <span>📌</span>
            <span>Elementos Fijados</span>
            {pinnedItems.length > 0 && (
              <span className="text-xs font-syne font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {pinnedItems.length}
              </span>
            )}
          </h2>
          
          {pinnedItems.length > 6 && (
            <button 
              type="button"
              onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)} 
              className="font-syne text-[11px] font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)] hover:underline active:scale-95 transition-all shrink-0 min-h-[36px] px-2 cursor-pointer"
            >
              {isPinnedCollapsed ? `Mostrar Todo (${filteredPinned.length})` : 'Contraer Listado'}
            </button>
          )}
        </div>

        {pinnedItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPinnedFilter('all')}
              className={`px-3 min-h-[38px] py-1.5 rounded-xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                pinnedFilter === 'all'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Todos
            </button>
            {activeTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPinnedFilter(type)}
                className={`px-3 min-h-[38px] py-1.5 rounded-xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  pinnedFilter === type
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {translateType(type)}
              </button>
            ))}
          </div>
        )}

        {pinnedItems.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-dashed border-gray-300 dark:border-white/15 text-center space-y-2">
            <p className="font-dm-sans text-base font-bold text-gray-700 dark:text-gray-200">No tienes elementos fijados</p>
            <p className="font-inter text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Puedes fijar cualquier nota, recordatorio, tarea o dato importante usando el icono 📍 desde la búsqueda global (<kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl + K</kbd>).
            </p>
          </div>
        ) : filteredPinned.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-dashed border-gray-300 dark:border-white/15 text-center">
            <p className="font-dm-sans text-sm font-bold text-gray-500 dark:text-gray-400">No hay elementos fijados para esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                      className="group block p-4 sm:p-5 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.09] hover:border-amber-400/70 dark:hover:border-amber-400/50 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider ${getItemBadge(item.type)}`}>
                          {translateType(item.type)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleUnpin(item.id, e); }}
                          className="px-2.5 min-h-[34px] py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all text-[11px] font-syne font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Desfijar de la pantalla de inicio"
                        >
                          <span>📌</span>
                          <span className="hidden sm:inline">Desfijar</span>
                        </button>
                      </div>

                      <div className="mt-2.5 space-y-1">
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
                  type="button"
                  onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)}
                  className="px-5 min-h-[42px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-syne text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 transition-all active:scale-95 cursor-pointer"
                >
                  {isPinnedCollapsed ? `Mostrar ${filteredPinned.length - 6} más` : 'Mostrar menos'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Module Overview Grid */}
      <section className="space-y-3.5">
        <h2 className="font-dm-sans text-lg sm:text-xl font-bold text-[var(--black)] dark:text-white">
          Módulos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {cards.map((card, idx) => {
            const displayValue = card.isMonetary && isPrivacyMode ? '$••••••' : card.rawVal;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Link 
                  to={card.path}
                  className="group flex flex-col justify-between h-full bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-200/80 dark:border-white/[0.09] hover:border-gray-300 dark:hover:border-white/25 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${card.color} text-white shadow-md`}>
                      <card.icon className="text-lg sm:text-2xl" />
                    </div>
                    <HiOutlineArrowSmRight className="text-xl text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <div className="mt-4 sm:mt-6 min-w-0">
                    <p className="font-syne text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5 truncate">
                      {card.label}
                    </p>
                    <h3 className="font-dm-sans text-lg sm:text-2xl font-bold text-[var(--black)] dark:text-white tracking-tight truncate">
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

      {/* Ticket Scanner Modal */}
      <TicketScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSaved={() => {
          invalidateCache('dashboard');
          fetchStats();
        }}
      />
    </div>
  );
}
