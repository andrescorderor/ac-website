import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineViewBoards,
  HiOutlineViewList,
  HiOutlineCalendar,
  HiX,
} from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import CustomSelect from '@/components/common/CustomSelect';
import RichTextEditor from '@/components/common/RichTextEditor';
import {
  TaskPriority,
  TaskStatus,
  PRIORITY_LEVELS,
  PRIORITY_ORDER,
  PRIORITY_STYLES,
  STATUS_OPTIONS,
  SUGGESTED_AREAS,
  parseTaskMeta,
  serializeDescriptionWithMeta,
} from '@/lib/taskMeta';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  area?: string | null;
  status?: string | null;
  due_date: string | null;
  completed: boolean;
  created_at?: string;
};

type TaskItem = TaskRow & {
  area: string;
  status: TaskStatus;
  priority: TaskPriority;
  cleanDescription: string;
};

type StatusFilter = 'active' | 'pending' | 'in_progress' | 'waiting' | 'completed' | 'all';
type ViewMode = 'columns' | 'list';

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function hydrateTask(row: TaskRow): TaskItem {
  const meta = parseTaskMeta(row);
  return {
    ...row,
    area: meta.area,
    status: meta.status,
    priority: meta.priority,
    cleanDescription: meta.cleanDescription,
  };
}

function sortTasksByPriority(list: TaskItem[]): TaskItem[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
}

const AREA_PALETTE = [
  { dot: 'bg-indigo-500', headerBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300', border: 'border-indigo-500/20' },
  { dot: 'bg-emerald-500', headerBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', border: 'border-emerald-500/20' },
  { dot: 'bg-sky-500', headerBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-300', border: 'border-sky-500/20' },
  { dot: 'bg-pink-500', headerBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-300', border: 'border-pink-500/20' },
  { dot: 'bg-amber-500', headerBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-300', border: 'border-amber-500/20' },
  { dot: 'bg-violet-500', headerBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-300', border: 'border-violet-500/20' },
];

function getAreaAccent(area: string) {
  const norm = normalize(area);
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  }
  return AREA_PALETTE[hash % AREA_PALETTE.length];
}

function getDueBadgeStyle(dueDate: string, completed: boolean) {
  if (completed) return { label: dueDate, cls: 'text-gray-400 dark:text-gray-500' };
  const todayStr = new Date().toISOString().split('T')[0];
  if (dueDate < todayStr) {
    return { label: `Vencida · ${dueDate}`, cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md' };
  }
  if (dueDate === todayStr) {
    return { label: `Hoy · ${dueDate}`, cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md' };
  }
  return { label: dueDate, cls: 'text-gray-400 dark:text-gray-500' };
}

export default function Pendientes() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('columns');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    area: 'Personal',
    priority: 'Media' as TaskPriority,
    status: 'pending' as TaskStatus,
    due_date: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      if (queryParam) setStatusFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar tareas: ' + error.message);
    } else if (data) {
      setTasks(data.map(hydrateTask));
    }
    setLoading(false);
  };

  // Ámbitos únicos detectados + sugeridos para autocompletar
  const existingAreas = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.area || 'Personal'));
    return Array.from(set);
  }, [tasks]);

  const selectableAreas = useMemo(() => {
    const set = new Set<string>([...SUGGESTED_AREAS, ...existingAreas]);
    return Array.from(set);
  }, [existingAreas]);

  const openCreateModal = (presetArea?: string) => {
    setEditingTask(null);
    setFormState({
      title: '',
      description: '',
      area: presetArea || (areaFilter !== 'all' ? areaFilter : 'Personal'),
      priority: 'Media',
      status: 'pending',
      due_date: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormState({
      title: task.title,
      description: task.cleanDescription,
      area: task.area,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
    });
    setShowFormModal(true);
  };

  /**
   * Persists a task insert/update with automatic schema fallback if native area/status columns are missing.
   */
  const persistTaskPayload = async (
    mode: 'insert' | 'update',
    id: string | null,
    userId: string,
    values: {
      title: string;
      cleanDescription: string;
      area: string;
      priority: TaskPriority;
      status: TaskStatus;
      due_date: string | null;
      completed: boolean;
    }
  ): Promise<TaskRow> => {
    const fullPayload: Record<string, any> = {
      title: values.title,
      description: values.cleanDescription || null,
      priority: values.priority,
      area: values.area,
      status: values.status,
      due_date: values.due_date,
      completed: values.completed,
    };

    if (mode === 'insert') {
      fullPayload.user_id = userId;
      const { data, error } = await supabase.from('tasks').insert([fullPayload]).select().single();
      if (!error && data) return data;

      if (error && (error.message?.includes('area') || error.message?.includes('status'))) {
        const fallbackPayload = {
          user_id: userId,
          title: values.title,
          description: serializeDescriptionWithMeta(values.cleanDescription, values.area, values.status),
          priority: values.priority,
          due_date: values.due_date,
          completed: values.completed,
        };
        const res = await supabase.from('tasks').insert([fallbackPayload]).select().single();
        if (res.error) throw res.error;
        return res.data;
      }
      throw error;
    }

    const { data, error } = await supabase.from('tasks').update(fullPayload).eq('id', id!).select().single();
    if (!error && data) return data;

    if (error && (error.message?.includes('area') || error.message?.includes('status'))) {
      const fallbackPayload = {
        title: values.title,
        description: serializeDescriptionWithMeta(values.cleanDescription, values.area, values.status),
        priority: values.priority,
        due_date: values.due_date,
        completed: values.completed,
      };
      const res = await supabase.from('tasks').update(fallbackPayload).eq('id', id!).select().single();
      if (res.error) throw res.error;
      return res.data;
    }
    throw error;
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    const cleanArea = formState.area.trim() || 'Personal';
    const isCompleted = formState.status === 'completed';

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const savedRow = await persistTaskPayload(
        editingTask ? 'update' : 'insert',
        editingTask ? editingTask.id : null,
        user.id,
        {
          title: formState.title.trim(),
          cleanDescription: formState.description.trim(),
          area: cleanArea,
          priority: formState.priority,
          status: formState.status,
          due_date: formState.due_date || null,
          completed: isCompleted,
        }
      );

      const hydrated = hydrateTask({
        ...savedRow,
        area: savedRow.area ?? cleanArea,
        status: savedRow.status ?? formState.status,
      });

      if (editingTask) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? hydrated : t)));
        toast.success('Tarea actualizada ✨');
      } else {
        setTasks((prev) => [hydrated, ...prev]);
        toast.success(`Agregada en "${cleanArea}"`);
      }

      setShowFormModal(false);
      setEditingTask(null);
    } catch (err: any) {
      toast.error('Error al guardar tarea: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (task: TaskItem, nextStatus: TaskStatus) => {
    const nextCompleted = nextStatus === 'completed';
    const prevTasks = tasks;

    // Actualización optimista
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: nextStatus, completed: nextCompleted } : t
      )
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      await persistTaskPayload('update', task.id, user.id, {
        title: task.title,
        cleanDescription: task.cleanDescription,
        area: task.area,
        priority: task.priority,
        status: nextStatus,
        due_date: task.due_date,
        completed: nextCompleted,
      });

      const statusLabel = STATUS_OPTIONS.find((s) => s.value === nextStatus)?.label || nextStatus;
      toast.info(nextCompleted ? 'Tarea completada 🎉' : `Status: ${statusLabel}`);
    } catch (err: any) {
      setTasks(prevTasks);
      toast.error('Error al actualizar estado: ' + err.message);
    }
  };

  const handleCyclePriority = async (task: TaskItem) => {
    const currentIdx = PRIORITY_LEVELS.indexOf(task.priority);
    const nextPriority = PRIORITY_LEVELS[(currentIdx + 1) % PRIORITY_LEVELS.length];
    const prevTasks = tasks;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority: nextPriority } : t))
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: nextPriority })
        .eq('id', task.id);
      if (error) throw error;
      toast.info(`Prioridad: ${nextPriority}`);
    } catch (err: any) {
      setTasks(prevTasks);
      toast.error('Error al cambiar prioridad: ' + err.message);
    }
  };

  const toggleTaskComplete = (task: TaskItem) => {
    const nextStatus: TaskStatus = task.completed ? 'pending' : 'completed';
    handleChangeStatus(task, nextStatus);
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      toast.undoable('Tarea eliminada', async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return;

          await persistTaskPayload('insert', null, user.id, {
            title: taskToDelete.title,
            cleanDescription: taskToDelete.cleanDescription,
            area: taskToDelete.area,
            priority: taskToDelete.priority,
            status: taskToDelete.status,
            due_date: taskToDelete.due_date,
            completed: taskToDelete.completed,
          });
          fetchTasks();
          toast.success('Tarea restaurada ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar tarea: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar tarea: ' + err.message);
    }
  };

  const filteredTasks = useMemo(() => {
    const termNorm = normalize(searchTerm.trim());

    const list = tasks.filter((t) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? !t.completed
          : statusFilter === 'completed'
          ? t.completed
          : t.status === statusFilter && !t.completed;

      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesArea = areaFilter === 'all' || t.area === areaFilter;

      const matchesSearch =
        !termNorm ||
        normalize(t.title).includes(termNorm) ||
        normalize(t.cleanDescription).includes(termNorm) ||
        normalize(t.area).includes(termNorm) ||
        normalize(t.priority).includes(termNorm);

      return matchesStatus && matchesPriority && matchesArea && matchesSearch;
    });

    return sortTasksByPriority(list);
  }, [tasks, statusFilter, priorityFilter, areaFilter, searchTerm]);

  // Agrupación en columnas por ámbito
  const columns = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    filteredTasks.forEach((task) => {
      const list = map.get(task.area) || [];
      list.push(task);
      map.set(task.area, list);
    });

    // Ordenar columnas poniendo primero las que tienen tareas urgentes/altas
    return Array.from(map.entries()).sort((a, b) => {
      const aTop = a[1][0] ? PRIORITY_ORDER[a[1][0].priority] : 99;
      const bTop = b[1][0] ? PRIORITY_ORDER[b[1][0].priority] : 99;
      if (aTop !== bTop) return aTop - bTop;
      return b[1].length - a[1].length;
    });
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="skeleton h-10 w-48" />
            <div className="skeleton h-4 w-72" />
          </div>
          <div className="skeleton h-12 w-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderTaskCard = (task: TaskItem, compact = false) => {
    const pStyle = PRIORITY_STYLES[task.priority];

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`group ${compact ? 'p-4' : 'p-5 sm:p-6'} bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-2xl sm:rounded-3xl border border-gray-100/80 dark:border-gray-800/80 shadow-sm hover:shadow-lg transition-all duration-200 space-y-3 ${
          task.completed ? 'opacity-60' : ''
        }`}
      >
        {/* Top Row: Priority + Area (in list mode) + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <button
              type="button"
              onClick={() => handleCyclePriority(task)}
              title="Clic para cambiar prioridad"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 ${pStyle.badge}`}
            >
              <span className={`size-1.5 rounded-full ${pStyle.dot}`} />
              <span>{pStyle.label}</span>
            </button>

            {viewMode === 'list' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                {task.area}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openEditModal(task)}
              className="p-2 text-gray-400 hover:text-[var(--vibrant-sky-blue)] hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-xl transition-all cursor-pointer"
              title="Editar tarea y notas"
            >
              <HiOutlinePencil className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => {
                const isNowPinned = togglePinItem({
                  id: task.id,
                  type: 'task',
                  title: task.title,
                  subtitle: `${task.area} · ${task.priority}${task.due_date ? ` · ${task.due_date}` : ''}`,
                  path: '/admin/panel/pendientes',
                });
                toast.info(isNowPinned ? 'Tarea fijada en el inicio 📌' : 'Tarea desfijada');
                setTasks([...tasks]);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isItemPinned(task.id)
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
              title={isItemPinned(task.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
            >
              {isItemPinned(task.id) ? '📌' : '📍'}
            </button>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/15 rounded-xl transition-all cursor-pointer"
              title="Eliminar tarea"
            >
              <HiOutlineTrash className="text-base" />
            </button>
          </div>
        </div>

        {/* Title & Complete Check */}
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => toggleTaskComplete(task)}
            className="mt-0.5 text-xl transition-transform active:scale-90 shrink-0 cursor-pointer"
            title={task.completed ? 'Reabrir tarea' : 'Marcar como completada'}
          >
            {task.completed ? (
              <HiOutlineCheckCircle className="text-emerald-500" />
            ) : (
              <MdOutlineCircle className="text-gray-300 dark:text-gray-600 hover:text-emerald-500" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h4
              onClick={() => openEditModal(task)}
              className={`font-dm-sans font-bold text-sm sm:text-base leading-snug cursor-pointer hover:text-[var(--vibrant-sky-blue)] transition-colors ${
                task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </h4>

            {task.cleanDescription && (
              <AutoFormattedText
                text={task.cleanDescription}
                maxLength={140}
                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-light"
              />
            )}
          </div>
        </div>

        {/* Footer: 1-Tap Cycle Status Pill + Due Date */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-2">
          {(() => {
            const currentOpt = STATUS_OPTIONS.find((s) => s.value === task.status) || STATUS_OPTIONS[0];
            const nextOpt = STATUS_OPTIONS[(STATUS_OPTIONS.findIndex((s) => s.value === task.status) + 1) % STATUS_OPTIONS.length];
            return (
              <button
                type="button"
                onClick={() => handleChangeStatus(task, nextOpt.value)}
                title={`Clic para cambiar a: ${nextOpt.label}`}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 active:scale-95 ${currentOpt.badge}`}
              >
                {currentOpt.label} ↻
              </button>
            );
          })()}

          {task.due_date && (() => {
            const due = getDueBadgeStyle(task.due_date, task.completed);
            return (
              <span className={`inline-flex items-center gap-1 font-syne text-[10px] font-bold uppercase tracking-wider shrink-0 ${due.cls}`}>
                <HiOutlineCalendar className="text-xs" />
                {due.label}
              </span>
            );
          })()}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-28 sm:pb-20">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Tablero de <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="font-inter mt-1.5 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Monitorea tus ámbitos en columnas ordenadas por prioridad, estado y notas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar tarea, ámbito o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 min-h-[44px] py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <HiOutlineSearch className="size-5" />
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`flex items-center justify-center gap-1.5 px-3.5 min-h-[38px] rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Vista en columnas por ámbito"
            >
              <HiOutlineViewBoards className="text-base" />
              <span>Columnas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-1.5 px-3.5 min-h-[38px] rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Vista en lista unificada"
            >
              <HiOutlineViewList className="text-base" />
              <span>Lista</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-5 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </header>

      {/* Filters Row */}
      <div className="space-y-3">
        {/* Status & Priority */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'active', label: `Activas (${tasks.filter((t) => !t.completed).length})` },
              { id: 'pending', label: `Pendientes (${tasks.filter((t) => !t.completed && t.status === 'pending').length})` },
              { id: 'in_progress', label: `En Progreso (${tasks.filter((t) => !t.completed && t.status === 'in_progress').length})` },
              { id: 'waiting', label: `En Espera (${tasks.filter((t) => !t.completed && t.status === 'waiting').length})` },
              { id: 'completed', label: `Completadas (${tasks.filter((t) => t.completed).length})` },
              { id: 'all', label: `Todas (${tasks.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`px-4 min-h-[40px] py-2 rounded-2xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', ...PRIORITY_LEVELS] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  priorityFilter === p
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                    : 'bg-white/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border-gray-200/70 dark:border-gray-700/70 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p === 'all' ? 'Prioridad: Todas' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Ámbitos Pills */}
        {existingAreas.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setAreaFilter('all')}
              className={`px-3.5 min-h-[38px] py-1.5 rounded-xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                areaFilter === 'all'
                  ? 'bg-[var(--vibrant-sky-blue)] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Todos los Ámbitos ({existingAreas.length})
            </button>
            {existingAreas.map((area) => {
              const count = tasks.filter((t) => t.area === area && !t.completed).length;
              const accent = getAreaAccent(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaFilter(areaFilter === area ? 'all' : area)}
                  className={`px-3.5 min-h-[38px] py-1.5 rounded-xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    areaFilter === area
                      ? 'bg-[var(--vibrant-sky-blue)] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`size-2 rounded-full shrink-0 ${areaFilter === area ? 'bg-white' : accent.dot}`} />
                  <span>{area}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area: Columns vs List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border-none shadow-sm space-y-3">
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">
            No hay tareas con estos filtros
          </p>
          <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
            Crea una nueva tarea o restablece los filtros para ver otros ámbitos.
          </p>
          {(searchTerm || areaFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'active') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAreaFilter('all');
                setPriorityFilter('all');
                setStatusFilter('active');
              }}
              className="px-5 min-h-[44px] py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : viewMode === 'columns' ? (
        <div
          className={
            columns.length === 1
              ? 'max-w-2xl'
              : 'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory items-start'
          }
        >
          {columns.map(([areaName, areaTasks]) => {
            const accent = getAreaAccent(areaName);
            const activeCount = areaTasks.filter((t) => !t.completed).length;

            return (
              <section
                key={areaName}
                className={`${
                  columns.length === 1
                    ? 'w-full'
                    : 'w-[86vw] sm:w-[320px] xl:w-[310px] 2xl:w-[320px] shrink-0 snap-start'
                } bg-gray-50/80 dark:bg-gray-900/40 rounded-[2rem] p-4 border ${accent.border} flex flex-col gap-3`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200/70 dark:border-gray-800 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`size-2.5 rounded-full shrink-0 ${accent.dot}`} />
                    <h3 className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                      {areaName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-syne font-bold shrink-0 ${accent.headerBg}`}>
                      {activeCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCreateModal(areaName)}
                    className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[var(--vibrant-sky-blue)] shadow-2xs border border-gray-200/60 dark:border-gray-700/60 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                    title={`Agregar tarea en ${areaName}`}
                  >
                    <HiOutlinePlus className="text-base" />
                  </button>
                </div>

                {/* Column Cards (Scrollable per column for 5+ areas alignment) */}
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-0.5">
                  <AnimatePresence>
                    {areaTasks.map((task) => renderTaskCard(task, true))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTasks.map((task) => renderTaskCard(task, false))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Task Modal (4-Part Architecture) */}
      {createPortal(
        <AnimatePresence>
          {showFormModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowFormModal(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-3xl w-full border-none shadow-2xl my-8 cursor-default overflow-hidden"
              >
                {/* 1. Sticky Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                      {editingTask ? 'Editar Tarea' : 'Agregar Nueva Tarea'}
                    </h2>
                    <p className="font-inter text-xs text-gray-400">
                      Organiza por ámbito, prioridad, estado y notas de seguimiento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveTask} className="flex flex-col flex-1 min-h-0">
                  {/* 2. Scrollable Body */}
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 space-y-5">
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Preparar propuesta para cliente o junta con amigos"
                        value={formState.title}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                        className="w-full px-5 min-h-[44px] py-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      />
                    </div>

                    {/* Ámbito / Área */}
                    <div className="space-y-2">
                      <label
                        className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400"
                        title="Escribe un ámbito nuevo o elige uno existente para agrupar en columnas"
                      >
                        Ámbito / Área *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Trabajo, Social, Emprendimiento X, Personal..."
                        value={formState.area}
                        onChange={(e) => setFormState({ ...formState, area: e.target.value })}
                        className="w-full px-5 min-h-[44px] py-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectableAreas.map((areaOption) => (
                          <button
                            key={areaOption}
                            type="button"
                            onClick={() => setFormState({ ...formState, area: areaOption })}
                            className={`px-3 py-1 rounded-xl font-syne text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                              formState.area === areaOption
                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {areaOption}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prioridad, Status y Fecha Límite */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                          Prioridad
                        </label>
                        <CustomSelect
                          value={formState.priority}
                          onChange={(val) => setFormState({ ...formState, priority: val as TaskPriority })}
                          options={[
                            { value: 'Urgente', label: '🔴 Urgente' },
                            { value: 'Alta', label: '🟠 Alta' },
                            { value: 'Media', label: '🔵 Media' },
                            { value: 'Baja', label: '⚪ Baja' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                          Status
                        </label>
                        <CustomSelect
                          value={formState.status}
                          onChange={(val) => setFormState({ ...formState, status: val as TaskStatus })}
                          options={STATUS_OPTIONS.map((s) => ({
                            value: s.value,
                            label: s.label,
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                          Fecha Límite
                        </label>
                        <CustomDatePicker
                          value={formState.due_date}
                          onChange={(val) => setFormState({ ...formState, due_date: val })}
                          placeholder="Opcional..."
                        />
                      </div>
                    </div>

                    <RichTextEditor
                      label="Notas y Descripción (Opcional)"
                      value={formState.description}
                      onChange={(val) => setFormState({ ...formState, description: val })}
                      placeholder="Añade notas, contexto, links de referencia o subtareas..."
                      minHeight="140px"
                    />
                  </div>

                  {/* 3. Sticky Footer */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="px-6 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>{editingTask ? 'Guardar Cambios' : 'Guardar Tarea'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
