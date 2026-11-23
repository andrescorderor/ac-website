import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlinePencil, 
  HiOutlineCheckCircle, 
  HiOutlineDotsCircleHorizontal,
  HiX,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShoppingBag
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { moveToTrash } from '@/lib/trash';
import { invalidateCache } from '@/lib/cache';
import { Link, useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import RichTextEditor from '@/components/common/RichTextEditor';

type Task = {
  id: string;
  text: string;
  done: boolean;
  shoppingItemId?: string | null;
  shoppingItemName?: string | null;
};

type ShoppingLinkItem = {
  id: string;
  name: string;
  location: string | null;
  price: number | null;
  priority?: string | null;
  type?: string | null;
  category?: string | null;
  bought: boolean;
};

const isMandadoItem = (item: ShoppingLinkItem): boolean => {
  if (item.type === 'semanal' || item.type === 'quincenal' || item.type === 'ocasional') return true;
  if (item.category === 'semanal' || item.category === 'quincenal' || item.category === 'ocasional' || item.category === 'comida' || item.category === 'insumos') return true;
  if (
    item.location?.includes('Semanal') ||
    item.location?.includes('Quincenal') ||
    item.location?.includes('Agotar') ||
    item.location?.includes('Agotamiento') ||
    item.location?.includes('Mandado') ||
    item.location?.includes('Comida') ||
    item.location?.includes('Insumos') ||
    item.location?.includes('🍔') ||
    item.location?.includes('🛒') ||
    item.location?.includes('🥗') ||
    item.location?.includes('📦')
  ) return true;
  return false;
};

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
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedShoppingLink, setSelectedShoppingLink] = useState('');
  const [shoppingItems, setShoppingItems] = useState<ShoppingLinkItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const [projRes, shopRes] = await Promise.all([
      supabase
        .from('creative_projects')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('shopping_list')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (projRes.error) toast.error('Error al cargar proyectos: ' + projRes.error.message);
    else if (projRes.data) setProjects(projRes.data.map(p => ({ ...p, tasks: p.tasks || [] })));

    if (!shopRes.error && shopRes.data) {
      setShoppingItems(shopRes.data);
    }
    setLoading(false);
  };

  const shoppingMap = useMemo(
    () => new Map(shoppingItems.map((item) => [item.id, item])),
    [shoppingItems]
  );

  const generalShoppingItems = useMemo(
    () => shoppingItems.filter((item) => !isMandadoItem(item)),
    [shoppingItems]
  );

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
    const projectToDelete = projects.find((p) => p.id === id);
    if (!projectToDelete) return;

    try {
      const { error } = await supabase.from('creative_projects').delete().eq('id', id);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      moveToTrash({
        table: 'creative_projects',
        entityLabel: 'Proyecto',
        title: projectToDelete.name,
        subtitle: projectToDelete.category || '',
        payload: { ...projectToDelete },
      });
      
      toast.undoable('Proyecto movido a Papelera', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = projectToDelete as any;
          const { error: restoreErr } = await supabase.from('creative_projects').insert([{
            id: projectToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchProjects();
          toast.success('Proyecto restaurado ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar proyecto: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('creative_projects').update({ status }).eq('id', id);
    setProjects(projects.map(p => p.id === id ? { ...p, status } : p));
  };

  const addTask = async (project: Project) => {
    const trimmedText = newTaskText.trim();
    const linkedExisting =
      selectedShoppingLink && selectedShoppingLink !== '__create_new__'
        ? shoppingMap.get(selectedShoppingLink)
        : undefined;

    if (selectedShoppingLink === '__create_new__' && !trimmedText) {
      toast.error('Escribe qué deseas comprar para crearlo en Compras');
      return;
    }

    if (!trimmedText && !linkedExisting) return;

    let shoppingItemId: string | null = linkedExisting ? linkedExisting.id : null;
    let shoppingItemName: string | null = linkedExisting ? linkedExisting.name : null;
    let taskDone = linkedExisting ? Boolean(linkedExisting.bought) : false;
    let taskText = trimmedText || (linkedExisting ? `Comprar: ${linkedExisting.name}` : '');

    try {
      if (selectedShoppingLink === '__create_new__') {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          toast.error('Sesión no iniciada');
          return;
        }

        const itemName = trimmedText.replace(/^comprar[:\s]+/i, '').trim() || trimmedText;
        const { data: createdRows, error: createErr } = await supabase
          .from('shopping_list')
          .insert([
            {
              user_id: user.id,
              name: itemName,
              location: `Proyecto: ${project.name}`,
              price: null,
              priority: 'Media',
              bought: false,
            },
          ])
          .select();

        if (createErr) throw createErr;

        if (createdRows && createdRows[0]) {
          const created = createdRows[0] as ShoppingLinkItem;
          shoppingItemId = created.id;
          shoppingItemName = created.name;
          taskText = /^comprar\b/i.test(trimmedText) ? trimmedText : `Comprar: ${created.name}`;
          setShoppingItems((prev) => [created, ...prev]);
          invalidateCache('dashboard');
          invalidateCache('search_global');
          toast.success(`"${created.name}" añadido a Compras y vinculado`);
        }
      }

      const newTask: Task = {
        id: Date.now().toString(),
        text: taskText,
        done: taskDone,
        shoppingItemId,
        shoppingItemName,
      };
      const updatedTasks = [...project.tasks, newTask];
      const { error } = await supabase
        .from('creative_projects')
        .update({ tasks: updatedTasks })
        .eq('id', project.id);
      if (error) throw error;

      setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));
      setNewTaskText('');
      setSelectedShoppingLink('');
    } catch (err: any) {
      toast.error('Error al agregar sub-tarea: ' + err.message);
    }
  };

  const toggleTask = async (project: Project, taskId: string) => {
    const targetTask = project.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const linkedItem = targetTask.shoppingItemId ? shoppingMap.get(targetTask.shoppingItemId) : undefined;
    const currentDone = linkedItem ? Boolean(linkedItem.bought) : targetTask.done;
    const nextDone = !currentDone;

    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, done: nextDone } : t);
    setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));

    try {
      const { error } = await supabase
        .from('creative_projects')
        .update({ tasks: updatedTasks })
        .eq('id', project.id);
      if (error) throw error;

      if (targetTask.shoppingItemId) {
        const { error: shopErr } = await supabase
          .from('shopping_list')
          .update({ bought: nextDone })
          .eq('id', targetTask.shoppingItemId);

        if (!shopErr) {
          setShoppingItems((prev) =>
            prev.map((item) =>
              item.id === targetTask.shoppingItemId ? { ...item, bought: nextDone } : item
            )
          );
          invalidateCache('dashboard');
          invalidateCache('search_global');
          toast.info(
            nextDone
              ? `🛒 "${linkedItem?.name || targetTask.shoppingItemName}" marcado como comprado`
              : `🛒 "${linkedItem?.name || targetTask.shoppingItemName}" marcado por comprar`
          );
        }
      }
    } catch (err: any) {
      toast.error('Error al actualizar sub-tarea: ' + err.message);
      fetchProjects();
    }
  };

  const deleteTask = async (project: Project, taskId: string) => {
    const originalTasks = [...project.tasks];
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    
    try {
      await supabase.from('creative_projects').update({ tasks: updatedTasks }).eq('id', project.id);
      setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: updatedTasks } : p));
      
      toast.undoable('Tarea de proyecto eliminada', async () => {
        await supabase.from('creative_projects').update({ tasks: originalTasks }).eq('id', project.id);
        setProjects(projects.map(p => p.id === project.id ? { ...p, tasks: originalTasks } : p));
        toast.success('Tarea de proyecto restaurada ↩️');
      });
    } catch (err: any) {
      toast.error('Error al eliminar tarea: ' + err.message);
    }
  };

  const filtered = projects.filter(p => 
    (filterStatus === 'all' || p.status === filterStatus) &&
    (filterCategory === 'all' || p.category === filterCategory) &&
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
    <div className="space-y-5 sm:space-y-8 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
            Proyectos <span className="text-gradient">Creativos</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Tu espacio personal para gestionar proyectos, sub-tareas y compras vinculadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:w-60">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={openAddForm}
            className="px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nuevo Proyecto</span>
          </motion.button>
        </div>
      </header>

      {/* Filters (Status & Category) */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">Estado:</span>
          {[
            { key: 'all', label: 'Todos' },
            ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({ key, label: val.label }))
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === key
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category / Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">Tipo:</span>
          {['all', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {showForm && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
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

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
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

                  <RichTextEditor
                    label="Descripción (Soporta Markdown)"
                    value={form.description}
                    onChange={(val) => setForm({ ...form, description: val })}
                    placeholder="¿De qué trata este proyecto? (Puedes usar saltos de línea, viñetas y títulos)"
                    minHeight="180px"
                    rows={8}
                  />
                </div>

                {/* Sticky Footer Actions */}
                <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                    {submitting ? 'Guardando...' : (editingProject ? 'Actualizar' : 'Crear Proyecto')}
                  </button>
                </div>
              </form>
            </motion.div>
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
              const isTaskDone = (t: Task) =>
                t.shoppingItemId && shoppingMap.has(t.shoppingItemId)
                  ? Boolean(shoppingMap.get(t.shoppingItemId)!.bought)
                  : t.done;
              const doneTasks = project.tasks.filter(isTaskDone).length;
              const totalTasks = project.tasks.length;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.09] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative"
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
                        <button onClick={() => deleteProject(project.id)} className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0">
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
                          <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">Progreso ({Math.round((doneTasks / totalTasks) * 100)}%)</span>
                          <span className="font-dm-sans text-xs font-bold text-gray-600 dark:text-gray-300">{doneTasks}/{totalTasks} Tareas</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-gray-700/50">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${(doneTasks / totalTasks) * 100}%` }}
                            className="h-full bg-gradient-to-r from-[var(--vibrant-sky-blue)] to-[var(--electric-blue)] rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Tasks */}
                  <div className="border-t border-gray-200/70 dark:border-white/[0.08] mt-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : project.id);
                        setNewTaskText('');
                        setSelectedShoppingLink('');
                      }}
                      className="w-full px-2 min-h-[42px] py-2 flex items-center justify-between text-xs font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      <span>Sub-tareas ({totalTasks})</span>
                      {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-visible"
                        >
                          <div className="pb-2 pt-1 space-y-2.5">
                            {project.tasks.map((task) => {
                              const linkedItem = task.shoppingItemId
                                ? shoppingMap.get(task.shoppingItemId)
                                : undefined;
                              const done = isTaskDone(task);
                              const shopName = linkedItem?.name || task.shoppingItemName;

                              return (
                                <div key={task.id} className="flex items-start gap-2.5 group/task">
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(project, task.id)}
                                    className="shrink-0 mt-0.5 cursor-pointer"
                                    title={done ? 'Marcar pendiente' : 'Marcar completada'}
                                  >
                                    {done
                                      ? <HiOutlineCheckCircle className="text-emerald-500 text-lg" />
                                      : <HiOutlineDotsCircleHorizontal className="text-gray-400 dark:text-gray-500 text-lg hover:text-[var(--vibrant-sky-blue)]" />
                                    }
                                  </button>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <span className={`font-inter text-sm block break-words ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                      {task.text}
                                    </span>

                                    {task.shoppingItemId && shopName && (
                                      <Link
                                        to={`/admin/panel/compras?search=${encodeURIComponent(shopName)}`}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-syne font-bold uppercase tracking-wider border transition-all ${
                                          done
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25'
                                            : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/20'
                                        }`}
                                        title="Ver ítem en Lista de Compras"
                                      >
                                        <HiOutlineShoppingBag className="text-xs shrink-0" />
                                        <span className="truncate max-w-[170px]">{shopName}</span>
                                        {linkedItem?.price ? (
                                          <span className="opacity-75">· ${linkedItem.price.toLocaleString()}</span>
                                        ) : null}
                                      </Link>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => deleteTask(project, task.id)}
                                    className="p-1.5 text-red-500/70 hover:text-red-500 lg:opacity-0 lg:group-hover/task:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer shrink-0"
                                    title="Eliminar sub-tarea"
                                  >
                                    <HiX className="text-xs" />
                                  </button>
                                </div>
                              );
                            })}

                            <div className="pt-2 space-y-2 border-t border-gray-100 dark:border-white/[0.06]">
                              <div className="flex gap-2">
                                <input
                                  placeholder={
                                    selectedShoppingLink === '__create_new__'
                                      ? 'Artículo a comprar (ej. Cuerdas Elixir)...'
                                      : 'Nueva sub-tarea o compra...'
                                  }
                                  value={expandedId === project.id ? newTaskText : ''}
                                  onChange={e => setNewTaskText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addTask(project);
                                    }
                                  }}
                                  className="flex-1 min-w-0 px-3.5 min-h-[42px] py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-white/10 rounded-xl text-sm outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => addTask(project)}
                                  className="min-w-[42px] min-h-[42px] p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                                  title="Agregar sub-tarea"
                                >
                                  <HiOutlinePlus className="text-base" />
                                </button>
                              </div>

                              <CustomSelect
                                value={expandedId === project.id ? selectedShoppingLink : ''}
                                onChange={(val) => setSelectedShoppingLink(val)}
                                options={[
                                  { value: '', label: 'Sin vincular a Compras' },
                                  { value: '__create_new__', label: '➕ Crear en Compras y vincular' },
                                  ...generalShoppingItems.map((item) => ({
                                    value: item.id,
                                    label: `🛒 ${item.name}${item.price ? ` ($${item.price.toLocaleString()})` : ''}${item.bought ? ' · Comprado' : ''}`,
                                  })),
                                ]}
                              />
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
