import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineCake,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineDotsCircleHorizontal,
  HiOutlineSearch,
  HiX
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { moveToTrash } from '@/lib/trash';
import { invalidateCache } from '@/lib/cache';
import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import RichTextEditor from '@/components/common/RichTextEditor';

type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  category: 'Cumpleaños' | 'Documento' | 'Pago' | 'Otro';
  recurring: boolean;
  notes: string | null;
};

const categoryConfig: Record<string, { icon: any; color: string; badge: string }> = {
  'Cumpleaños': { icon: HiOutlineCake, color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-500', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300' },
  'cumpleaños': { icon: HiOutlineCake, color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-500', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300' },
  'Cumpleanos': { icon: HiOutlineCake, color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-500', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300' },
  'cumpleanos': { icon: HiOutlineCake, color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-500', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300' },
  'Documento': { icon: HiOutlineDocumentText, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300' },
  'documento': { icon: HiOutlineDocumentText, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300' },
  'Pago': { icon: HiOutlineCreditCard, color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300' },
  'pago': { icon: HiOutlineCreditCard, color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300' },
  'Otro': { icon: HiOutlineDotsCircleHorizontal, color: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
  'otro': { icon: HiOutlineDotsCircleHorizontal, color: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
};

function getNextOccurrenceDate(dateStr: string, recurring: boolean): Date {
  if (!dateStr) return new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const eventDate = new Date(year, month, day);

  if (!recurring) return eventDate;

  // For recurring annual events, calculate the next occurrence date in the current or next year
  let nextDate = new Date(today.getFullYear(), month, day);
  if (nextDate < today) {
    nextDate = new Date(today.getFullYear() + 1, month, day);
  }
  return nextDate;
}

function getDaysUntil(dateStr: string, recurring: boolean = false): number {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = getNextOccurrenceDate(dateStr, recurring);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string, timeStr?: string | null, recurring: boolean = false): string {
  if (!dateStr) return 'Sin fecha';
  const target = getNextOccurrenceDate(dateStr, recurring);
  const formattedDate = target.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  if (timeStr) {
    return `${formattedDate} • ${timeStr} hrs`;
  }
  return formattedDate;
}

export default function Recordatorios() {
  const [searchParams] = useSearchParams();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState({
    title: '', date: '', time: '', category: 'Otro' as const, recurring: false, notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*');
    
    if (error) {
      toast.error('Error al cargar fechas importantes: ' + error.message);
    } else if (data) {
      const normalized = data.map((r: any) => ({
        ...r,
        date: r.date || r.event_date || (r.created_at ? r.created_at.split('T')[0] : ''),
      }));
      normalized.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setReminders(normalized);
    }
    setLoading(false);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sesión no válida');
      return;
    }
    if (!newReminder.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!newReminder.date) {
      toast.error('Selecciona una fecha');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        user_id: user.id,
        title: newReminder.title.trim(),
        date: newReminder.date,
        event_date: newReminder.date,
        time: newReminder.time || null,
        category: newReminder.category,
        recurring: newReminder.recurring,
        notes: newReminder.notes?.trim() || null,
      };

      let error;
      if (editingId) {
        ({ error } = await supabase.from('reminders').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('reminders').insert([payload]));
      }

      if (error) throw error;

      toast.success(editingId ? 'Fecha actualizada' : 'Fecha importante registrada');
      invalidateCache('dashboard');
      invalidateCache('calendario_360_data');
      invalidateCache('search_global_dataset');
      setNewReminder({ title: '', date: '', time: '', category: 'Otro', recurring: false, notes: '' });
      setEditingId(null);
      setShowAddForm(false);
      fetchReminders();
    } catch (err: any) {
      console.error('Error al guardar recordatorio:', err);
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    const reminderToDelete = reminders.find((r) => r.id === id);
    if (!reminderToDelete) return;

    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      setReminders((prev) => prev.filter((r) => r.id !== id));
      invalidateCache('dashboard');
      invalidateCache('calendario_360_data');
      invalidateCache('search_global_dataset');
      moveToTrash({
        table: 'reminders',
        entityLabel: 'Fecha',
        title: reminderToDelete.title,
        subtitle: reminderToDelete.date || (reminderToDelete as any).event_date || '',
        payload: { ...reminderToDelete },
      });
      
      toast.undoable('Fecha importante movida a Papelera', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = reminderToDelete as any;
          const { error: restoreErr } = await supabase.from('reminders').insert([{
            id: reminderToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          invalidateCache('dashboard');
          invalidateCache('calendario_360_data');
          invalidateCache('search_global_dataset');
          fetchReminders();
          toast.success('Fecha importante restaurada ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar fecha: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const normalize = (s: string | null | undefined) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normSearch = normalize(searchTerm.trim());
  const filtered = reminders.filter(r => {
    const matchesCat = filterCat === 'all' || r.category === filterCat;
    const matchesSearch =
      !normSearch ||
      normalize(r.title).includes(normSearch) ||
      normalize(r.notes).includes(normSearch);
    return matchesCat && matchesSearch;
  });

  const upcoming = filtered.filter(r => { const d = getDaysUntil(r.date, r.recurring); return d >= 0 && d <= 30; });
  const later = filtered.filter(r => getDaysUntil(r.date, r.recurring) > 30);
  const past = filtered.filter(r => !r.recurring && getDaysUntil(r.date, false) < 0);

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
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-44 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex-1">
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Fechas <span className="text-gradient">Importantes</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Cumpleaños, pagos, vencimiento de documentos y eventos clave.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:w-60">
            <input 
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm shadow-xs transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>

          <button 
            type="button"
            onClick={() => { setEditingId(null); setNewReminder({ title: '', date: '', time: '', category: 'Otro', recurring: false, notes: '' }); setShowAddForm(true); }}
            className="px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nueva Fecha</span>
          </button>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'Cumpleaños', 'Documento', 'Pago', 'Otro'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-4 min-h-[40px] py-2 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              filterCat === cat 
                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-sm' 
                : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Add / Edit Modal */}
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
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Editar Fecha Importante' : 'Agregar Fecha Importante'}
                  </h2>
                  <p className="font-inter text-xs text-gray-400">Registra cumpleaños, pagos, vencimientos o eventos clave.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Título del Evento *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Cumpleaños de Mamá, Pagar Tarjeta..."
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Categoría
                      </label>
                      <CustomSelect
                        value={newReminder.category}
                        onChange={(val) => setNewReminder({ ...newReminder, category: val as any })}
                        options={[
                          { value: 'Cumpleaños', label: '🎂 Cumpleaños' },
                          { value: 'Documento', label: '📄 Documento' },
                          { value: 'Pago', label: '💳 Pago' },
                          { value: 'Otro', label: '📌 Otro' },
                        ]}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Fecha *
                      </label>
                      <CustomDatePicker
                        required
                        value={newReminder.date}
                        onChange={(val) => setNewReminder({ ...newReminder, date: val })}
                        placeholder="Seleccionar fecha..."
                      />
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                        Hora (Opcional)
                      </label>
                      <input
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <RichTextEditor
                        label="Notas & Detalles (Opcional)"
                        value={newReminder.notes || ''}
                        onChange={(val) => setNewReminder({ ...newReminder, notes: val })}
                        placeholder="Añade párrafos descriptivos, notas o detalles extra... (Puedes usar saltos de línea, viñetas y títulos)"
                        minHeight="180px"
                        rows={8}
                      />
                    </div>

                    <div className="md:col-span-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={newReminder.recurring}
                        onChange={(e) => setNewReminder({ ...newReminder, recurring: e.target.checked })}
                        className="size-5 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800"
                      />
                      <label htmlFor="recurring" className="font-inter text-sm text-gray-700 dark:text-gray-300 select-none">
                        Evento Recurrente Anualmente (ej. cumpleaños, aniversario)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Actualizar Evento' : 'Guardar Evento'}</span>
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

      {/* Main View: Chronological List (Próximos 30 días, Futuros, Pasados) */}
      <div className="space-y-10">
        {/* Próximos (Próximos 30 días) */}
        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Próximos 30 Días
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map(r => <ReminderCard key={r.id} r={r} onDelete={deleteReminder} />)}
            </div>
          </div>
        )}

        {/* Más adelante */}
        {later.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Más Adelante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {later.map(r => <ReminderCard key={r.id} r={r} onDelete={deleteReminder} />)}
            </div>
          </div>
        )}

        {/* Pasados */}
        {past.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Fechas Pasadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              {past.map(r => <ReminderCard key={r.id} r={r} onDelete={deleteReminder} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border-none shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">No hay fechas registradas</p>
            <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
              Agrega eventos importantes para estar siempre al día.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderCard({ r, onDelete }: { r: Reminder; onDelete: (id: string) => void }) {
  const { toast } = useToast();
  const days = getDaysUntil(r.date, r.recurring);
  const cfg = categoryConfig[r.category] || categoryConfig['Otro'];
  const Icon = cfg.icon;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${cfg.color} text-xl shrink-0`}>
            <Icon />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-dm-sans font-bold text-lg text-black dark:text-white">{r.title}</h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${cfg.badge}`}>
                {r.category}
              </span>
              {r.recurring && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                  Anual 🔄
                </span>
              )}
            </div>
            <p className="font-inter text-sm text-gray-500 dark:text-gray-400 font-light">
              {formatDate(r.date, r.time, r.recurring)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`font-syne text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            days < 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : days <= 7 ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
          }`}>
            {days === 0 ? '¡Hoy!' : days < 0 ? `Hace ${Math.abs(days)}d` : `En ${days}d`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const isNowPinned = togglePinItem({
                  id: r.id,
                  type: 'reminder',
                  title: r.title,
                  subtitle: `${r.date}${r.time ? ' - ' + r.time + ' hrs' : ''}`,
                  path: '/admin/panel/recordatorios',
                });
                toast.info(isNowPinned ? 'Fecha fijada en el inicio 📌' : 'Fecha desfijada');
              }}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isItemPinned(r.id)
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
              title={isItemPinned(r.id) ? 'Desfijar del inicio' : 'Fijar en la página principal'}
            >
              {isItemPinned(r.id) ? '📌' : '📍'}
            </button>
            <button
              onClick={() => onDelete(r.id)}
              className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0 cursor-pointer"
              title="Eliminar fecha"
            >
              <HiOutlineTrash className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {r.notes && (
        <AutoFormattedText text={r.notes} className="text-sm text-gray-600 dark:text-gray-300 font-light pt-3 border-t border-gray-100 dark:border-gray-800/50" />
      )}
    </motion.div>
  );
}
