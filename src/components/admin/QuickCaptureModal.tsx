import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiOutlineCamera, HiOutlineCheckCircle } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import { invalidateCache } from '@/lib/cache';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import TicketScannerModal from '@/components/admin/TicketScannerModal';
import { loadSystemData, saveSystemData } from '@/lib/systemStore';
import {
  TaskPriority,
  SUGGESTED_AREAS,
  serializeDescriptionWithMeta,
} from '@/lib/taskMeta';

type CaptureTab = 'task' | 'expense' | 'note' | 'mandado';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const [tab, setTab] = useState<CaptureTab>('task');
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [areas, setAreas] = useState<string[]>(SUGGESTED_AREAS);

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskArea, setTaskArea] = useState('Personal');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Media');
  const [taskTag, setTaskTag] = useState('');
  const [taskDue, setTaskDue] = useState('');

  // Expense state
  const [expConcept, setExpConcept] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<'comida' | 'insumos' | 'servicios'>('comida');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [noteContent, setNoteContent] = useState('');

  // Mandado state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemStore, setItemStore] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    loadSystemData<string[]>('task_areas', []).then((stored) => {
      const merged = Array.from(new Set([...stored, ...SUGGESTED_AREAS]));
      setAreas(merged);
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Sesión no iniciada.');

      if (tab === 'task') {
        if (!taskTitle.trim()) {
          toast.error('Escribe el título de la tarea.');
          setSubmitting(false);
          return;
        }
        const cleanArea = taskArea.trim() || 'Personal';
        const cleanTags = taskTag
          .split(',')
          .map((t) => t.replace(/[|\[\],#]/g, '').trim())
          .filter(Boolean);

        const payload: Record<string, any> = {
          user_id: user.id,
          title: taskTitle.trim(),
          description: null,
          priority: taskPriority,
          area: cleanArea,
          status: 'pending',
          tags: cleanTags,
          due_date: taskDue || null,
          completed: false,
        };

        const { error } = await supabase.from('tasks').insert([payload]);
        if (error) {
          const fallback = {
            user_id: user.id,
            title: taskTitle.trim(),
            description: serializeDescriptionWithMeta('', cleanArea, 'pending', cleanTags),
            priority: taskPriority,
            due_date: taskDue || null,
            completed: false,
          };
          const res = await supabase.from('tasks').insert([fallback]);
          if (res.error) throw res.error;
        }

        if (!areas.some((a) => a.toLowerCase() === cleanArea.toLowerCase())) {
          const next = [...areas, cleanArea];
          setAreas(next);
          await saveSystemData('task_areas', next);
        }

        setTaskTitle('');
        setTaskTag('');
        setTaskDue('');
        toast.success(`Tarea guardada en "${cleanArea}"`);
      } else if (tab === 'expense') {
        const amt = parseFloat(expAmount);
        if (!expConcept.trim() || isNaN(amt) || amt <= 0) {
          toast.error('Ingresa concepto y monto válido.');
          setSubmitting(false);
          return;
        }
        const basePayload: Record<string, any> = {
          user_id: user.id,
          category: expCategory,
          concept:
            expCategory === 'servicios'
              ? `[Ocasional] ${expConcept.trim()}`
              : expConcept.trim(),
          amount: amt,
          created_at: new Date(`${expDate}T12:00:00Z`).toISOString(),
        };
        const { error } = await supabase
          .from('finance_expenses')
          .insert([{ ...basePayload, date: expDate }]);
        if (error) {
          const retry = await supabase.from('finance_expenses').insert([basePayload]);
          if (retry.error) throw retry.error;
        }
        window.dispatchEvent(new Event('ac_finance_changed'));
        setExpConcept('');
        setExpAmount('');
        toast.success(`Gasto $${amt.toLocaleString()} registrado`);
      } else if (tab === 'note') {
        if (!noteTitle.trim() || !noteContent.trim()) {
          toast.error('Título y contenido son obligatorios.');
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.from('notes').insert([
          {
            user_id: user.id,
            title: noteTitle.trim(),
            category: noteCategory.trim() || 'General',
            content: noteContent.trim(),
          },
        ]);
        if (error) throw error;
        setNoteTitle('');
        setNoteContent('');
        toast.success('Nota guardada ✨');
      } else if (tab === 'mandado') {
        if (!itemName.trim()) {
          toast.error('Escribe el nombre del producto.');
          setSubmitting(false);
          return;
        }
        const qtyPart = itemQty.trim() ? ` | Cant: ${itemQty.trim()}` : '';
        const storePart = itemStore.trim() ? ` — ${itemStore.trim()}` : '';
        const loc = `🍔 Comida | 🥗 Semanal${qtyPart}${storePart}`;

        const payload: Record<string, any> = {
          user_id: user.id,
          name: itemName.trim(),
          location: loc,
          price: itemPrice ? parseFloat(itemPrice) : null,
          quantity: itemQty.trim() || null,
          type: 'semanal',
          category: 'comida',
          priority: 'Media',
          bought: false,
        };
        const { error } = await supabase.from('shopping_list').insert([payload]);
        if (error) {
          delete payload.quantity;
          delete payload.type;
          delete payload.category;
          const retry = await supabase.from('shopping_list').insert([payload]);
          if (retry.error) throw retry.error;
        }
        setItemName('');
        setItemPrice('');
        setItemQty('');
        setItemStore('');
        toast.success('Producto agregado al Mandado 🥗');
      }

      invalidateCache('dashboard');
      invalidateCache('search_global');
      invalidateCache('calendario_360');
      onClose();
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 18 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-xl w-full border-none shadow-2xl cursor-default overflow-hidden"
              >
                {/* 1. Sticky Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        Captura Rápida
                      </h2>
                      <p className="font-inter text-xs text-gray-400">
                        Registra al instante sin salir de tu pantalla actual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-center"
                    >
                      <HiX className="text-xl" />
                    </button>
                  </div>

                  {/* Mode Switcher */}
                  <div className="grid grid-cols-4 gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                    {[
                      { id: 'task', label: 'Tarea' },
                      { id: 'expense', label: 'Gasto' },
                      { id: 'note', label: 'Nota' },
                      { id: 'mandado', label: 'Mandado' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id as CaptureTab)}
                        className={`min-h-[38px] rounded-xl font-syne text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          tab === t.id
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                    {tab === 'task' && (
                      <>
                        <div>
                          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                            Título de la Tarea *
                          </label>
                          <input
                            type="text"
                            autoFocus
                            required
                            placeholder="Ej. Mandar cotización o pagar tarjeta"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Área
                            </label>
                            <CustomSelect
                              value={taskArea}
                              onChange={setTaskArea}
                              options={areas.map((a) => ({ value: a, label: a }))}
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Prioridad
                            </label>
                            <CustomSelect
                              value={taskPriority}
                              onChange={(v) => setTaskPriority(v as TaskPriority)}
                              options={[
                                { value: 'Urgente', label: '🔴 Urgente' },
                                { value: 'Alta', label: '🟠 Alta' },
                                { value: 'Media', label: '🔵 Media' },
                                { value: 'Baja', label: '⚪ Baja' },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Etiqueta(s) (opcional, coma)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Rápido, Seguimiento"
                              value={taskTag}
                              onChange={(e) => setTaskTag(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Fecha Límite
                            </label>
                            <CustomDatePicker
                              value={taskDue}
                              onChange={setTaskDue}
                              placeholder="Opcional..."
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {tab === 'expense' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setShowScanner(true);
                          }}
                          className="w-full min-h-[44px] py-2.5 px-4 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 rounded-xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <HiOutlineCamera className="text-base" />
                          <span>Escanear Ticket con Cámara (IA)</span>
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Concepto *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Café, Uber, Súper"
                              value={expConcept}
                              onChange={(e) => setExpConcept(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Monto ($) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="0.00"
                              value={expAmount}
                              onChange={(e) => setExpAmount(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-dm-sans font-bold text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Categoría
                            </label>
                            <CustomSelect
                              value={expCategory}
                              onChange={(v) => setExpCategory(v as any)}
                              options={[
                                { value: 'comida', label: '🍔 Comida' },
                                { value: 'insumos', label: '🛒 Insumos' },
                                { value: 'servicios', label: '⚡ Servicios' },
                              ]}
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Fecha
                            </label>
                            <CustomDatePicker value={expDate} onChange={setExpDate} />
                          </div>
                        </div>
                      </>
                    )}

                    {tab === 'note' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Título *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Título de la nota..."
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Categoría
                            </label>
                            <input
                              type="text"
                              value={noteCategory}
                              onChange={(e) => setNoteCategory(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                            Contenido *
                          </label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Escribe tu apunte o pega un link..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full p-4 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[120px]"
                          />
                        </div>
                      </>
                    )}

                    {tab === 'mandado' && (
                      <>
                        <div>
                          <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                            Producto *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Pechuga de pollo, Claras..."
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Cantidad / Unidad
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. 1 kg"
                              value={itemQty}
                              onChange={(e) => setItemQty(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Último Precio ($)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="0"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                              Tienda
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Walmart"
                              value={itemStore}
                              onChange={(e) => setItemStore(e.target.value)}
                              className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 3. Sticky Footer */}
                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-7 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <HiOutlineCheckCircle className="text-base" />
                      <span>{submitting ? 'Guardando...' : 'Guardar Rápido'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <TicketScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}
