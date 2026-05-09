import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi';
import { MdOutlineCircle } from 'react-icons/md';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
};

export default function Pendientes() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title: newTask.title || null,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
      },
    ]);

    if (!error) {
      setNewTask({ title: '', description: '', due_date: '' });
      setShowAddForm(false);
      fetchTasks();
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
    if (!error) fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Tareas <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
            Organiza tu día a día con simplicidad.
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <HiOutlinePlus className="text-2xl" />
        </button>
      </header>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl"
          >
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Título (Opcional)</label>
                <input 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none font-inter transition-all"
                  placeholder="¿Qué hay que hacer?"
                />
              </div>
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Descripción (Opcional)</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none font-inter transition-all resize-none"
                  rows={3}
                  placeholder="Detalles adicionales..."
                />
              </div>
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">Fecha de Vencimiento (Opcional)</label>
                <input 
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none font-inter transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-black text-white rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Guardar Pendiente
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-inter font-light italic">
            No hay tareas pendientes. ¡Disfruta tu día!
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              className={`flex items-start gap-6 p-6 rounded-3xl bg-white border border-gray-50 shadow-sm transition-all ${task.completed ? 'opacity-60' : ''}`}
            >
              <button 
                onClick={() => toggleTask(task.id, task.completed)}
                className="mt-1 text-2xl transition-colors"
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="text-green-500" />
                ) : (
                  <MdOutlineCircle className="text-gray-300 hover:text-black" />
                )}
              </button>
              
              <div className="flex-1 space-y-1">
                <h3 className={`font-dm-sans text-lg font-bold ${task.completed ? 'line-through text-gray-400' : 'text-black'}`}>
                  {task.title || 'Tarea sin título'}
                </h3>
                {task.description && (
                  <p className="font-inter text-sm text-gray-500 font-light leading-relaxed">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <div className="pt-2">
                    <span className="font-syne text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                      Vence: {task.due_date}
                    </span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <HiOutlineTrash />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
