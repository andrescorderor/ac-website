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
  HiOutlineTag,
  HiOutlineAdjustments,
  HiOutlineDotsHorizontal,
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
import { loadSystemData, saveSystemData } from '@/lib/systemStore';
import { moveToTrash } from '@/lib/trash';
import {
  TaskPriority,
  TaskStatus,
  PRIORITY_LEVELS,
  PRIORITY_ORDER,
  PRIORITY_STYLES,
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
  tags?: string[] | null;
  due_date: string | null;
  completed: boolean;
  created_at?: string;
};

type TaskItem = TaskRow & {
  area: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  cleanDescription: string;
};

type StatusFilter = 'active' | 'completed' | 'all';
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
    tags: meta.tags,
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
  { dot: 'bg-indigo-500', headerBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/25' },
  { dot: 'bg-emerald-500', headerBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/25' },
  { dot: 'bg-sky-500', headerBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', border: 'border-sky-500/25' },
  { dot: 'bg-pink-500', headerBg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300', border: 'border-pink-500/25' },
  { dot: 'bg-amber-500', headerBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', border: 'border-amber-500/25' },
  { dot: 'bg-violet-500', headerBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', border: 'border-violet-500/25' },
];

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  Urgente: 'border-l-[3px] border-l-rose-500',
  Alta: 'border-l-[3px] border-l-amber-500',
  Media: 'border-l-[3px] border-l-sky-500',
  Baja: 'border-l-[3px] border-l-gray-300 dark:border-l-gray-600',
};

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

const AREAS_STORAGE_KEY = 'ac_task_areas_v1';
const TAGS_STORAGE_KEY = 'ac_task_tags_v1';

function loadLocalStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch {
    return [];
  }
}

export default function Pendientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>(() => loadLocalStringArray(AREAS_STORAGE_KEY));
  const [customTags, setCustomTags] = useState<string[]>(() => loadLocalStringArray(TAGS_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [renamingArea, setRenamingArea] = useState<string | null>(null);
  const [renameAreaValue, setRenameAreaValue] = useState('');
  const [renamingSubmitting, setRenamingSubmitting] = useState(false);

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('columns');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);

  const [tagInput, setTagInput] = useState('');
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    area: 'General',
    priority: 'Media' as TaskPriority,
    tags: [] as string[],
    due_date: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      if (queryParam) setStatusFilter('all');
    }
    if (searchParams.get('new') === '1') {
      openCreateModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasksAndConfig();
  }, []);

  const fetchTasksAndConfig = async () => {
    const [tasksRes, storedAreas, storedTags] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      loadSystemData<string[]>('task_areas', []),
      loadSystemData<string[]>('task_tags', []),
    ]);

    if (tasksRes.error) {
      toast.error('Error al cargar tareas: ' + tasksRes.error.message);
    } else if (tasksRes.data) {
      setTasks(tasksRes.data.map(hydrateTask));
    }

    if (Array.isArray(storedAreas) && storedAreas.length > 0) {
      setCustomAreas((prev) => {
        const map = new Map<string, string>();
        [...storedAreas, ...prev].forEach((a) => {
          const clean = a.trim();
          if (clean && !map.has(normalize(clean))) map.set(normalize(clean), clean);
        });
        return Array.from(map.values());
      });
    }

    if (Array.isArray(storedTags) && storedTags.length > 0) {
      setCustomTags((prev) => {
        const map = new Map<string, string>();
        [...storedTags, ...prev].forEach((t) => {
          const clean = t.trim();
          if (clean && !map.has(normalize(clean))) map.set(normalize(clean), clean);
        });
        return Array.from(map.values());
      });
    }

    setLoading(false);
  };

  // Áreas únicas detectadas (áreas creadas + áreas presentes en tareas)
  const existingAreas = useMemo(() => {
    const map = new Map<string, string>();
    [...customAreas, ...tasks.map((t) => t.area || 'General')].forEach((a) => {
      const clean = a.trim();
      if (!clean) return;
      const key = normalize(clean);
      if (!map.has(key)) map.set(key, clean);
    });
    return Array.from(map.values());
  }, [customAreas, tasks]);

  const areaSelectOptions = useMemo(() => {
    const map = new Map<string, string>();
    existingAreas.forEach((a) => map.set(normalize(a), a));
    if (formState.area.trim() && !map.has(normalize(formState.area))) {
      map.set(normalize(formState.area), formState.area.trim());
    }
    const list = Array.from(map.values());
    return list.length > 0 ? list : ['General'];
  }, [existingAreas, formState.area]);

  // Etiquetas únicas creadas y usadas por el usuario (sin etiquetas predeterminadas)
  const existingTags = useMemo(() => {
    const map = new Map<string, string>();
    [...customTags, ...tasks.flatMap((t) => t.tags || [])].forEach((tag) => {
      const clean = tag.trim();
      if (clean && !map.has(normalize(clean))) map.set(normalize(clean), clean);
    });
    return Array.from(map.values());
  }, [customTags, tasks]);

  const syncAreasStore = (next: string[]) => {
    try {
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    saveSystemData('task_areas', next);
  };

  const syncTagsStore = (next: string[]) => {
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    saveSystemData('task_tags', next);
  };

  const registerArea = (areaName: string) => {
    const clean = areaName.trim();
    if (!clean) return;
    setCustomAreas((prev) => {
      if (prev.some((a) => normalize(a) === normalize(clean))) return prev;
      const next = [...prev, clean];
      syncAreasStore(next);
      return next;
    });
  };

  const registerTags = (tagsToSave: string[]) => {
    if (tagsToSave.length === 0) return;
    setCustomTags((prev) => {
      const map = new Map<string, string>();
      prev.forEach((t) => map.set(normalize(t), t));
      let changed = false;
      tagsToSave.forEach((t) => {
        const clean = t.trim();
        if (clean && !map.has(normalize(clean))) {
          map.set(normalize(clean), clean);
          changed = true;
        }
      });
      if (!changed) return prev;
      const next = Array.from(map.values());
      syncTagsStore(next);
      return next;
    });
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAreaName.trim();
    if (!clean) {
      toast.error('Escribe el nombre del área');
      return;
    }
    if (existingAreas.some((a) => normalize(a) === normalize(clean))) {
      toast.info(`El área "${clean}" ya existe`);
      setNewAreaName('');
      setShowAreaModal(false);
      return;
    }
    registerArea(clean);
    setNewAreaName('');
    setShowAreaModal(false);
    setViewMode('columns');
    setAreaFilter('all');
    toast.success(`Área "${clean}" creada`);
  };

  const handleRemoveEmptyArea = (areaName: string) => {
    const hasTasks = tasks.some((t) => normalize(t.area) === normalize(areaName));
    if (hasTasks) return;
    setCustomAreas((prev) => {
      const next = prev.filter((a) => normalize(a) !== normalize(areaName));
      syncAreasStore(next);
      return next;
    });
    if (areaFilter === areaName) setAreaFilter('all');
    toast.info(`Columna "${areaName}" ocultada`);
  };

  const openCreateModal = (presetArea?: string) => {
    setEditingTask(null);
    setTagInput('');
    setFormState({
      title: '',
      description: '',
      area: presetArea || (areaFilter !== 'all' ? areaFilter : existingAreas[0] || 'General'),
      priority: 'Media',
      tags: tagFilter !== 'all' ? [tagFilter] : [],
      due_date: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTagInput('');
    setFormState({
      title: task.title,
      description: task.cleanDescription,
      area: task.area,
      priority: task.priority,
      tags: task.tags || [],
      due_date: task.due_date || '',
    });
    setShowFormModal(true);
  };

  const handleAddTagToForm = (rawTag?: string) => {
    const clean = (rawTag ?? tagInput).replace(/[|\[\],#]/g, '').trim();
    if (!clean) return;
    setFormState((prev) => {
      if (prev.tags.some((t) => normalize(t) === normalize(clean))) return prev;
      return { ...prev, tags: [...prev.tags, clean] };
    });
    registerTags([clean]);
    if (rawTag === undefined) setTagInput('');
  };

  const handleToggleFormTag = (tag: string) => {
    const exists = formState.tags.some((t) => normalize(t) === normalize(tag));
    if (exists) {
      setFormState((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => normalize(t) !== normalize(tag)),
      }));
    } else {
      handleAddTagToForm(tag);
    }
  };

  /**
   * Persists a task insert/update with automatic schema fallback if native area/status/tags columns are missing.
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
      tags: string[];
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
      tags: values.tags,
      due_date: values.due_date,
      completed: values.completed,
    };

    if (mode === 'insert') {
      fullPayload.user_id = userId;
      const { data, error } = await supabase.from('tasks').insert([fullPayload]).select().single();
      if (!error && data) return data;

      if (
        error &&
        (error.message?.includes('area') ||
          error.message?.includes('status') ||
          error.message?.includes('tags'))
      ) {
        const fallbackPayload = {
          user_id: userId,
          title: values.title,
          description: serializeDescriptionWithMeta(
            values.cleanDescription,
            values.area,
            values.status,
            values.tags
          ),
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

    if (
      error &&
      (error.message?.includes('area') ||
        error.message?.includes('status') ||
        error.message?.includes('tags'))
    ) {
      const fallbackPayload = {
        title: values.title,
        description: serializeDescriptionWithMeta(
          values.cleanDescription,
          values.area,
          values.status,
          values.tags
        ),
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

  const handleRenameAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingArea) return;
    const oldName = renamingArea;
    const newName = renameAreaValue.trim();

    if (!newName) {
      toast.error('Escribe el nuevo nombre del área');
      return;
    }
    if (normalize(oldName) === normalize(newName) && oldName === newName) {
      setRenamingArea(null);
      return;
    }

    setRenamingSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const affected = tasks.filter((t) => normalize(t.area) === normalize(oldName));
      await Promise.all(
        affected.map((task) =>
          persistTaskPayload('update', task.id, user.id, {
            title: task.title,
            cleanDescription: task.cleanDescription,
            area: newName,
            priority: task.priority,
            status: task.status,
            tags: task.tags,
            due_date: task.due_date,
            completed: task.completed,
          })
        )
      );

      setTasks((prev) =>
        prev.map((t) => (normalize(t.area) === normalize(oldName) ? { ...t, area: newName } : t))
      );

      setCustomAreas((prev) => {
        const replaced = prev.map((a) => (normalize(a) === normalize(oldName) ? newName : a));
        const map = new Map<string, string>();
        replaced.forEach((a) => map.set(normalize(a), a));
        if (!map.has(normalize(newName))) map.set(normalize(newName), newName);
        const next = Array.from(map.values());
        syncAreasStore(next);
        return next;
      });

      if (areaFilter === oldName) setAreaFilter(newName);
      setRenamingArea(null);
      toast.success(`Área renombrada a "${newName}" ✨`);
    } catch (err: any) {
      toast.error('Error al renombrar área: ' + err.message);
    } finally {
      setRenamingSubmitting(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    const cleanArea = formState.area.trim() || existingAreas[0] || 'General';
    const isCompleted = editingTask ? editingTask.completed : false;
    const derivedStatus: TaskStatus = isCompleted ? 'completed' : 'pending';

    // Si el usuario escribió una etiqueta en el input y dio directo en Guardar, crearla y asociarla
    const pendingTagEntries = tagInput
      .split(',')
      .map((t) => t.replace(/[|\[\],#]/g, '').trim())
      .filter(Boolean);

    const tagMap = new Map<string, string>();
    [...formState.tags, ...pendingTagEntries].forEach((tg) => {
      const clean = tg.trim();
      if (clean && !tagMap.has(normalize(clean))) {
        tagMap.set(normalize(clean), clean);
      }
    });
    const finalTags = Array.from(tagMap.values());

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
          status: derivedStatus,
          tags: finalTags,
          due_date: formState.due_date || null,
          completed: isCompleted,
        }
      );

      const hydrated = hydrateTask({
        ...savedRow,
        area: savedRow.area ?? cleanArea,
        status: savedRow.status ?? derivedStatus,
        tags: savedRow.tags ?? finalTags,
      });

      if (editingTask) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? hydrated : t)));
        toast.success('Tarea actualizada ✨');
      } else {
        setTasks((prev) => [hydrated, ...prev]);
        toast.success(`Agregada en "${cleanArea}"`);
      }

      registerArea(cleanArea);
      registerTags(finalTags);
      setTagInput('');
      setShowFormModal(false);
      setEditingTask(null);
    } catch (err: any) {
      toast.error('Error al guardar tarea: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskComplete = async (task: TaskItem) => {
    const nextCompleted = !task.completed;
    const nextStatus: TaskStatus = nextCompleted ? 'completed' : 'pending';
    const prevTasks = tasks;

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
        tags: task.tags,
        due_date: task.due_date,
        completed: nextCompleted,
      });

      toast.info(nextCompleted ? 'Tarea completada 🎉' : 'Tarea reactivada');
    } catch (err: any) {
      setTasks(prevTasks);
      toast.error('Error al actualizar tarea: ' + err.message);
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

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      // Archivar en Papelera de Reciclaje (30 días)
      moveToTrash({
        table: 'tasks',
        entityLabel: 'Tarea',
        title: taskToDelete.title,
        subtitle: `${taskToDelete.area} · ${taskToDelete.priority}`,
        payload: {
          id: taskToDelete.id,
          title: taskToDelete.title,
          description: taskToDelete.description,
          priority: taskToDelete.priority,
          due_date: taskToDelete.due_date,
          completed: taskToDelete.completed,
        },
      });

      toast.undoable('Tarea movida a Papelera', async () => {
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
            tags: taskToDelete.tags,
            due_date: taskToDelete.due_date,
            completed: taskToDelete.completed,
          });
          fetchTasksAndConfig();
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
          : t.completed;

      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesArea = areaFilter === 'all' || t.area === areaFilter;
      const matchesTag =
        tagFilter === 'all' || t.tags.some((tg) => normalize(tg) === normalize(tagFilter));

      const matchesSearch =
        !termNorm ||
        normalize(t.title).includes(termNorm) ||
        normalize(t.cleanDescription).includes(termNorm) ||
        normalize(t.area).includes(termNorm) ||
        normalize(t.priority).includes(termNorm) ||
        t.tags.some((tg) => normalize(tg).includes(termNorm));

      return matchesStatus && matchesPriority && matchesArea && matchesTag && matchesSearch;
    });

    return sortTasksByPriority(list);
  }, [tasks, statusFilter, priorityFilter, areaFilter, tagFilter, searchTerm]);

  // Agrupación en columnas por área (incluye columnas vacías creadas por el usuario)
  const columns = useMemo(() => {
    const map = new Map<string, TaskItem[]>();

    const termNorm = normalize(searchTerm.trim());
    existingAreas.forEach((area) => {
      if (areaFilter !== 'all' && area !== areaFilter) return;
      if (termNorm && !normalize(area).includes(termNorm)) return;
      if (tagFilter !== 'all') return; // si filtramos por etiqueta, mostramos solo áreas que tengan coincidencias
      map.set(area, []);
    });

    filteredTasks.forEach((task) => {
      const list = map.get(task.area) || [];
      list.push(task);
      map.set(task.area, list);
    });

    return Array.from(map.entries()).sort((a, b) => {
      const aTop = a[1][0] ? PRIORITY_ORDER[a[1][0].priority] : 99;
      const bTop = b[1][0] ? PRIORITY_ORDER[b[1][0].priority] : 99;
      if (aTop !== bTop) return aTop - bTop;
      return b[1].length - a[1].length;
    });
  }, [existingAreas, filteredTasks, areaFilter, tagFilter, searchTerm]);

  const activeFilterCount =
    (statusFilter !== 'active' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (tagFilter !== 'all' ? 1 : 0);

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex justify-between items-end gap-4">
          <div className="space-y-2.5">
            <div className="skeleton h-9 w-48" />
            <div className="skeleton h-4 w-72 hidden sm:block" />
          </div>
          <div className="skeleton h-11 w-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderTaskCard = (task: TaskItem) => {
    const pStyle = PRIORITY_STYLES[task.priority];
    const isMenuOpen = openMenuTaskId === task.id;

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`relative group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/[0.09] ${PRIORITY_BORDER[task.priority]} shadow-xs hover:shadow-md transition-all duration-200 space-y-2.5 ${
          task.completed ? 'opacity-65' : ''
        } ${isMenuOpen ? 'z-30' : ''}`}
      >
        {/* Top Row: Priority + Area (in list mode) + Compact Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <button
              type="button"
              onClick={() => handleCyclePriority(task)}
              title="Clic para cambiar prioridad"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 ${pStyle.badge}`}
            >
              <span className={`size-1.5 rounded-full ${pStyle.dot}`} />
              <span>{pStyle.label}</span>
            </button>

            {viewMode === 'list' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-syne font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-white/10 truncate max-w-[150px]">
                {task.area}
              </span>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenuTaskId(isMenuOpen ? null : task.id)}
              className="min-w-[38px] min-h-[38px] p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Acciones de tarea"
              aria-label="Acciones de tarea"
            >
              <HiOutlineDotsHorizontal className="text-lg" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setOpenMenuTaskId(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-200/90 dark:border-white/15 shadow-xl p-1.5 z-30 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuTaskId(null);
                      openEditModal(task);
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-inter font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <HiOutlinePencil className="text-sm text-[var(--vibrant-sky-blue)]" />
                    <span>Editar y notas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuTaskId(null);
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
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-inter font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isItemPinned(task.id) ? '📌' : '📍'}</span>
                    <span>{isItemPinned(task.id) ? 'Desfijar' : 'Fijar en Inicio'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuTaskId(null);
                      deleteTask(task.id);
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-inter font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                  >
                    <HiOutlineTrash className="text-sm" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title, Tags & Description */}
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => toggleTaskComplete(task)}
            className="mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center text-xl transition-transform active:scale-90 shrink-0 cursor-pointer"
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

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => setTagFilter(normalize(tagFilter) === normalize(tg) ? 'all' : tg)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-syne font-bold transition-all cursor-pointer ${
                      normalize(tagFilter) === normalize(tg)
                        ? 'bg-[var(--vibrant-sky-blue)] text-white'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20'
                    }`}
                    title={`Filtrar por etiqueta #${tg}`}
                  >
                    #{tg}
                  </button>
                ))}
              </div>
            )}

            {task.cleanDescription && (
              <AutoFormattedText
                text={task.cleanDescription}
                maxLength={140}
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light"
              />
            )}
          </div>
        </div>

        {/* Footer: Due Date only when present */}
        {task.due_date &&
          (() => {
            const due = getDueBadgeStyle(task.due_date, task.completed);
            return (
              <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-end">
                <span
                  className={`inline-flex items-center gap-1 font-syne text-[11px] font-bold uppercase tracking-wider shrink-0 ${due.cls}`}
                >
                  <HiOutlineCalendar className="text-xs" />
                  {due.label}
                </span>
              </div>
            );
          })()}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Compact Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Tablero de <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Organiza tus áreas en columnas ordenadas por prioridad, etiquetas y notas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewAreaName('');
              setShowAreaModal(true);
            }}
            className="px-3.5 min-h-[44px] py-2 bg-white dark:bg-[#111827] text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-white/10 font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:border-[var(--vibrant-sky-blue)] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HiOutlinePlus className="text-base text-[var(--vibrant-sky-blue)]" />
            <span>Área</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="flex-1 sm:flex-initial px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <HiOutlinePlus className="text-base" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </header>

      {/* Unified Compact Toolbar: Search + Filters Button + View Switcher */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Buscar tarea, área o #etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-3.5 min-h-[44px] py-2 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              showFiltersPanel || activeFilterCount > 0
                ? 'bg-[var(--vibrant-sky-blue)]/10 text-[var(--vibrant-sky-blue)] border-[var(--vibrant-sky-blue)]/40'
                : 'bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <HiOutlineAdjustments className="text-base" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="size-5 rounded-full bg-[var(--vibrant-sky-blue)] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-[#111827] p-1 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`flex items-center justify-center gap-1.5 px-3 min-h-[36px] rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Vista por áreas / columnas"
            >
              <HiOutlineViewBoards className="text-base" />
              <span className="hidden sm:inline">Columnas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-1.5 px-3 min-h-[36px] rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Vista en lista unificada"
            >
              <HiOutlineViewList className="text-base" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>

        {/* Áreas Pills (Always completely visible via flex-wrap — no hidden horizontal scroll) */}
        {existingAreas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAreaFilter('all')}
              className={`px-3 min-h-[38px] py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                areaFilter === 'all'
                  ? 'bg-[var(--vibrant-sky-blue)] text-white border-[var(--vibrant-sky-blue)] shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Todas ({existingAreas.length})
            </button>
            {existingAreas.map((area) => {
              const count = tasks.filter((t) => t.area === area && !t.completed).length;
              const accent = getAreaAccent(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaFilter(areaFilter === area ? 'all' : area)}
                  className={`px-3 min-h-[38px] py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                    areaFilter === area
                      ? 'bg-[var(--vibrant-sky-blue)] text-white border-[var(--vibrant-sky-blue)] shadow-xs'
                      : 'bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className={`size-2 rounded-full shrink-0 ${areaFilter === area ? 'bg-white' : accent.dot}`} />
                  <span>{area}</span>
                  <span className="opacity-70 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filter Summary Chips (when panel collapsed) */}
        {!showFiltersPanel && activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {statusFilter !== 'active' && (
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-syne text-[11px] font-bold cursor-pointer"
              >
                <span>Ver: {statusFilter === 'completed' ? 'Completadas' : 'Todas'}</span>
                <HiX className="text-xs" />
              </button>
            )}
            {priorityFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setPriorityFilter('all')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-syne text-[11px] font-bold cursor-pointer"
              >
                <span>Prioridad: {priorityFilter}</span>
                <HiX className="text-xs" />
              </button>
            )}
            {tagFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setTagFilter('all')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-syne text-[11px] font-bold cursor-pointer"
              >
                <span>#{tagFilter}</span>
                <HiX className="text-xs" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setPriorityFilter('all');
                setTagFilter('all');
              }}
              className="px-2.5 py-1 text-[11px] font-syne font-bold uppercase text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* Collapsible Full Filters Drawer */}
        <AnimatePresence>
          {showFiltersPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="surface-panel rounded-2xl p-3.5 sm:p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">
                    Mostrar
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'active', label: `Activas (${tasks.filter((t) => !t.completed).length})` },
                      { id: 'completed', label: `Completadas (${tasks.filter((t) => t.completed).length})` },
                      { id: 'all', label: `Todas (${tasks.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id as StatusFilter)}
                        className={`px-3 min-h-[38px] py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          statusFilter === tab.id
                            ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                            : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block">
                    Prioridad
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', ...PRIORITY_LEVELS] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriorityFilter(p)}
                        className={`px-3 min-h-[38px] py-1.5 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                          priorityFilter === p
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                            : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p === 'all' ? 'Todas' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {existingTags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1 font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      <HiOutlineTag className="text-xs" /> Etiquetas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTagFilter('all')}
                        className={`px-3 min-h-[36px] py-1 rounded-xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          tagFilter === 'all'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent'
                            : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10'
                        }`}
                      >
                        Todas
                      </button>
                      {existingTags.map((tg) => (
                        <button
                          key={tg}
                          type="button"
                          onClick={() => setTagFilter(normalize(tagFilter) === normalize(tg) ? 'all' : tg)}
                          className={`px-3 min-h-[36px] py-1 rounded-xl text-xs font-syne font-bold border transition-all cursor-pointer ${
                            normalize(tagFilter) === normalize(tg)
                              ? 'bg-[var(--vibrant-sky-blue)] text-white border-[var(--vibrant-sky-blue)] shadow-xs'
                              : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 hover:bg-sky-500/20'
                          }`}
                        >
                          #{tg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Area: Columns (stacked cleanly on mobile, side-by-side on md+) vs List */}
      {viewMode === 'columns' ? (
        columns.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-8 sm:p-12 text-center border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">
              No hay áreas o tareas con estos filtros
            </p>
            <p className="font-inter text-sm text-gray-500 dark:text-gray-400">
              Crea un área nueva para organizar tus pendientes en columnas o restablece los filtros.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewAreaName('');
                  setShowAreaModal(true);
                }}
                className="px-5 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                + Crear Área
              </button>
              {(searchTerm || areaFilter !== 'all' || tagFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'active') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setAreaFilter('all');
                    setTagFilter('all');
                    setPriorityFilter('all');
                    setStatusFilter('active');
                  }}
                  className="px-5 min-h-[44px] py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={
              columns.length === 1 && areaFilter !== 'all'
                ? 'max-w-2xl'
                : 'space-y-4 md:space-y-0 md:flex md:gap-4 md:overflow-x-auto md:pb-4 md:items-start'
            }
          >
            {columns.map(([areaName, areaTasks]) => {
              const accent = getAreaAccent(areaName);
              const activeCount = areaTasks.filter((t) => !t.completed).length;
              const hasAnyTaskInArea = tasks.some((t) => normalize(t.area) === normalize(areaName));

              return (
                <section
                  key={areaName}
                  className={`${
                    columns.length === 1 && areaFilter !== 'all'
                      ? 'w-full'
                      : 'w-full md:w-[320px] xl:w-[310px] 2xl:w-[320px] shrink-0'
                  } surface-panel rounded-3xl p-3.5 sm:p-4 flex flex-col gap-3`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-200/80 dark:border-white/[0.08] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`size-2.5 rounded-full shrink-0 ${accent.dot}`} />
                      <h3 className="font-dm-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                        {areaName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-syne font-bold shrink-0 ${accent.headerBg}`}>
                        {activeCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingArea(areaName);
                          setRenameAreaValue(areaName);
                        }}
                        className="min-w-[36px] min-h-[36px] p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-[var(--vibrant-sky-blue)] hover:bg-sky-500/10 transition-all cursor-pointer flex items-center justify-center"
                        title={`Renombrar área ${areaName}`}
                      >
                        <HiOutlinePencil className="text-sm" />
                      </button>

                      {!hasAnyTaskInArea && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmptyArea(areaName)}
                          className="min-w-[36px] min-h-[36px] p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center justify-center"
                          title={`Quitar área vacía ${areaName}`}
                        >
                          <HiX className="text-sm" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openCreateModal(areaName)}
                        className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-200 hover:text-[var(--vibrant-sky-blue)] shadow-xs border border-gray-200/80 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center"
                        title={`Agregar tarea en ${areaName}`}
                      >
                        <HiOutlinePlus className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Column Cards: Natural flow on mobile (no trapped inner scroll), independent scroll on desktop */}
                  <div className="space-y-3 md:max-h-[68vh] md:overflow-y-auto md:pr-0.5">
                    {areaTasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openCreateModal(areaName)}
                        className="w-full py-7 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-center text-gray-500 dark:text-gray-400 hover:border-[var(--vibrant-sky-blue)] hover:text-[var(--vibrant-sky-blue)] transition-all cursor-pointer space-y-1.5"
                      >
                        <HiOutlinePlus className="text-xl mx-auto" />
                        <span className="block font-syne text-[11px] font-bold uppercase tracking-wider">
                          Agregar en {areaName}
                        </span>
                      </button>
                    ) : (
                      <AnimatePresence>
                        {areaTasks.map((task) => renderTaskCard(task))}
                      </AnimatePresence>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Ghost Add Column Card */}
            {areaFilter === 'all' && tagFilter === 'all' && !searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setNewAreaName('');
                  setShowAreaModal(true);
                }}
                className="w-full md:w-[240px] shrink-0 min-h-[120px] md:min-h-[160px] rounded-3xl border-2 border-dashed border-gray-300/80 dark:border-white/15 hover:border-[var(--vibrant-sky-blue)] text-gray-500 dark:text-gray-400 hover:text-[var(--vibrant-sky-blue)] transition-all flex flex-col items-center justify-center gap-2 p-5 cursor-pointer"
              >
                <div className="size-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <HiOutlinePlus className="text-xl" />
                </div>
                <span className="font-syne text-xs font-bold uppercase tracking-wider text-center">
                  Nueva Área
                </span>
              </button>
            )}
          </div>
        )
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-8 sm:p-12 text-center border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">
            No hay tareas con estos filtros
          </p>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400">
            Crea una nueva tarea o restablece los filtros para ver otras áreas.
          </p>
          {(searchTerm || areaFilter !== 'all' || tagFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'active') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAreaFilter('all');
                setTagFilter('all');
                setPriorityFilter('all');
                setStatusFilter('active');
              }}
              className="px-5 min-h-[44px] py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task) => renderTaskCard(task))}
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
                      Organiza por área, prioridad, etiquetas y notas de seguimiento.
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

                    {/* Área (Solo seleccionable) */}
                    <div>
                      <label
                        className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2"
                        title="Selecciona una de tus áreas existentes. Para crear una nueva usa el botón + Área del tablero."
                      >
                        Área *
                      </label>
                      <CustomSelect
                        value={formState.area}
                        onChange={(val) => setFormState({ ...formState, area: val })}
                        options={areaSelectOptions.map((a) => ({ value: a, label: a }))}
                      />
                    </div>

                    {/* Etiquetas Customizadas (creadas por el usuario) */}
                    <div className="space-y-2">
                      <label
                        className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400"
                        title="Escribe una etiqueta nueva para crearla o selecciona alguna que ya hayas creado"
                      >
                        Etiquetas (Opcional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Escribe una etiqueta nueva..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTagToForm();
                            }
                          }}
                          className="flex-1 px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTagToForm()}
                          className="px-4 min-h-[44px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                        >
                          + Añadir
                        </button>
                      </div>

                      {/* Etiquetas seleccionadas */}
                      {formState.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formState.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--vibrant-sky-blue)] text-white font-syne text-[11px] font-bold"
                            >
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleFormTag(tag)}
                                className="hover:opacity-75 cursor-pointer"
                                title="Quitar etiqueta"
                              >
                                <HiX className="text-xs" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Etiquetas existentes creadas previamente por el usuario */}
                      {existingTags.filter(
                        (t) => !formState.tags.some((selected) => normalize(selected) === normalize(t))
                      ).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {existingTags
                            .filter((t) => !formState.tags.some((selected) => normalize(selected) === normalize(t)))
                            .map((tagOption) => (
                              <button
                                key={tagOption}
                                type="button"
                                onClick={() => handleToggleFormTag(tagOption)}
                                className="px-2.5 py-1 rounded-xl font-syne text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-white/10 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 transition-all cursor-pointer"
                              >
                                + #{tagOption}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Prioridad y Fecha Límite */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Create New Area Modal (4-Part Architecture) */}
      {createPortal(
        <AnimatePresence>
          {showAreaModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAreaModal(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] max-h-[90vh] flex flex-col max-w-md w-full border-none shadow-2xl cursor-default overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                      Nueva Área
                    </h2>
                    <p className="font-inter text-xs text-gray-400">
                      Crea una columna dedicada en tu tablero de pendientes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAreaModal(false)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleCreateArea} className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Nombre del Área *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ej. Departamento, Social, Proyecto..."
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        className="w-full px-4 min-h-[44px] py-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAreaModal(false)}
                      className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      Crear Columna
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Rename Area Modal (4-Part Architecture) */}
      {createPortal(
        <AnimatePresence>
          {renamingArea && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setRenamingArea(null);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] max-h-[90vh] flex flex-col max-w-md w-full border-none shadow-2xl cursor-default overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                      Renombrar Área
                    </h2>
                    <p className="font-inter text-xs text-gray-400">
                      Actualiza "{renamingArea}" y todas sus tareas asociadas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenamingArea(null)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleRenameAreaSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Nuevo Nombre del Área *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={renameAreaValue}
                        onChange={(e) => setRenameAreaValue(e.target.value)}
                        className="w-full px-4 min-h-[44px] py-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRenamingArea(null)}
                      className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={renamingSubmitting}
                      className="px-6 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {renamingSubmitting ? 'Actualizando...' : 'Guardar Nombre'}
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
