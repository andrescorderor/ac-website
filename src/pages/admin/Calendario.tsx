import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchWithCache, invalidateCache } from '@/lib/cache';
import { parseTaskMeta } from '@/lib/taskMeta';
import { parseExpenseInfo } from '@/pages/admin/Finanzas';
import { useToast } from '@/components/common/ToastContext';
import {
  HiChevronLeft,
  HiChevronRight,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
} from 'react-icons/hi';

type EventSource = 'task' | 'reminder' | 'plant' | 'finance';

interface CalendarEvent {
  id: string;
  rawId?: string;
  date: string; // YYYY-MM-DD
  source: EventSource;
  title: string;
  meta: string;
  path: string;
  done?: boolean;
  daysDiff?: number;
  previousWateredAt?: string | null;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_MS = 1000 * 60 * 60 * 24;

const SOURCE_META: Record<
  EventSource,
  { label: string; dot: string; badge: string; icon: string }
> = {
  task: {
    label: 'Tareas',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    icon: '📌',
  },
  reminder: {
    label: 'Fechas',
    dot: 'bg-pink-500',
    badge: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30',
    icon: '🎂',
  },
  plant: {
    label: 'Plantas',
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    icon: '🪴',
  },
  finance: {
    label: 'Finanzas',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
    icon: '💵',
  },
};

function toDateStr(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
}

function formatRelativeDay(
  dateStr: string,
  todayDate: Date,
): { label: string; daysDiff: number } {
  const d = new Date(`${dateStr}T00:00:00`);
  const daysDiff = Math.round((d.getTime() - todayDate.getTime()) / DAY_MS);
  if (daysDiff === -1) return { label: 'Ayer', daysDiff };
  if (daysDiff < -1) return { label: `Hace ${Math.abs(daysDiff)}d`, daysDiff };
  if (daysDiff === 0) return { label: 'Hoy', daysDiff };
  if (daysDiff === 1) return { label: 'Mañana', daysDiff };
  return {
    label: `En ${daysDiff}d · ${SHORT_DAYS[d.getDay()]} ${d.getDate()}`,
    daysDiff,
  };
}

function getNextWaterDate(plant: any): Date | null {
  const freq = Number(plant.watering_frequency_days);
  if (!plant.last_watered_at || !freq || freq <= 0) return null;
  const nextWater = new Date(`${plant.last_watered_at}T00:00:00`);
  if (Number.isNaN(nextWater.getTime())) return null;
  nextWater.setDate(nextWater.getDate() + freq);
  return nextWater;
}

interface CalendarEventRowProps {
  ev: CalendarEvent;
  dayLabel?: string;
  dayTone?: 'overdue' | 'today' | 'tomorrow' | 'soon';
  onCompleteTask: (id: string, title: string) => void;
  onWaterPlant: (
    id: string,
    nickname: string,
    prevWatered: string | null,
  ) => void;
}

function CalendarEventRow({
  ev,
  dayLabel,
  dayTone = 'soon',
  onCompleteTask,
  onWaterPlant,
}: CalendarEventRowProps) {
  const sMeta = SOURCE_META[ev.source];
  const dayBadgeCls =
    dayTone === 'overdue'
      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
      : dayTone === 'today'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
      : dayTone === 'tomorrow'
      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10';

  const canCompleteTask = ev.source === 'task' && !ev.done && ev.rawId;
  const canWaterPlant = ev.source === 'plant' && ev.rawId;

  return (
    <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-gray-50/90 dark:bg-gray-800/70 hover:bg-gray-100/90 dark:hover:bg-gray-800 border border-gray-200/70 dark:border-white/10 transition-all">
      <Link
        to={ev.path}
        className="min-w-0 flex-1 space-y-1 cursor-pointer group"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-syne font-bold uppercase tracking-wider border ${sMeta.badge}`}
          >
            {sMeta.icon} {sMeta.label}
          </span>
          {dayLabel && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-syne font-bold uppercase tracking-wider border ${dayBadgeCls}`}
            >
              {dayLabel}
            </span>
          )}
        </div>
        <h4
          className={`font-dm-sans font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-[var(--vibrant-sky-blue)] transition-colors ${
            ev.done ? 'line-through opacity-60' : ''
          }`}
        >
          {ev.title}
        </h4>
        <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate">
          {ev.meta}
        </p>
      </Link>

      <div className="flex items-center gap-1.5 shrink-0">
        {canCompleteTask && (
          <button
            type="button"
            onClick={() => onCompleteTask(ev.rawId!, ev.title)}
            className="px-2.5 min-h-[38px] py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-syne text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Marcar tarea como completada"
          >
            <HiOutlineCheckCircle className="text-sm" />
            <span>Completar</span>
          </button>
        )}

        {canWaterPlant && (
          <button
            type="button"
            onClick={() =>
              onWaterPlant(
                ev.rawId!,
                ev.title.replace(/^Regar:\s*/i, ''),
                ev.previousWateredAt ?? null,
              )
            }
            className="px-2.5 min-h-[38px] py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-syne text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Registrar riego hoy"
          >
            <span>💧</span>
            <span>Regar</span>
          </button>
        )}

        <Link
          to={ev.path}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-gray-400 hover:text-[var(--vibrant-sky-blue)] hover:bg-white/70 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
          title="Abrir módulo"
        >
          <HiOutlineArrowRight />
        </Link>
      </div>
    </div>
  );
}

export default function Calendario() {
  const now = new Date();
  const initialTodayStr = toDateStr(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(initialTodayStr);
  const [activeSources, setActiveSources] = useState<
    Record<EventSource, boolean>
  >({
    task: true,
    reminder: true,
    plant: true,
    finance: true,
  });
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<{
    tasks: any[];
    reminders: any[];
    plants: any[];
    expenses: any[];
  }>({ tasks: [], reminders: [], plants: [], expenses: [] });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    if (force) {
      invalidateCache('calendario_360_data');
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchWithCache(
        'calendario_360_data',
        async () => {
          const [tsk, rem, plt, exp] = await Promise.all([
            supabase
              .from('tasks')
              .select('id, title, description, priority, due_date, completed')
              .not('due_date', 'is', null),
            supabase.from('reminders').select('*'),
            supabase
              .from('plants')
              .select(
                'id, nickname, species, emoji, watering_frequency_days, last_watered_at',
              ),
            supabase
              .from('finance_expenses')
              .select('id, concept, amount, category, date, created_at')
              .order('created_at', { ascending: false })
              .limit(150),
          ]);
          return {
            tasks: tsk.data || [],
            reminders: rem.data || [],
            plants: plt.data || [],
            expenses: exp.data || [],
          };
        },
        3 * 60 * 1000,
      );
      setRawData(data);
    } catch (err: any) {
      toast.error(
        'Error al cargar agenda: ' + (err?.message || 'revisa tu conexión'),
      );
    } finally {
      setLoading(false);
    }
  };

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = toDateStr(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );

  const handleCompleteTask = async (taskId: string, title: string) => {
    setRawData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        String(t.id) === taskId ? { ...t, completed: true } : t,
      ),
    }));
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      if (error) throw error;
      invalidateCache('calendario_360_data');
      invalidateCache('dashboard');

      toast.undoable(`Tarea "${title}" completada ✓`, async () => {
        try {
          const { error: revertErr } = await supabase
            .from('tasks')
            .update({ completed: false })
            .eq('id', taskId);
          if (revertErr) throw revertErr;
          setRawData((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
              String(t.id) === taskId ? { ...t, completed: false } : t,
            ),
          }));
          invalidateCache('calendario_360_data');
          invalidateCache('dashboard');
          toast.success('Tarea reabierta ↩️');
        } catch (revertErr: any) {
          toast.error('Error al revertir tarea: ' + revertErr.message);
        }
      });
    } catch (err: any) {
      setRawData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          String(t.id) === taskId ? { ...t, completed: false } : t,
        ),
      }));
      toast.error('Error al completar tarea: ' + err.message);
    }
  };

  const handleWaterPlant = async (
    plantId: string,
    nickname: string,
    prevLastWatered: string | null,
  ) => {
    setRawData((prev) => ({
      ...prev,
      plants: prev.plants.map((p) =>
        String(p.id) === plantId ? { ...p, last_watered_at: todayStr } : p,
      ),
    }));
    try {
      const { error } = await supabase
        .from('plants')
        .update({ last_watered_at: todayStr })
        .eq('id', plantId);
      if (error) throw error;
      invalidateCache('calendario_360_data');
      invalidateCache('dashboard');

      toast.undoable(`💧 Riego registrado hoy (${nickname})`, async () => {
        try {
          const { error: revertErr } = await supabase
            .from('plants')
            .update({ last_watered_at: prevLastWatered })
            .eq('id', plantId);
          if (revertErr) throw revertErr;
          setRawData((prev) => ({
            ...prev,
            plants: prev.plants.map((p) =>
              String(p.id) === plantId
                ? { ...p, last_watered_at: prevLastWatered }
                : p,
            ),
          }));
          invalidateCache('calendario_360_data');
          invalidateCache('dashboard');
          toast.success('Riego revertido ↩️');
        } catch (revertErr: any) {
          toast.error('Error al revertir riego: ' + revertErr.message);
        }
      });
    } catch (err: any) {
      setRawData((prev) => ({
        ...prev,
        plants: prev.plants.map((p) =>
          String(p.id) === plantId
            ? { ...p, last_watered_at: prevLastWatered }
            : p,
        ),
      }));
      toast.error('Error al registrar riego: ' + err.message);
    }
  };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Cross-month actionable radar: Overdue items + Next 5 days
  const { overdueItems, next5DaysItems } = useMemo(() => {
    const overdue: CalendarEvent[] = [];
    const upcoming: CalendarEvent[] = [];

    const windowDates: { date: Date; ds: string; offset: number }[] = [];
    const windowOffsetMap = new Map<string, number>();
    for (let offset = 0; offset <= 5; offset++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() + offset);
      const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      windowDates.push({ date: d, ds, offset });
      windowOffsetMap.set(ds, offset);
    }

    // 1. Tasks (overdue & next 5 days, actionable pending items only)
    if (activeSources.task) {
      rawData.tasks.forEach((t) => {
        if (t.completed || !t.due_date) return;
        const meta = parseTaskMeta(t);
        const rel = formatRelativeDay(t.due_date, todayDate);
        const ev: CalendarEvent = {
          id: `radar-task-${t.id}`,
          rawId: String(t.id),
          date: t.due_date,
          source: 'task',
          title: t.title,
          meta: `${meta.area} · ${meta.priority}`,
          path: '/admin/panel/pendientes',
          done: false,
          daysDiff: rel.daysDiff,
        };
        if (rel.daysDiff < 0) {
          overdue.push(ev);
        } else if (rel.daysDiff <= 5) {
          upcoming.push(ev);
        }
      });
    }

    // 2. Reminders in next 5 days (handles annual recurring & month boundaries)
    if (activeSources.reminder) {
      rawData.reminders.forEach((r) => {
        const rawDate = r.date || r.event_date;
        if (!rawDate) return;
        let matchedDs: string | null = null;
        let matchedDiff: number | null = null;

        if (r.recurring) {
          const parts = rawDate.split('-');
          const mNum = parseInt(parts[1], 10) - 1;
          const dNum = parseInt(parts[2], 10);
          const match = windowDates.find(
            (wd) => wd.date.getMonth() === mNum && wd.date.getDate() === dNum,
          );
          if (match) {
            matchedDs = match.ds;
            matchedDiff = match.offset;
          }
        } else if (windowOffsetMap.has(rawDate)) {
          matchedDs = rawDate;
          matchedDiff = windowOffsetMap.get(rawDate)!;
        }

        if (matchedDs !== null && matchedDiff !== null) {
          upcoming.push({
            id: `radar-rem-${r.id}-${matchedDs}`,
            rawId: String(r.id),
            date: matchedDs,
            source: 'reminder',
            title: r.title,
            meta: `${r.category || 'Evento'}${
              r.time ? ` · ${r.time} hrs` : ''
            }${r.recurring ? ' · Anual' : ''}`,
            path: '/admin/panel/recordatorios',
            daysDiff: matchedDiff,
          });
        }
      });
    }

    // 3. Plants: overdue vs next 5 days
    if (activeSources.plant) {
      rawData.plants.forEach((p) => {
        const nextWater = getNextWaterDate(p);
        if (!nextWater) return;
        const nextDs = toDateStr(
          nextWater.getFullYear(),
          nextWater.getMonth(),
          nextWater.getDate(),
        );
        const diffDays = Math.round(
          (nextWater.getTime() - todayDate.getTime()) / DAY_MS,
        );
        const freq = Number(p.watering_frequency_days);
        const nickname = p.nickname || p.species;

        if (diffDays < 0) {
          overdue.push({
            id: `radar-plt-${p.id}`,
            rawId: String(p.id),
            date: nextDs,
            source: 'plant',
            title: `Regar: ${nickname}`,
            meta: `${p.emoji || '🪴'} Cada ${freq} días`,
            path: '/admin/panel/plantas',
            daysDiff: diffDays,
            previousWateredAt: p.last_watered_at || null,
          });
        } else if (diffDays <= 5) {
          upcoming.push({
            id: `radar-plt-${p.id}`,
            rawId: String(p.id),
            date: nextDs,
            source: 'plant',
            title: `Regar: ${nickname}`,
            meta: `${p.emoji || '🪴'} Cada ${freq} días`,
            path: '/admin/panel/plantas',
            daysDiff: diffDays,
            previousWateredAt: p.last_watered_at || null,
          });
        }
      });
    }

    // 4. Finance expenses in next 5 days (handles month boundaries)
    if (activeSources.finance) {
      rawData.expenses.forEach((exp) => {
        const info = parseExpenseInfo(exp);
        if (info.isBase) {
          const targetDay = info.recurrenceDist === 'q2' ? 16 : 1;
          const match = windowDates.find(
            (wd) => wd.date.getDate() === targetDay,
          );
          if (match) {
            upcoming.push({
              id: `radar-fin-base-${exp.id}-${match.ds}`,
              date: match.ds,
              source: 'finance',
              title: info.cleanConcept,
              meta: `Base Fija · $${Number(exp.amount).toLocaleString()}`,
              path: '/admin/panel/finanzas',
              daysDiff: match.offset,
            });
          }
          return;
        }
        const dateStr = (exp.date || exp.created_at || '').split('T')[0];
        if (windowOffsetMap.has(dateStr)) {
          upcoming.push({
            id: `radar-fin-${exp.id}`,
            date: dateStr,
            source: 'finance',
            title: info.cleanConcept,
            meta: `${exp.category} · $${Number(exp.amount).toLocaleString()}`,
            path: '/admin/panel/finanzas',
            daysDiff: windowOffsetMap.get(dateStr)!,
          });
        }
      });
    }

    const sourceOrder: Record<EventSource, number> = {
      task: 0,
      plant: 1,
      reminder: 2,
      finance: 3,
    };

    overdue.sort((a, b) => (a.daysDiff ?? 0) - (b.daysDiff ?? 0));
    upcoming.sort((a, b) => {
      const diffDelta = (a.daysDiff ?? 0) - (b.daysDiff ?? 0);
      if (diffDelta !== 0) return diffDelta;
      return sourceOrder[a.source] - sourceOrder[b.source];
    });

    return { overdueItems: overdue, next5DaysItems: upcoming };
  }, [rawData, activeSources, todayDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const addEvent = (ev: CalendarEvent) => {
      const arr = map.get(ev.date) || [];
      arr.push(ev);
      map.set(ev.date, arr);
    };

    // 1. Tareas
    if (activeSources.task) {
      rawData.tasks.forEach((t) => {
        if (!t.due_date || !t.due_date.startsWith(monthPrefix)) return;
        const meta = parseTaskMeta(t);
        addEvent({
          id: `task-${t.id}`,
          rawId: String(t.id),
          date: t.due_date,
          source: 'task',
          title: t.title,
          meta: `${meta.area} · ${meta.priority}${
            t.completed ? ' · ✓ Completada' : ''
          }`,
          path: '/admin/panel/pendientes',
          done: t.completed,
        });
      });
    }

    // 2. Recordatorios
    if (activeSources.reminder) {
      rawData.reminders.forEach((r) => {
        const rawDate = r.date || r.event_date;
        if (!rawDate) return;
        let dateInMonth = '';
        if (r.recurring) {
          const parts = rawDate.split('-');
          const mNum = parseInt(parts[1], 10) - 1;
          const dNum = parseInt(parts[2], 10);
          if (mNum === month && dNum >= 1 && dNum <= daysInMonth) {
            dateInMonth = toDateStr(year, month, dNum);
          }
        } else if (rawDate.startsWith(monthPrefix)) {
          dateInMonth = rawDate;
        }
        if (dateInMonth) {
          addEvent({
            id: `rem-${r.id}`,
            rawId: String(r.id),
            date: dateInMonth,
            source: 'reminder',
            title: r.title,
            meta: `${r.category || 'Evento'}${
              r.time ? ` · ${r.time} hrs` : ''
            }${r.recurring ? ' · Anual' : ''}`,
            path: '/admin/panel/recordatorios',
          });
        }
      });
    }

    // 3. Riego de Plantas: únicamente fecha actual (hoy/atrasada) o siguiente próximo riego
    if (activeSources.plant) {
      rawData.plants.forEach((p) => {
        const nextWater = getNextWaterDate(p);
        if (!nextWater) return;
        const freq = Number(p.watering_frequency_days);

        let targetDs: string;
        let statusTag = '';
        if (nextWater <= todayDate) {
          targetDs = todayStr;
          const overdueDays = Math.round(
            (todayDate.getTime() - nextWater.getTime()) / DAY_MS,
          );
          statusTag =
            overdueDays > 0 ? ` · Atrasada ${overdueDays}d` : ' · Toca hoy';
        } else {
          targetDs = toDateStr(
            nextWater.getFullYear(),
            nextWater.getMonth(),
            nextWater.getDate(),
          );
        }

        if (targetDs.startsWith(monthPrefix)) {
          addEvent({
            id: `plt-${p.id}-${targetDs}`,
            rawId: String(p.id),
            date: targetDs,
            source: 'plant',
            title: `Regar: ${p.nickname || p.species}`,
            meta: `${p.emoji || '🪴'} Cada ${freq} días${statusTag}`,
            path: '/admin/panel/plantas',
            previousWateredAt: p.last_watered_at || null,
          });
        }
      });
    }

    // 4. Finanzas (gastos del mes + base fija día 1/16)
    if (activeSources.finance) {
      rawData.expenses.forEach((exp) => {
        const info = parseExpenseInfo(exp);
        if (info.isBase) {
          const targetDay = info.recurrenceDist === 'q2' ? 16 : 1;
          const ds = toDateStr(year, month, targetDay);
          addEvent({
            id: `fin-base-${exp.id}`,
            date: ds,
            source: 'finance',
            title: info.cleanConcept,
            meta: `Base Fija · $${Number(exp.amount).toLocaleString()}`,
            path: '/admin/panel/finanzas',
          });
          return;
        }
        const dateStr = (exp.date || exp.created_at || '').split('T')[0];
        if (dateStr.startsWith(monthPrefix)) {
          addEvent({
            id: `fin-${exp.id}`,
            date: dateStr,
            source: 'finance',
            title: info.cleanConcept,
            meta: `${exp.category} · $${Number(exp.amount).toLocaleString()}`,
            path: '/admin/panel/finanzas',
          });
        }
      });
    }

    return map;
  }, [
    rawData,
    activeSources,
    year,
    month,
    monthPrefix,
    daysInMonth,
    todayDate,
    todayStr,
  ]);

  // Celdas del calendario (empezando en Lunes)
  const calendarCells = useMemo(() => {
    const firstDayJs = new Date(year, month, 1).getDay(); // 0=Dom..6=Sáb
    const offset = (firstDayJs + 6) % 7; // 0=Lun..6=Dom
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month, daysInMonth]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const selectedEvents = eventsByDay.get(selectedDate) || [];
  const agendaRef = useRef<HTMLElement>(null);

  const handleSelectDay = (ds: string) => {
    setSelectedDate(ds);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setTimeout(() => {
        agendaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-[460px] rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Calendario <span className="text-gradient">360°</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Todas tus tareas, fechas importantes, riegos de plantas y pagos en
            una sola vista.
          </p>
        </div>

        {/* Navigation & Sources */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-[#111827] p-1 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center justify-center"
              title="Mes anterior"
            >
              <HiChevronLeft className="text-lg" />
            </button>
            <span className="px-2 sm:px-3 font-dm-sans font-bold text-sm sm:text-base text-gray-900 dark:text-white min-w-[125px] sm:min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center justify-center"
              title="Mes siguiente"
            >
              <HiChevronRight className="text-lg" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const cur = new Date();
              const curDs = toDateStr(
                cur.getFullYear(),
                cur.getMonth(),
                cur.getDate(),
              );
              setYear(cur.getFullYear());
              setMonth(cur.getMonth());
              handleSelectDay(curDs);
            }}
            className="px-4 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-all"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            className="min-w-[44px] min-h-[44px] p-2.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-[var(--vibrant-sky-blue)] cursor-pointer flex items-center justify-center"
            title="Actualizar eventos"
          >
            <HiOutlineRefresh className="text-lg" />
          </button>
        </div>
      </header>

      {/* Source Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(SOURCE_META) as EventSource[]).map((src) => {
          const meta = SOURCE_META[src];
          const active = activeSources[src];
          return (
            <button
              key={src}
              type="button"
              onClick={() =>
                setActiveSources((prev) => ({ ...prev, [src]: !prev[src] }))
              }
              className={`px-3 min-h-[38px] py-1.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                active
                  ? meta.badge
                  : 'bg-white dark:bg-[#111827] text-gray-400 border-gray-200/70 dark:border-white/10 opacity-65'
              }`}
            >
              <span className={`size-2 rounded-full ${meta.dot}`} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Radar de Agenda: Vencidos sin atender + Próximos 5 días */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vencidos sin atender */}
        <section
          className={`bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 shadow-xs border space-y-3 ${
            overdueItems.length > 0
              ? 'border-rose-500/35 dark:border-rose-400/30'
              : 'border-emerald-500/25 dark:border-emerald-400/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <HiOutlineExclamationCircle
                className={`text-lg shrink-0 ${
                  overdueItems.length > 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}
              />
              <h2 className="font-dm-sans font-bold text-base text-gray-900 dark:text-white">
                Vencidos sin atender
              </h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full font-syne text-[11px] font-bold ${
                overdueItems.length > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              {overdueItems.length}
            </span>
          </div>

          {overdueItems.length === 0 ? (
            <div className="py-5 text-center space-y-1">
              <p className="font-dm-sans font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Todo al día
              </p>
              <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                No tienes tareas ni riegos vencidos sin atender.
              </p>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {overdueItems.map((ev) => {
                const rel = formatRelativeDay(ev.date, todayDate);
                return (
                  <CalendarEventRow
                    key={ev.id}
                    ev={ev}
                    dayLabel={rel.label}
                    dayTone="overdue"
                    onCompleteTask={handleCompleteTask}
                    onWaterPlant={handleWaterPlant}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Próximos 5 días */}
        <section className="bg-white dark:bg-[#111827] rounded-3xl p-4 sm:p-5 shadow-xs border border-sky-500/25 dark:border-sky-400/25 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <HiOutlineClock className="text-lg shrink-0 text-[var(--vibrant-sky-blue)]" />
              <h2 className="font-dm-sans font-bold text-base text-gray-900 dark:text-white">
                Próximos 5 días
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-syne text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300">
              {next5DaysItems.length}
            </span>
          </div>

          {next5DaysItems.length === 0 ? (
            <div className="py-5 text-center space-y-1">
              <p className="font-dm-sans font-bold text-sm text-gray-700 dark:text-gray-200">
                Ventana despejada
              </p>
              <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                Sin tareas, recordatorios, riegos ni pagos programados en los
                próximos 5 días.
              </p>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {next5DaysItems.map((ev) => {
                const rel = formatRelativeDay(ev.date, todayDate);
                const tone =
                  rel.daysDiff === 0
                    ? 'today'
                    : rel.daysDiff === 1
                    ? 'tomorrow'
                    : 'soon';
                return (
                  <CalendarEventRow
                    key={ev.id}
                    ev={ev}
                    dayLabel={rel.label}
                    dayTone={tone}
                    onCompleteTask={handleCompleteTask}
                    onWaterPlant={handleWaterPlant}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Main Split: Calendar Grid + Selected Day Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* Calendar Grid */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-3xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-xs border border-gray-200/80 dark:border-white/[0.09]">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center font-syne text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 py-1.5"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((dayNum, idx) => {
              if (!dayNum) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[54px] sm:min-h-[84px] rounded-xl sm:rounded-2xl bg-gray-100/60 dark:bg-gray-800/30"
                  />
                );
              }

              const ds = toDateStr(year, month, dayNum);
              const dayEvents = eventsByDay.get(ds) || [];
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;

              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => handleSelectDay(ds)}
                  className={`min-h-[54px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--vibrant-sky-blue)] bg-sky-500/10 dark:bg-sky-500/15 ring-2 ring-[var(--vibrant-sky-blue)]/30'
                      : isToday
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-gray-200/70 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span
                    className={`font-dm-sans font-bold text-xs sm:text-sm ${
                      isToday
                        ? 'text-amber-600 dark:text-amber-400'
                        : isSelected
                        ? 'text-[var(--vibrant-sky-blue)]'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Mobile dots / Desktop mini chips */}
                  {dayEvents.length > 0 && (
                    <div className="w-full space-y-1">
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={`size-1.5 rounded-full ${
                              SOURCE_META[ev.source].dot
                            }`}
                          />
                        ))}
                      </div>
                      <div className="hidden sm:flex flex-col gap-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 text-[10px] font-inter text-gray-600 dark:text-gray-300 truncate"
                          >
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${
                                SOURCE_META[ev.source].dot
                              }`}
                            />
                            <span
                              className={`truncate ${
                                ev.done ? 'line-through opacity-50' : ''
                              }`}
                            >
                              {ev.title}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] font-syne font-bold text-gray-400">
                            +{dayEvents.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <aside
          ref={agendaRef}
          className="bg-white dark:bg-[#111827] rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 shadow-xs border border-gray-200/80 dark:border-white/[0.09] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[var(--vibrant-sky-blue)]/10 text-[var(--vibrant-sky-blue)]">
                <HiOutlineCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="font-dm-sans font-bold text-lg text-gray-900 dark:text-white">
                  {selectedDate === todayStr ? 'Hoy' : selectedDate}
                </h2>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  {selectedEvents.length}{' '}
                  {selectedEvents.length === 1 ? 'evento' : 'eventos'} en tu
                  agenda
                </p>
              </div>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="font-dm-sans font-bold text-sm text-gray-600 dark:text-gray-300">
                Día despejado
              </p>
              <p className="font-inter text-xs text-gray-400">
                No hay tareas, recordatorios, riegos ni gastos registrados en
                esta fecha.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 xl:max-h-[60vh] xl:overflow-y-auto xl:pr-1">
              {selectedEvents.map((ev) => (
                <CalendarEventRow
                  key={ev.id}
                  ev={ev}
                  onCompleteTask={handleCompleteTask}
                  onWaterPlant={handleWaterPlant}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
