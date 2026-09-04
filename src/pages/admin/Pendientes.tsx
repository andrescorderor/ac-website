import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineSearch, HiX } from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import RichTextEditor from '@/components/common/RichTextEditor';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
};

type StatusFilter = 'pending' | 'completed' | 'all';

export default function Pendientes() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
      // Automatically show 'all' if searching for a specific item
      if (queryParam) setStatusFilter('all');
    }
  }, [searchParams]);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar tareas: ' + error.message);
    else if (data) setTasks(data);
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!newTask.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title: newTask.title.trim(),
            description: newTask.description.trim() || null,
            due_date: newTask.due_date || null,
            completed: false,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTasks([data[0], ...tasks]);
        setNewTask({ title: '', description: '', due_date: '' });
        setShowAddForm(false);
        toast.success('Tarea agregada');
      }
    } catch (err: any) {
      toast.error('Error al crear tarea: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
      if (error) throw error;

      setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !currentStatus } : t)));
      toast.info(!currentStatus ? 'Tarea completada 🎉' : 'Tarea reabierta');
    } catch (err: any) {
      toast.error('Error al actualizar tarea: ' + err.message);
    }
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
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = taskToDelete as any;
          const { error: restoreErr } = await supabase.from('tasks').insert([{
            id: taskToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
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

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !t.completed
        : t.completed;

    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Tareas <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Organiza tu día y mantén el enfoque en lo importante.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar tarea..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <HiOutlineSearch className="size-5" />
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'pending', label: `Pendientes (${tasks.filter((t) => !t.completed).length})` },
          { id: 'completed', label: `Completadas (${tasks.filter((t) => t.completed).length})` },
          { id: 'all', label: `Todas (${tasks.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as StatusFilter)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Task Modal */}
      {createPortal(
        <AnimatePresence>
          {showAddForm && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddForm(false);
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-3xl lg:max-w-4xl w-full border-none shadow-2xl my-8 cursor-default overflow-hidden"
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div>
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">Agregar Nueva Tarea</h2>
                  <p className="font-inter text-xs text-gray-400">Registra tus pendientes personales con fecha límite opcional.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Revisar cotización de cliente"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <RichTextEditor
                    label="Descripción (Opcional)"
                    value={newTask.description}
                    onChange={(val) => setNewTask({ ...newTask, description: val })}
                    placeholder="Añade detalles, notas adicionales, listas o subtareas..."
                    minHeight="140px"
                  />

                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                      Fecha Límite (Opcional)
                    </label>
                    <CustomDatePicker
                      value={newTask.due_date}
                      onChange={(val) => setNewTask({ ...newTask, due_date: val })}
                      placeholder="Seleccionar fecha límite..."
                    />
                  </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar Tarea</span>
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

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border-none shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">No hay tareas aquí</p>
            <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
              {statusFilter === 'pending'
                ? '¡Excelente! No tienes tareas pendientes.'
                : 'No se encontraron registros con este filtro.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group p-6 bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-4 ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                className="mt-0.5 text-2xl transition-transform active:scale-90"
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="text-emerald-500" />
                ) : (
                  <MdOutlineCircle className="text-gray-300 dark:text-gray-600 hover:text-gray-400" />
                )}
              </button>

              <div className="flex-1 space-y-1">
                <h4
                  className={`font-dm-sans font-bold text-base md:text-lg ${
                    task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-black dark:text-white'
                  }`}
                >
                  {task.title}
                </h4>

                {task.description && (
                  <AutoFormattedText text={task.description} className="text-sm text-gray-500 dark:text-gray-400 font-light" />
                )}

                {task.due_date && (
                  <span className="inline-block font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pt-1">
                    Fecha límite: {task.due_date}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const isNowPinned = togglePinItem({
                      id: task.id,
                      type: 'task',
                      title: task.title,
                      subtitle: task.due_date ? `Vence: ${task.due_date}` : 'Tarea Pendiente',
                      path: '/admin/panel/pendientes',
                    });
                    toast.info(isNowPinned ? 'Tarea fijada en el inicio 📌' : 'Tarea desfijada');
                    setTasks([...tasks]);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isItemPinned(task.id)
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                  title={isItemPinned(task.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                >
                  {isItemPinned(task.id) ? '📌' : '📍'}
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0"
                  title="Eliminar tarea"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
