import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineCake,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineDotsCircleHorizontal
} from 'react-icons/hi';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '', date: '', category: 'Otro' as const, recurring: false, notes: ''
  });

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .order('date', { ascending: true });
    if (data) setReminders(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newReminder.title || !newReminder.date) return;

    const { error } = await supabase.from('reminders').insert([{
      user_id: user.id,
      title: newReminder.title,
      date: newReminder.date,
      category: newReminder.category,
      recurring: newReminder.recurring,
      notes: newReminder.notes || null,
    }]);

    if (!error) {
      setNewReminder({ title: '', date: '', category: 'Otro', recurring: false, notes: '' });
      setShowAddForm(false);
      fetchReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (!error) fetchReminders();
  };

  const filtered = reminders.filter(r => {
    const matchesCat = filterCat === 'all' || r.category === filterCat;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesCat && matchesSearch;
  });

  // Separate upcoming (next 30 days) from the rest
  const upcoming = filtered.filter(r => { const d = getDaysUntil(r.date); return d >= 0 && d <= 30; });
  const later = filtered.filter(r => getDaysUntil(r.date) > 30);
  const past = filtered.filter(r => getDaysUntil(r.date) < 0);

  if (loading) return <div className="text-gray-400 font-syne uppercase tracking-widest text-xs">Cargando...</div>;

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const days = getDaysUntil(reminder.date);
    const config = categoryConfig[reminder.category];
    const IconComp = config.icon;
    const isToday = days === 0;
    const isSoon = days > 0 && days <= 7;

    return (
      <motion.div
        layout
        className={`group bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all duration-500 ${
          isToday ? 'border-red-200 ring-2 ring-red-100' : isSoon ? 'border-orange-100' : 'border-gray-100'
        }`}
      >
        <div className="flex justify-between items-start mb-5">
          <div className={`p-3 rounded-2xl ${config.color}`}>
            <IconComp className="text-2xl" />
          </div>
          <div className="flex items-center gap-2">
            {reminder.recurring && (
              <span className="font-syne text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-purple-50 text-purple-500 rounded-full">Anual</span>
            )}
            <span className={`font-syne text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${config.badge}`}>
              {reminder.category}
            </span>
          </div>
        </div>

        <h3 className="font-dm-sans text-xl font-bold text-black mb-1">{reminder.title}</h3>
        <p className="font-inter text-sm text-gray-500 mb-4">{formatDate(reminder.date)}</p>

        {reminder.notes && (
          <p className="font-inter text-xs text-gray-400 mb-4 leading-relaxed">{reminder.notes}</p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
          <span className={`font-dm-sans text-sm font-bold ${
            isToday ? 'text-red-500' : isSoon ? 'text-orange-500' : days < 0 ? 'text-gray-400' : 'text-black'
          }`}>
            {isToday ? '🔴 ¡Hoy!' : days === 1 ? '⚠️ Mañana' : isSoon ? `⏰ En ${days} días` : days < 0 ? `Hace ${Math.abs(days)} días` : `En ${days} días`}
          </span>
          <button
            onClick={() => deleteReminder(reminder.id)}
            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          >
            <HiOutlineTrash className="text-lg" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <h1 className="font-dm-sans text-4xl font-bold tracking-tight text-[var(--black)]">
            Fechas <span className="text-gradient">Importantes</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] font-light">
            No olvides cumpleaños, vencimientos ni pagos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-gray-100 font-inter text-sm shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-4 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <HiOutlinePlus className="text-2xl" />
          </button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'Cumpleaños', 'Documento', 'Pago', 'Otro'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
              filterCat === cat ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:text-black'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl mb-8">
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
                  <input
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="Ej: Cumpleaños de Mamá"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Fecha</label>
                  <input
                    type="date"
                    value={newReminder.date}
                    onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría</label>
                  <select
                    value={newReminder.category}
                    onChange={(e) => setNewReminder({...newReminder, category: e.target.value as any})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter appearance-none cursor-pointer"
                  >
                    <option value="Cumpleaños">🎂 Cumpleaños</option>
                    <option value="Documento">📄 Documento</option>
                    <option value="Pago">💳 Pago</option>
                    <option value="Otro">📌 Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">Notas (Opcional)</label>
                  <input
                    value={newReminder.notes}
                    onChange={(e) => setNewReminder({...newReminder, notes: e.target.value})}
                    placeholder="Detalles adicionales..."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-gray-100 font-inter"
                  />
                </div>
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newReminder.recurring}
                      onChange={(e) => setNewReminder({...newReminder, recurring: e.target.checked})}
                      className="size-5 rounded-lg accent-black cursor-pointer"
                    />
                    <span className="font-inter text-sm text-gray-600">Se repite cada año</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-syne font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                >
                  Guardar Recordatorio
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
            📅 Próximos 30 Días ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* Later Section */}
      {later.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
            🗓️ Más Adelante ({later.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {later.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* Past Section */}
      {past.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">
            ⏳ Pasados ({past.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400 font-inter font-light italic">
          No hay recordatorios registrados.
        </div>
      )}
    </div>
  );
}
