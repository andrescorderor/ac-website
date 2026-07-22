import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineSearch } from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';
import { useToast } from '@/components/common/ToastContext';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
};

type StatusFilter = 'pending' | 'completed' | 'all';

export default function Pendientes() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar las tareas');
    } else if (data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newTask.title.trim()) {
      toast.error('El título de la tarea es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert([
        {
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description?.trim() || null,
          due_date: newTask.due_date || null,
        },
      ]);

      if (error) throw error;

      toast.success('Tarea creada exitosamente');
      setNewTask({ title: '', description: '', due_date: '' });
      setShowAddForm(false);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
      if (error) throw error;
      toast.info(completed ? 'Tarea marcada como pendiente' : 'Tarea completada 🎉');
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tarea eliminada');
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !task.completed
        : task.completed;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando tareas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
            Tareas <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
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
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <HiOutlineSearch className="size-5" />
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
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
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
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
            className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)]">Agregar Nueva Tarea</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Revisar cotización de cliente"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Añade detalles o notas adicionales..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm resize-none"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700">No hay tareas aquí</p>
            <p className="font-inter text-sm text-gray-400">
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
              className={`p-6 bg-white rounded-2xl border transition-all flex items-start gap-4 shadow-sm ${
                task.completed ? 'border-gray-100 bg-gray-50/50 opacity-60' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                className="mt-0.5 text-2xl transition-transform active:scale-90"
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="text-emerald-500" />
                ) : (
                  <MdOutlineCircle className="text-gray-300 hover:text-gray-400" />
                )}
              </button>

              <div className="flex-1 space-y-1">
                <h4
                  className={`font-dm-sans font-bold text-base md:text-lg ${
                    task.completed ? 'line-through text-gray-400' : 'text-black'
                  }`}
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p className="font-inter text-sm text-gray-500 font-light leading-relaxed">{task.description}</p>
                )}

                {task.due_date && (
                  <span className="inline-block font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-1">
                    Fecha límite: {task.due_date}
                  </span>
                )}
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Eliminar tarea"
              >
                <HiOutlineTrash className="text-lg" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
