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
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!user || !newTask.title) return;

    const { error } = await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title: newTask.title,
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

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Tareas <span className="text-gradient">Pendientes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
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
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <HiOutlinePlus className="text-2xl" />
          </button>
        </div>
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

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-inter font-light italic">
            No se encontraron tareas que coincidan con tu búsqueda.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              className={`flex items-start gap-4 md:gap-6 p-5 md:p-6 rounded-[2rem] bg-white border border-gray-50 shadow-sm transition-all ${task.completed ? 'opacity-60' : ''}`}
            >
              <button 
                onClick={() => toggleTask(task.id, task.completed)}
                className="mt-1 text-3xl md:text-2xl transition-all active:scale-90 shrink-0"
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="text-green-500" />
                ) : (
                  <MdOutlineCircle className="text-gray-300 hover:text-black" />
                )}
              </button>
              
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className={`font-dm-sans text-base md:text-lg font-bold truncate-2-lines ${task.completed ? 'line-through text-gray-400' : 'text-black'}`}>
                  {task.title || 'Tarea sin título'}
                </h3>
                {task.description && (
                  <p className="font-inter text-xs md:text-sm text-gray-500 font-light leading-relaxed break-words">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <div className="pt-2">
                    <span className="inline-flex items-center font-syne text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                      Vence: {task.due_date}
                    </span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="p-3 md:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0"
              >
                <HiOutlineTrash className="text-xl md:text-lg" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
