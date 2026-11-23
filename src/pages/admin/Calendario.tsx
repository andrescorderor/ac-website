import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchWithCache } from '@/lib/cache';
import { parseTaskMeta } from '@/lib/taskMeta';
import { parseExpenseInfo } from '@/pages/admin/Finanzas';
import {
  HiChevronLeft,
  HiChevronRight,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineArrowRight,
} from 'react-icons/hi';

type EventSource = 'task' | 'reminder' | 'plant' | 'finance';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  source: EventSource;
  title: string;
  meta: string;
  path: string;
  done?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const SOURCE_META: Record<
  EventSource,
  { label: string; dot: string; badge: string; icon: string }
> = {
  task: {
    label: 'Tareas',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
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
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
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
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Calendario() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split('T')[0]);
  const [activeSources, setActiveSources] = useState<Record<EventSource, boolean>>({
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    if (!force) setLoading(true);
    try {
      const data = await fetchWithCache(
        'calendario_360_data',
        async () => {
          const [tsk, rem, plt, exp] = await Promise.all([
            supabase.from('tasks').select('id, title, description, priority, due_date, completed').not('due_date', 'is', null),
            supabase.from('reminders').select('*'),
            supabase.from('plants').select('id, nickname, species, emoji, watering_frequency_days, last_watered_at'),
            supabase.from('finance_expenses').select('id, concept, amount, category, date, created_at').order('created_at', { ascending: false }).limit(150),
          ]);
          return {
            tasks: tsk.data || [],
            reminders: rem.data || [],
            plants: plt.data || [],
            expenses: exp.data || [],
          };
        },
        3 * 60 * 1000
      );
      setRawData(data);
    } finally {
      setLoading(false);
    }
  };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
          date: t.due_date,
          source: 'task',
          title: t.title,
          meta: `${meta.area} · ${meta.priority}${t.completed ? ' · ✓ Completada' : ''}`,
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
            date: dateInMonth,
            source: 'reminder',
            title: r.title,
            meta: `${r.category || 'Evento'}${r.time ? ` · ${r.time} hrs` : ''}${r.recurring ? ' · Anual' : ''}`,
            path: '/admin/panel/recordatorios',
          });
        }
      });
    }

    // 3. Riego de Plantas proyectado en el mes
    if (activeSources.plant) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month, daysInMonth);
      rawData.plants.forEach((p) => {
        const freq = Number(p.watering_frequency_days);
        if (!p.last_watered_at || !freq || freq <= 0) return;
        const cursor = new Date(`${p.last_watered_at}T00:00:00`);
        if (Number.isNaN(cursor.getTime())) return;

        // Avanzar hasta entrar al mes visible
        while (cursor < monthStart) {
          cursor.setDate(cursor.getDate() + freq);
        }
        let guard = 0;
        while (cursor <= monthEnd && guard < 35) {
          const ds = toDateStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
          addEvent({
            id: `plt-${p.id}-${ds}`,
            date: ds,
            source: 'plant',
            title: `Regar: ${p.nickname || p.species}`,
            meta: `${p.emoji || '🪴'} Cada ${freq} días`,
            path: '/admin/panel/plantas',
          });
          cursor.setDate(cursor.getDate() + freq);
          guard++;
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
  }, [rawData, activeSources, year, month, monthPrefix, daysInMonth]);

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

  const todayStr = now.toISOString().split('T')[0];
  const selectedEvents = eventsByDay.get(selectedDate) || [];

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-[460px] rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 sm:pb-20">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Calendario <span className="text-gradient">360°</span>
          </h1>
          <p className="font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Todas tus tareas, fechas importantes, riegos de plantas y pagos en una sola vista.
          </p>
        </div>

        {/* Navigation & Sources */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center justify-center"
              title="Mes anterior"
            >
              <HiChevronLeft className="text-lg" />
            </button>
            <span className="px-3 font-dm-sans font-bold text-sm sm:text-base text-gray-900 dark:text-white min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center justify-center"
              title="Mes siguiente"
            >
              <HiChevronRight className="text-lg" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth());
              setSelectedDate(todayStr);
            }}
            className="px-4 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-all"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            className="min-w-[44px] min-h-[44px] p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-[var(--vibrant-sky-blue)] cursor-pointer flex items-center justify-center"
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
              onClick={() => setActiveSources((prev) => ({ ...prev, [src]: !prev[src] }))}
              className={`px-3.5 min-h-[40px] py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                active
                  ? meta.badge
                  : 'bg-white/60 dark:bg-gray-800/50 text-gray-400 border-gray-200/60 dark:border-gray-700/60 opacity-60'
              }`}
            >
              <span className={`size-2 rounded-full ${meta.dot}`} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split: Calendar Grid + Selected Day Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="xl:col-span-2 bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 py-1.5"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((dayNum, idx) => {
              if (!dayNum) {
                return <div key={`empty-${idx}`} className="min-h-[58px] sm:min-h-[88px] rounded-2xl bg-gray-50/40 dark:bg-gray-800/20" />;
              }

              const ds = toDateStr(year, month, dayNum);
              const dayEvents = eventsByDay.get(ds) || [];
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;

              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => setSelectedDate(ds)}
                  className={`min-h-[58px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--vibrant-sky-blue)] bg-sky-500/10 dark:bg-sky-500/15 ring-2 ring-[var(--vibrant-sky-blue)]/30'
                      : isToday
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
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
                          <span key={ev.id} className={`size-1.5 rounded-full ${SOURCE_META[ev.source].dot}`} />
                        ))}
                      </div>
                      <div className="hidden sm:flex flex-col gap-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 text-[10px] font-inter text-gray-600 dark:text-gray-300 truncate"
                          >
                            <span className={`size-1.5 rounded-full shrink-0 ${SOURCE_META[ev.source].dot}`} />
                            <span className={`truncate ${ev.done ? 'line-through opacity-50' : ''}`}>{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] font-syne font-bold text-gray-400">
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
        <aside className="bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[var(--vibrant-sky-blue)]/10 text-[var(--vibrant-sky-blue)]">
                <HiOutlineCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="font-dm-sans font-bold text-lg text-gray-900 dark:text-white">
                  {selectedDate === todayStr ? 'Hoy' : selectedDate}
                </h2>
                <p className="font-inter text-xs text-gray-400">
                  {selectedEvents.length} {selectedEvents.length === 1 ? 'evento' : 'eventos'} en tu agenda
                </p>
              </div>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="font-dm-sans font-bold text-sm text-gray-600 dark:text-gray-300">
                Día despejado
              </p>
              <p className="font-inter text-xs text-gray-400">
                No hay tareas, recordatorios, riegos ni gastos registrados en esta fecha.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {selectedEvents.map((ev) => {
                const sMeta = SOURCE_META[ev.source];
                return (
                  <Link
                    key={ev.id}
                    to={ev.path}
                    className="block p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-syne font-bold uppercase tracking-wider border ${sMeta.badge}`}>
                          {sMeta.icon} {sMeta.label}
                        </span>
                        <h4 className={`font-dm-sans font-bold text-sm text-gray-900 dark:text-white truncate ${ev.done ? 'line-through opacity-60' : ''}`}>
                          {ev.title}
                        </h4>
                        <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate">
                          {ev.meta}
                        </p>
                      </div>
                      <HiOutlineArrowRight className="text-gray-400 group-hover:text-[var(--vibrant-sky-blue)] shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
