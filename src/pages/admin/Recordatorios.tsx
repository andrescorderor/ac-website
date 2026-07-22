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
  HiOutlineSearch
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type Reminder = {
  id: string;
  title: string;
  date: string;
  category: 'Cumpleaños' | 'Documento' | 'Pago' | 'Otro';
  recurring: boolean;
  notes: string | null;
};

const categoryConfig = {
  'Cumpleaños': { icon: HiOutlineCake, color: 'bg-pink-50 text-pink-500', badge: 'bg-pink-100 text-pink-600' },
  'Documento': { icon: HiOutlineDocumentText, color: 'bg-blue-50 text-blue-500', badge: 'bg-blue-100 text-blue-600' },
  'Pago': { icon: HiOutlineCreditCard, color: 'bg-orange-50 text-orange-500', badge: 'bg-orange-100 text-orange-600' },
  'Otro': { icon: HiOutlineDotsCircleHorizontal, color: 'bg-gray-50 text-gray-500', badge: 'bg-gray-100 text-gray-600' },
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Recordatorios() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '', date: '', category: 'Otro' as const, recurring: false, notes: ''
  });
  const { toast } = useToast();

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      toast.error('Error al cargar fechas importantes: ' + error.message);
    } else if (data) {
      setReminders(data);
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
      const { error } = await supabase.from('reminders').insert([{
        user_id: user.id,
        title: newReminder.title.trim(),
        date: newReminder.date,
        category: newReminder.category,
        recurring: newReminder.recurring,
        notes: newReminder.notes?.trim() || null,
      }]);

      if (error) throw error;

      toast.success('Fecha importante registrada');
      setNewReminder({ title: '', date: '', category: 'Otro', recurring: false, notes: '' });
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

  const filtered = reminders.filter(r => {
    const matchesCat = filterCat === 'all' || r.category === filterCat;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesCat && matchesSearch;
  });

  const upcoming = filtered.filter(r => { const d = getDaysUntil(r.date); return d >= 0 && d <= 30; });
  const later = filtered.filter(r => getDaysUntil(r.date) > 30);
  const past = filtered.filter(r => getDaysUntil(r.date) < 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando fechas...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)]">
            Fechas <span className="text-gradient">Importantes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light text-sm">
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
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm transition-all"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3.5 bg-black text-white font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
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
                ? 'bg-black text-white shadow-md' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
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
            className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6"
          >
            <h3 className="font-dm-sans text-xl font-bold text-[var(--black)]">Registrar Nueva Fecha Importante</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cumpleaños de Mamá, Renovación de Licencia..."
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={newReminder.date}
                  onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Categoría
                </label>
                <select
                  value={newReminder.category}
                  onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value as any })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm"
                >
                  <option value="Cumpleaños">Cumpleaños 🎂</option>
                  <option value="Documento">Documento 📄</option>
                  <option value="Pago">Pago 💳</option>
                  <option value="Otro">Otro 📌</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--gray)] mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Añade detalles o recordatorios extra..."
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:border-gray-300 font-inter text-sm resize-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newReminder.recurring}
                  onChange={(e) => setNewReminder({ ...newReminder, recurring: e.target.checked })}
                  className="size-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="recurring" className="font-inter text-sm text-gray-700 select-none">
                  Evento Recurrente Anualmente (ej. cumpleaños, aniversario)
                </label>
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
                  <span>Guardar Fecha</span>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Sections: Próximos (Next 30 days), Futuros, Pasados */}
      <div className="space-y-10">
        {/* Próximos (Próximos 30 días) */}
        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
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
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
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
            <h3 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
              Fechas Pasadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              {past.map(r => <ReminderCard key={r.id} r={r} onDelete={deleteReminder} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm space-y-3">
            <p className="font-dm-sans text-lg font-bold text-gray-700">No hay fechas registradas</p>
            <p className="font-inter text-sm text-gray-400">
              Agrega eventos importantes para estar siempre al día.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderCard({ r, onDelete }: { r: Reminder; onDelete: (id: string) => void }) {
  const days = getDaysUntil(r.date);
  const cfg = categoryConfig[r.category] || categoryConfig['Otro'];
  const Icon = cfg.icon;

  return (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-start justify-between gap-4 group hover:border-gray-200 transition-all">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${cfg.color} text-xl shrink-0`}>
          <Icon />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-dm-sans font-bold text-lg text-black">{r.title}</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-wider ${cfg.badge}`}>
              {r.category}
            </span>
          </div>
          <p className="font-inter text-sm text-gray-500 font-light">{formatDate(r.date)}</p>
          {r.notes && <p className="font-inter text-xs text-gray-400 pt-1">{r.notes}</p>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`font-syne text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          days < 0 ? 'bg-gray-100 text-gray-400' : days <= 7 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {days === 0 ? '¡Hoy!' : days < 0 ? `Hace ${Math.abs(days)}d` : `En ${days}d`}
        </span>
        <button
          onClick={() => onDelete(r.id)}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Eliminar fecha"
        >
          <HiOutlineTrash className="text-base" />
        </button>
      </div>
    </div>
  );
}
