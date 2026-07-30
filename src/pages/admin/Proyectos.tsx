import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/common/CustomSelect';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineDotsCircleHorizontal,
  HiX,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSearch,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';

type Task = { id: string; text: string; done: boolean };

type Project = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  emoji: string;
  notes: string | null;
  tasks: Task[];
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  idea:        { label: 'Idea',        color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',           dot: 'bg-gray-400' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',         dot: 'bg-blue-500 animate-pulse' },
  pausado:     { label: 'Pausado',     color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300',     dot: 'bg-amber-500' },
  terminado:   { label: 'Terminado',   color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const CATEGORIES = ['Personal', 'Desarrollo', 'Diseño', 'Contenido', 'Negocio'];
const EMOJIS = ['🛠️', '🎨', '🎵', '📝', '🚀', '🌍', '🎬', '📱', '💡', '🎯', '📸', '🎮', '🏗️', '🌱'];

const EMPTY_FORM = { name: '', description: '', category: 'Personal', status: 'idea', emoji: '🛠️', notes: '' };

export default function Proyectos() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [newTaskText, setNewTaskText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('creative_projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Error al cargar proyectos: ' + error.message);
    else if (data) setProjects(data.map(p => ({ ...p, tasks: p.tasks || [] })));
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (p: Project) => {
    setEditingProject(p);
    setForm({ name: p.name, description: p.description || '', category: p.category, status: p.status, emoji: p.emoji, notes: p.notes || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('creative_projects')
          .update({ name: form.name, description: form.description, category: form.category, status: form.status, emoji: form.emoji, notes: form.notes })
          .eq('id', editingProject.id);
        if (error) throw error;
        setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...form } : p));
        toast.success('Proyecto actualizado');
      } else {
        const { data, error } = await supabase
          .from('creative_projects')
          .insert([{ user_id: user.id, ...form, tasks: [] }])
          .select();
        if (error) throw error;
        if (data) setProjects([{ ...data[0], tasks: [] }, ...projects]);
        toast.success('Proyecto creado');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingProject(null);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('creative_projects').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setProjects(projects.filter(p => p.id !== id));
    toast.success('Proyecto eliminado');
  };

  const descTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (
    formatter: (selectedText: string, beforeText: string) => { textToInsert: string; cursorOffset?: number }
  ) => {
    const el = descTextareaRef.current;
    const currentVal = form.description || '';

    if (!el) {
      const res = formatter('', currentVal);
      setForm(prev => ({ ...prev, description: currentVal + res.textToInsert }));
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = currentVal.substring(0, start);
    const selected = currentVal.substring(start, end);
    const after = currentVal.substring(end);

    const { textToInsert, cursorOffset } = formatter(selected, before);

    const newVal = before + textToInsert + after;
    setForm(prev => ({ ...prev, description: newVal }));

    setTimeout(() => {
      if (el) {
        el.focus();
        const newCursorPos = cursorOffset !== undefined ? start + cursorOffset : start + textToInsert.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const insertBullet = () => {
    insertAtCursor((_, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n• ' : '• ';
      return { textToInsert: prefix };
    });
  };

  const insertBold = () => {
    insertAtCursor((selected) => {
      if (selected) {
        return { textToInsert: `**${selected}**` };
      }
      return { textToInsert: '**texto**', cursorOffset: 2 };
    });
  };

  const insertHeading = () => {
    insertAtCursor((selected, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = needsNewline ? '\n\n### ' : '### ';
      const text = selected || 'Título de sección';
      return { textToInsert: `${prefix}${text}` };
    });
  };

  const insertNumberList = () => {
    insertAtCursor((_, before) => {
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const lines = before.split('\n');
      let nextNum = 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].trim().match(/^(\d+)[\.\)]\s+/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
          break;
        }
      }
      const prefix = needsNewline ? `\n${nextNum}. ` : `${nextNum}. `;
      return { textToInsert: prefix };
    });
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('creative_projects').update({ status }).eq('id', id);
    setProjects(projects.map(p => p.id === id ? { ...p, status } : p));
  };

  const addTask = async (project: Project) => {
    if (!newTaskText.trim()) return;
    const newTask: Task = { id: Date.now().toString(), text: newTaskText.trim(), done: false };
    const updatedTasks = [...project.tasks, newTask];
    await supabase.from('creative_projects').update({ tasks: updatedTasks }).eq('id', project.id);
    setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));
    setNewTaskText('');
  };

  const toggleTask = async (project: Project, taskId: string) => {
    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    await supabase.from('creative_projects').update({ tasks: updatedTasks }).eq('id', project.id);
    setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));
  };

  const deleteTask = async (project: Project, taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    await supabase.from('creative_projects').update({ tasks: updatedTasks }).eq('id', project.id);
    setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));
  };

  const filtered = projects.filter(p => 
    (filterStatus === 'all' || p.status === filterStatus) &&
    (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-56 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-28 sm:pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
            Proyectos <span className="text-gradient">Creativos</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Tu espacio personal para gestionar proyectos y creaciones propias.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={openAddForm}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            Nuevo Proyecto
          </motion.button>
        </div>
      </header>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Todos' },
          ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({ key, label: val.label }))
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all ${
              filterStatus === key
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {showForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full border-none shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                    {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto Creativo'}
                  </h2>
                  <p className="font-inter text-xs text-gray-400">Organiza tus metas, links y tareas de desarrollo personal.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ícono del Proyecto</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button
                        key={e} type="button"
                        onClick={() => setForm({ ...form, emoji: e })}
                        className={`size-10 text-xl rounded-xl border-2 transition-all ${form.emoji === e ? 'border-black dark:border-white scale-110 bg-gray-100 dark:bg-gray-800' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Nombre del Proyecto *</label>
                  <input
                    required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Rediseño Portfolio 2026, App Móvil..."
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Estado</label>
                    <CustomSelect
                      value={form.status}
                      onChange={val => setForm({ ...form, status: val as any })}
                      options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Categoría</label>
                    <CustomSelect
                      value={form.category}
                      onChange={val => setForm({ ...form, category: val })}
                      options={CATEGORIES.map(c => ({ value: c, label: c }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-2 mb-3">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Descripción (Soporta Markdown)</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={insertHeading}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0 flex items-center gap-1"
                        title="Agregar título de sección"
                      >
                        <span className="text-sky-500 font-bold">H3</span>
                        <span>Sección</span>
                      </button>
                      <button
                        type="button"
                        onClick={insertBold}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                        title="Texto en negrita"
                      >
                        <strong>B</strong> Negrita
                      </button>
                      <button
                        type="button"
                        onClick={insertNumberList}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                        title="Lista numerada (1., 2., 3...)"
                      >
                        1. Paso
                      </button>
                      <button
                        type="button"
                        onClick={insertBullet}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all shrink-0"
                        title="Viñeta de punto"
                      >
                        • Viñeta
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={descTextareaRef}
                    rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="¿De qué trata este proyecto? (Puedes usar saltos de línea y viñetas)"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {submitting ? 'Guardando...' : (editingProject ? 'Actualizar' : 'Crear Proyecto')}
                </button>
              </div>
            </motion.form>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-3">
          <div className="text-5xl">🛠️</div>
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-300">No hay proyectos aquí aún</p>
          <p className="font-inter text-sm text-gray-400">¡Empieza registrando tu primera idea creativa!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((project) => {
              const isExpanded = expandedId === project.id;
              const doneTasks = project.tasks.filter(t => t.done).length;
              const totalTasks = project.tasks.length;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Card Header */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                          {project.emoji}
                        </div>
                        <div>
                          <h3 className="font-dm-sans font-bold text-base text-black dark:text-white leading-tight">{project.name}</h3>
                          <span className="font-syne text-[9px] font-bold uppercase tracking-wider text-gray-400">{project.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const isNowPinned = togglePinItem({
                              id: project.id,
                              type: 'project',
                              title: project.name,
                              subtitle: project.category,
                              path: '/admin/panel/proyectos',
                            });
                            toast.info(isNowPinned ? 'Proyecto fijado 📌' : 'Proyecto desfijado');
                            setProjects([...projects]);
                          }}
                          className={`p-1.5 rounded-xl transition-all ${
                            isItemPinned(project.id)
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                          title={isItemPinned(project.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                        >
                          📌
                        </button>
                        <button onClick={() => openEditForm(project)} className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                          <HiOutlinePencil className="text-sm" />
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                          <HiOutlineTrash className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Status selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => updateStatus(project.id, key)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-syne font-bold uppercase tracking-wider transition-all ${
                            project.status === key ? val.color : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${project.status === key ? val.dot : 'bg-gray-300 dark:bg-gray-600'}`} />
                          {val.label}
                        </button>
                      ))}
                    </div>

                    {project.description && (
                      <AutoFormattedText text={project.description} className="text-sm text-gray-600 dark:text-gray-300 font-light" />
                    )}

                    {/* Progress bar */}
                    {totalTasks > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">Progreso</span>
                          <span className="font-dm-sans text-xs font-bold text-gray-600 dark:text-gray-300">{doneTasks}/{totalTasks}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${(doneTasks / totalTasks) * 100}%` }}
                            className="h-full bg-[var(--vibrant-sky-blue)] rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Tasks */}
                  <div className="border-t border-gray-100/50 dark:border-gray-800/50">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : project.id)}
                      className="w-full px-6 py-3 flex items-center justify-between text-xs font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all"
                    >
                      <span>Sub-tareas ({totalTasks})</span>
                      {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-5 space-y-2">
                            {project.tasks.map(task => (
                              <div key={task.id} className="flex items-center gap-3 group">
                                <button onClick={() => toggleTask(project, task.id)} className="shrink-0">
                                  {task.done
                                    ? <HiOutlineCheckCircle className="text-emerald-500 text-lg" />
                                    : <HiOutlineDotsCircleHorizontal className="text-gray-300 dark:text-gray-600 text-lg" />
                                  }
                                </button>
                                <span className={`font-inter text-sm flex-1 ${task.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {task.text}
                                </span>
                                <button onClick={() => deleteTask(project, task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
                                  <HiX className="text-xs" />
                                </button>
                              </div>
                            ))}

                            <div className="flex gap-2 mt-3">
                              <input
                                placeholder="Nueva sub-tarea..."
                                value={expandedId === project.id ? newTaskText : ''}
                                onChange={e => setNewTaskText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTask(project)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
                              />
                              <button
                                onClick={() => addTask(project)}
                                className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl interactive-hover"
                              >
                                <HiOutlinePlus />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
