import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineEye,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  emoji: string;
  sort_order: number;
  active: boolean;
};

type ChecklistLog = {
  id: string;
  item_id: string;
  month_year: string;
  completed: boolean;
  completed_at: string | null;
};

const CATEGORIES = ['General', 'Pagos', 'Hogar', 'Trabajo', 'Salud', 'Rutinas'];
const CATEGORY_COLORS: Record<string, string> = {
  General:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  Pagos:    'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300',
  Hogar:    'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300',
  Trabajo:  'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',
  Salud:    'bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300',
  Rutinas:  'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
};
const EMOJIS = ['✅', '💳', '🏠', '🧹', '💊', '📞', '🌐', '⚡', '💧', '🍱', '🏋️', '📚', '🎯', '💰', '🔧'];

const toMonthYear = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const formatMonthLabel = (my: string) => {
  const [year, month] = my.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
};

const EMPTY_FORM = { title: '', category: 'General', emoji: '✅' };

export default function ChecklistMensual() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [logs, setLogs] = useState<ChecklistLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMonth, setViewingMonth] = useState(toMonthYear(new Date()));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const currentMonthYear = toMonthYear(new Date());
  const isCurrentMonth = viewingMonth === currentMonthYear;

  useEffect(() => { fetchData(); }, [viewingMonth]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [itemsRes, logsRes] = await Promise.all([
      supabase.from('monthly_checklist_items').select('*').eq('active', true).order('sort_order'),
      supabase.from('monthly_checklist_logs').select('*').eq('month_year', viewingMonth).eq('user_id', user.id),
    ]);

    if (itemsRes.error) toast.error('Error al cargar checklist: ' + itemsRes.error.message);
    else setItems(itemsRes.data || []);

    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
  };

  const getLog = (itemId: string) => logs.find(l => l.item_id === itemId);
  const isCompleted = (itemId: string) => !!getLog(itemId)?.completed;

  const toggleComplete = async (item: ChecklistItem) => {
    if (!isCurrentMonth) { toast.info('Solo puedes editar el mes actual'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = getLog(item.id);
    if (existing) {
      const newVal = !existing.completed;
      const { error } = await supabase
        .from('monthly_checklist_logs')
        .update({ completed: newVal, completed_at: newVal ? new Date().toISOString() : null })
        .eq('id', existing.id);
      if (!error) setLogs(logs.map(l => l.id === existing.id ? { ...l, completed: newVal, completed_at: newVal ? new Date().toISOString() : null } : l));
    } else {
      const { data, error } = await supabase
        .from('monthly_checklist_logs')
        .insert([{ item_id: item.id, user_id: user.id, month_year: viewingMonth, completed: true, completed_at: new Date().toISOString() }])
        .select();
      if (!error && data) setLogs([...logs, data[0]]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('monthly_checklist_items')
          .update({ title: form.title, category: form.category, emoji: form.emoji })
          .eq('id', editingItem.id);
        if (error) throw error;
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...form } : i));
        toast.success('Ítem actualizado');
      } else {
        const { data, error } = await supabase
          .from('monthly_checklist_items')
          .insert([{ user_id: user.id, title: form.title, category: form.category, emoji: form.emoji, sort_order: items.length }])
          .select();
        if (error) throw error;
        if (data) setItems([...items, data[0]]);
        toast.success('Ítem añadido al checklist');
      }
      setShowAddForm(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('monthly_checklist_items').update({ active: false }).eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setItems(items.filter(i => i.id !== id));
    toast.success('Ítem eliminado del checklist');
  };

  const openEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setForm({ title: item.title, category: item.category, emoji: item.emoji });
    setShowAddForm(true);
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = viewingMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + direction, 1);
    setViewingMonth(toMonthYear(d));
  };

  const completedCount = items.filter(i => isCompleted(i.id)).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const grouped = CATEGORIES
    .map(cat => ({ cat, catItems: items.filter(i => i.category === cat) }))
    .filter(g => g.catItems.length > 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando checklist...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
            Checklist <span className="text-gradient">Mensual</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Tus pendientes y pagos recurrentes del mes. Se reinicia automáticamente cada mes.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingItem(null); setForm(EMPTY_FORM); setShowAddForm(true); }}
          className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg flex items-center gap-2 shrink-0"
        >
          <HiOutlinePlus className="text-lg" />
          Añadir Ítem
        </motion.button>
      </header>

      {/* Month Navigation */}
      <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateMonth(-1)} className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all interactive-hover">
              <HiChevronLeft />
            </button>
            <div className="text-center">
              <h2 className="font-dm-sans text-xl font-bold text-black dark:text-white capitalize">
                {formatMonthLabel(viewingMonth)}
              </h2>
              {!isCurrentMonth && (
                <button onClick={() => setViewingMonth(currentMonthYear)} className="font-syne text-[9px] font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)] hover:underline">
                  Volver al mes actual
                </button>
              )}
            </div>
            <button onClick={() => navigateMonth(1)} className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all interactive-hover">
              <HiChevronRight />
            </button>
          </div>
          <div className="text-right">
            <p className="font-dm-sans text-2xl font-bold text-black dark:text-white">{completedCount}<span className="text-gray-400 font-normal">/{totalCount}</span></p>
            <p className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400">completados</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-[var(--vibrant-sky-blue)]'}`}
            />
          </div>
          {progressPct === 100 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-syne text-xs font-bold text-emerald-500 text-center">
              🎉 ¡Mes completado!
            </motion.p>
          )}
        </div>

        {!isCurrentMonth && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
            <HiOutlineEye className="text-amber-500 shrink-0" />
            <p className="font-inter text-xs text-amber-700 dark:text-amber-300">Estás viendo un mes anterior — solo modo lectura.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 rounded-[2rem] shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-dm-sans text-lg font-bold text-black dark:text-white">
                {editingItem ? 'Editar Ítem' : 'Nuevo Ítem del Checklist'}
              </h3>
              <button onClick={() => { setShowAddForm(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                <HiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Emoji */}
              <div className="space-y-2">
                <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                      className={`size-9 text-lg rounded-xl border-2 transition-all ${form.emoji === e ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800 scale-110' : 'border-transparent hover:border-gray-200'}`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500">Título *</label>
                  <input
                    required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej. Pagar renta, Netflix, Gym..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500">Categoría</label>
                  <select
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 transition-all shadow-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowAddForm(false); setEditingItem(null); }} className="px-5 py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-7 py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 interactive-hover flex items-center gap-2">
                  {submitting ? <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {editingItem ? 'Guardar' : 'Añadir'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checklist Groups */}
      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-3">
          <div className="text-5xl">📋</div>
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-300">Tu checklist está vacío</p>
          <p className="font-inter text-sm text-gray-400">Añade los pagos y pendientes que repites cada mes.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ cat, catItems }) => (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider ${CATEGORY_COLORS[cat] || CATEGORY_COLORS['General']}`}>
                  {cat}
                </span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                <span className="font-syne text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {catItems.filter(i => isCompleted(i.id)).length}/{catItems.length}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {catItems.map(item => {
                    const done = isCompleted(item.id);
                    const log = getLog(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                          done
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30'
                            : 'bg-white dark:bg-gray-900/80 border-gray-100/50 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}
                      >
                        <button
                          onClick={() => toggleComplete(item)}
                          className={`size-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            done
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300 dark:border-gray-600 hover:border-[var(--vibrant-sky-blue)]'
                          }`}
                        >
                          {done && <HiOutlineCheck className="text-white text-sm" />}
                        </button>

                        <span className="text-xl shrink-0">{item.emoji}</span>

                        <div className="flex-1 min-w-0">
                          <p className={`font-inter text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                            {item.title}
                          </p>
                          {done && log?.completed_at && (
                            <p className="font-inter text-[10px] text-emerald-500 dark:text-emerald-400">
                              Completado el {new Date(log.completed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>

                        {isCurrentMonth && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                              <HiOutlinePencil className="text-sm" />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                              <HiOutlineTrash className="text-sm" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset hint */}
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
        <HiOutlineRefresh className="shrink-0" />
        <p className="font-inter text-xs">El checklist se reinicia automáticamente al comenzar cada nuevo mes.</p>
      </div>
    </div>
  );
}
