import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineSearch } from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
};

type StatusFilter = 'pending' | 'completed' | 'all';

export default function Pendientes() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');
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
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks(tasks.filter((t) => t.id !== id));
      toast.success('Tarea eliminada');
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

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando tareas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
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

      {/* Add Task Modal / Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAddTask}
            className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)] dark:text-white">Agregar Nueva Tarea</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Título
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

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Añade detalles o notas adicionales..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
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
              className={`p-6 bg-white dark:bg-gray-900 rounded-2xl border transition-all flex items-start gap-4 shadow-sm ${
                task.completed ? 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 opacity-60' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
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
                  <p className="font-inter text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{task.description}</p>
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
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
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
