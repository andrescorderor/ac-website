import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  HiOutlineSearch,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { useAccessibleModal } from '@/components/common/modals/Modal';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

type ChecklistItem = {
  id: string;
  title: string;
  category?: string;
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

const EMOJIS = ['✅', '💳', '🏠', '🧹', '💊', '📞', '🌐', '⚡', '💧', '🍱', '🏋️', '📚', '🎯', '💰', '🔧'];

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const toMonthYear = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const formatMonthLabel = (my: string) => {
  const [year, month] = my.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
};

const EMPTY_FORM = { title: '', emoji: '✅' };

import { useSearchParams } from 'react-router-dom';

export default function ChecklistMensual() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [logs, setLogs] = useState<ChecklistLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMonth, setViewingMonth] = useState(toMonthYear(new Date()));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  const [submitting, setSubmitting] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useAccessibleModal(
    showAddForm,
    () => {
      setShowAddForm(false);
      setEditingItem(null);
    },
    modalPanelRef
  );

  const currentMonthYear = toMonthYear(new Date());
  const isCurrentMonth = viewingMonth === currentMonthYear;
  const isPastMonth = viewingMonth < currentMonthYear;
  const isFutureMonth = viewingMonth > currentMonthYear;
  const isReadOnly = isPastMonth;

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
    if (isReadOnly) { toast.info('Los meses pasados son solo lectura'); return; }
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
          .update({ title: form.title.trim(), emoji: form.emoji })
          .eq('id', editingItem.id);
        if (error) throw error;
        setItems(items.map(i => i.id === editingItem.id ? { ...i, title: form.title.trim(), emoji: form.emoji } : i));
        toast.success('Ítem actualizado');
      } else {
        const { data, error } = await supabase
          .from('monthly_checklist_items')
          .insert([{ user_id: user.id, title: form.title.trim(), category: 'General', emoji: form.emoji, sort_order: items.length }])
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
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    const { error } = await supabase.from('monthly_checklist_items').update({ active: false }).eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setItems((prev) => prev.filter(i => i.id !== id));
    
    toast.undoable('Ítem eliminado del checklist', async () => {
      try {
        const { error: restoreErr } = await supabase.from('monthly_checklist_items').update({ active: true }).eq('id', id);
        if (restoreErr) throw restoreErr;
        setItems((prev) => [...prev, itemToDelete]);
        toast.success('Ítem del checklist restaurado ↩️');
      } catch (err: any) {
        toast.error('Error al restaurar ítem: ' + err.message);
      }
    });
  };

  const openEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setForm({ title: item.title, emoji: item.emoji });
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

  const normSearch = normalize(searchTerm.trim());
  const filteredItems = items.filter((i) => !normSearch || normalize(i.title).includes(normSearch));

  if (loading) return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-12 w-36 rounded-2xl" />
      </div>
      <div className="skeleton h-24 rounded-3xl" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
            Checklist <span className="text-gradient">Mensual</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Tus pendientes y pagos recurrentes del mes. Se reinicia automáticamente cada mes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:w-60">
            <input
              type="text"
              placeholder="Buscar en checklist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setEditingItem(null); setForm(EMPTY_FORM); setShowAddForm(true); }}
            className="px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Añadir Ítem</span>
          </motion.button>
        </div>
      </header>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/[0.09] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
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

        {isPastMonth && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
            <HiOutlineEye className="text-amber-500 shrink-0" />
            <p className="font-inter text-xs text-amber-700 dark:text-amber-300">Estás viendo un mes pasado — solo modo lectura.</p>
          </div>
        )}
        {isFutureMonth && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl">
            <HiOutlineEye className="text-blue-500 shrink-0" />
            <p className="font-inter text-xs text-blue-700 dark:text-blue-300">Estás viendo un mes futuro — puedes marcar ítems con anticipación.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {createPortal(
        <AnimatePresence>
          {showAddForm && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowAddForm(false);
                  setEditingItem(null);
                }
              }}
            >
              <motion.div
                ref={modalPanelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="checklist-modal-title"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-xl w-full border-none shadow-2xl my-8 cursor-default overflow-hidden outline-none"
              >
                {/* Sticky Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <h3 id="checklist-modal-title" className="font-dm-sans text-xl font-bold text-black dark:text-white">
                    {editingItem ? 'Editar Ítem' : 'Nuevo Ítem del Checklist'}
                  </h3>
                  <button
                    type="button"
                    aria-label="Cerrar modal"
                    onClick={() => { setShowAddForm(false); setEditingItem(null); }}
                    className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  {/* Scrollable Body */}
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                    {/* Emoji */}
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500">Ícono</label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map(e => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setForm({ ...form, emoji: e })}
                            className={`size-11 text-lg rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center ${form.emoji === e ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800 scale-105' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="checklist-title-input" className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Título *</label>
                      <input
                        id="checklist-title-input"
                        required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="Ej. Pagar renta, Netflix, Gym..."
                        className="w-full px-4 min-h-[48px] py-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-white/10 focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button type="button" onClick={() => { setShowAddForm(false); setEditingItem(null); }} className="px-6 min-h-[44px] py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={submitting} className="px-8 min-h-[44px] py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 interactive-hover flex items-center gap-2 cursor-pointer">
                      {submitting ? <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                      {editingItem ? 'Guardar' : 'Añadir'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Flat Checklist Items (No Categories) */}
      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3 bg-white dark:bg-[#111827] rounded-3xl border border-gray-200/80 dark:border-white/[0.09]">
          <div className="text-5xl">📋</div>
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-300">Tu checklist está vacío</p>
          <p className="font-inter text-sm text-gray-400">Añade los pagos y pendientes que repites cada mes.</p>
        </motion.div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 space-y-3 bg-white dark:bg-[#111827] rounded-3xl border border-gray-200/80 dark:border-white/[0.09]">
          <p className="font-dm-sans text-base font-bold text-gray-700 dark:text-gray-200">Sin coincidencias para "{searchTerm}"</p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="px-4 min-h-[40px] py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredItems.map(item => {
              const done = isCompleted(item.id);
              const log = getLog(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.action-btn')) return;
                    toggleComplete(item);
                  }}
                  className={`group flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300/60 dark:border-emerald-800/40'
                      : 'bg-white dark:bg-[#111827] border-gray-200/80 dark:border-white/[0.09] hover:border-gray-300 dark:hover:border-white/25 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    aria-label={`Marcar ${item.title} como ${done ? 'pendiente' : 'completado'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(item);
                    }}
                    className="action-btn min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl shrink-0 cursor-pointer"
                  >
                    <span
                      className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        done
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-[var(--vibrant-sky-blue)]'
                      }`}
                    >
                      {done && <HiOutlineCheck className="text-white text-sm" />}
                    </span>
                  </button>

                  <span className="text-xl shrink-0">{item.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p className={`font-inter text-sm font-medium ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {item.title}
                    </p>
                    {done && log?.completed_at && (
                      <p className="font-inter text-[11px] text-emerald-600 dark:text-emerald-400">
                        Completado el {new Date(log.completed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="action-btn flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const isNowPinned = togglePinItem({
                            id: item.id,
                            type: 'checklist',
                            title: item.title,
                            subtitle: 'Checklist mensual',
                            path: '/admin/panel/checklist',
                          });
                          toast.info(isNowPinned ? 'Ítem fijado 📌' : 'Ítem desfijado');
                          setItems([...items]);
                        }}
                        aria-label={isItemPinned(item.id) ? `Desfijar ${item.title}` : `Fijar ${item.title}`}
                        className={`min-w-[44px] min-h-[44px] p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                          isItemPinned(item.id)
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        title={isItemPinned(item.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                      >
                        📌
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Editar ${item.title}`}
                        className="min-w-[44px] min-h-[44px] p-1.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Editar ítem"
                      >
                        <HiOutlinePencil className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        aria-label={`Eliminar ${item.title}`}
                        className="min-w-[44px] min-h-[44px] p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0 cursor-pointer flex items-center justify-center"
                        title="Eliminar ítem"
                      >
                        <HiOutlineTrash className="text-sm" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
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
