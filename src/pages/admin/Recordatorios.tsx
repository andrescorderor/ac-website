import { useState, useEffect } from 'react';
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
  HiOutlineCalendar,
  HiOutlineViewList,
  HiChevronLeft,
  HiChevronRight
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '', date: '', time: '', category: 'Otro' as const, recurring: false, notes: ''
  });
  const { toast } = useToast();

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

  const handleAdd = async (e: React.FormEvent) => {
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

      let { error } = await supabase.from('reminders').insert([payload]);

      if (error && (error.message.includes('reminders_category_check') || error.code === '23514')) {
        payload.category = payload.category.toLowerCase();
        const retry = await supabase.from('reminders').insert([payload]);
        error = retry.error;
      }

      if (error) throw error;

      toast.success('Fecha importante registrada');
      setNewReminder({ title: '', date: '', time: '', category: 'Otro', recurring: false, notes: '' });
      setShowAddForm(false);
      fetchReminders();
    } catch (err: any) {
      console.error('Error al registrar recordatorio:', err);
      toast.error(err.message || 'Error al guardar el recordatorio');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      toast.success('Recordatorio eliminado');
      fetchReminders();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const insertBullet = () => {
    setNewReminder(prev => ({ ...prev, notes: prev.notes + (prev.notes ? '\n• ' : '• ') }));
  };

  const filtered = reminders.filter(r => {
    const matchesCat = filterCat === 'all' || r.category === filterCat;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesCat && matchesSearch;
  });

  const upcoming = filtered.filter(r => { const d = getDaysUntil(r.date, r.recurring); return d >= 0 && d <= 30; });
  const later = filtered.filter(r => getDaysUntil(r.date, r.recurring) > 30);
  const past = filtered.filter(r => !r.recurring && getDaysUntil(r.date, false) < 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando fechas...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Fechas <span className="text-gradient">Importantes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Cumpleaños, pagos, vencimiento de documentos y eventos clave.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl font-syne text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
              title="Vista en Lista"
            >
              <HiOutlineViewList className="text-lg" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2.5 rounded-xl font-syne text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
              title="Vista en Calendario"
            >
              <HiOutlineCalendar className="text-lg" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2 interactive-hover"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Nueva Fecha</span>
          </button>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'Cumpleaños', 'Documento', 'Pago', 'Otro'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterCat === cat 
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAdd}
            className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)] dark:text-white">Registrar Nueva Fecha Importante</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cumpleaños de Mamá, Renovación de Licencia..."
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={newReminder.date}
                  onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100"
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

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400 mb-2">
                  Categoría
                </label>
                <select
                  value={newReminder.category}
                  onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value as any })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="Cumpleaños" className="dark:bg-gray-800">Cumpleaños 🎂</option>
                  <option value="Documento" className="dark:bg-gray-800">Documento 📄</option>
                  <option value="Pago" className="dark:bg-gray-800">Pago 💳</option>
                  <option value="Otro" className="dark:bg-gray-800">Otro 📌</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] dark:text-gray-400">
                    Notas / Párrafo Descriptivo (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={insertBullet}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-syne font-bold transition-all"
                  >
                    + Agregar Viñeta (•)
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Añade párrafos descriptivos, notas o detalles extra... (Puedes usar saltos de línea y viñetas)"
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-500 font-inter text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 interactive-hover"
              >
                {submitting ? (
                  <>
                    <div className="size-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Fecha</span>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main View: Calendar or List */}
      {viewMode === 'calendar' ? (
        <CalendarView
          reminders={filtered}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          onDelete={deleteReminder}
        />
      ) : (
        /* Sections: Próximos (Next 30 days), Futuros, Pasados */
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
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">No hay fechas registradas</p>
              <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
                Agrega eventos importantes para estar siempre al día.
              </p>
            </div>
          )}
        </div>
      )}
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
      className="p-6 bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] shadow-sm flex flex-col justify-between gap-4 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
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
              className={`p-1.5 rounded-xl transition-all ${
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
              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
              title="Eliminar fecha"
            >
              <HiOutlineTrash className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {r.notes && (
        <div className="font-inter text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed whitespace-pre-wrap pt-3 border-t border-gray-100 dark:border-gray-800/50">
          {r.notes}
        </div>
      )}
    </motion.div>
  );
}

function CalendarView({
  reminders,
  currentMonth,
  setCurrentMonth,
  onDelete,
}: {
  reminders: Reminder[];
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  onDelete: (id: string) => void;
}) {
  const [selectedDayReminders, setSelectedDayReminders] = useState<{ dayNum: number; items: Reminder[] } | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDayReminders(null);
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDayReminders(null);
  };

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  // Map reminders to days in current Month
  const daysGrid = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayReminders = reminders.filter((r) => {
      if (!r.date) return false;
      const occDate = getNextOccurrenceDate(r.date, r.recurring);
      return occDate.getFullYear() === year && occDate.getMonth() === month && occDate.getDate() === dayNum;
    });
    return { dayNum, items: dayReminders };
  });

  const today = new Date();
  const isCurrentMonthReal = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass rounded-[2rem] p-6 md:p-8 shadow-xl space-y-6">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-dm-sans text-xl font-bold capitalize text-black dark:text-white flex items-center gap-3">
          <HiOutlineCalendar className="text-2xl text-[#FF2E93]" />
          <span>{monthName}</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all"
            title="Mes Anterior"
          >
            <HiChevronLeft className="text-xl" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDayReminders(null);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-syne font-bold uppercase text-gray-700 dark:text-gray-300 transition-all"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all"
            title="Siguiente Mes"
          >
            <HiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for starting day offset */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-24 md:h-28 rounded-2xl bg-gray-50/40 dark:bg-gray-800/20 border border-transparent" />
        ))}

        {/* Month Day Cells */}
        {daysGrid.map(({ dayNum, items }) => {
          const isToday = isCurrentMonthReal && today.getDate() === dayNum;
          const isSelected = selectedDayReminders?.dayNum === dayNum;

          return (
            <motion.div
              key={dayNum}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => items.length > 0 && setSelectedDayReminders({ dayNum, items })}
              className={`h-24 md:h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none overflow-hidden ${
                isToday
                  ? 'border-[var(--vibrant-sky-blue)] bg-[var(--vibrant-sky-blue-light)]/50 dark:bg-[var(--vibrant-sky-blue)]/20 shadow-sm'
                  : isSelected
                  ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800'
                  : 'border-transparent bg-white/50 dark:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`size-6 rounded-full flex items-center justify-center font-syne text-xs font-bold ${
                    isToday
                      ? 'bg-[var(--vibrant-sky-blue)] text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {dayNum}
                </span>

                {items.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 font-syne text-[9px] font-bold">
                    {items.length}
                  </span>
                )}
              </div>

              {/* Event indicators/badges inside day cell */}
              <div className="space-y-1 overflow-hidden">
                {items.slice(0, 2).map((item) => {
                  const cfg = categoryConfig[item.category] || categoryConfig['Otro'];
                  return (
                    <div
                      key={item.id}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-inter font-medium truncate flex items-center gap-1 ${cfg.badge}`}
                    >
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })}
                {items.length > 2 && (
                  <div className="text-[9px] font-syne font-bold text-gray-400 dark:text-gray-500 px-1">
                    +{items.length - 2} más
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Day Reminders Drawer/Modal */}
      {selectedDayReminders && (
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-dm-sans text-base font-bold text-black dark:text-white flex items-center gap-2">
              <span>Eventos para el día {selectedDayReminders.dayNum} de {monthName}</span>
            </h4>
            <button
              onClick={() => setSelectedDayReminders(null)}
              className="text-xs font-syne font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Cerrar ✖
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDayReminders.items.map((r) => (
              <ReminderCard key={r.id} r={r} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
