import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { useSearchParams } from 'react-router-dom';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import RichTextEditor from '@/components/common/RichTextEditor';
import CustomDatePicker from '@/components/common/CustomDatePicker';

type Plant = {
  id: string;
  nickname: string;
  species: string;
  watering_frequency_days: number;
  last_watered_at: string;
  location: string | null;
  notes: string | null;
  emoji: string;
  created_at: string;
};

const PLANT_EMOJIS = ['🪴', '🌱', '🌵', '🌴', '🌸', '🌿', '🌻', '🍀', '🌺', '🌲'];

function getWateringStatus(lastWatered: string, frequencyDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = lastWatered.split('-');
  const wateredDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  wateredDate.setHours(0, 0, 0, 0);

  const nextWatering = new Date(wateredDate);
  nextWatering.setDate(nextWatering.getDate() + frequencyDays);

  const diffTime = nextWatering.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, status: 'overdue', label: `Atrasado por ${Math.abs(diffDays)} d${Math.abs(diffDays) === 1 ? 'ía' : 'ías'}`, badgeClass: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900' };
  } else if (diffDays === 0) {
    return { days: 0, status: 'today', label: '¡Regar HOY! 💦', badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900 animate-pulse' };
  } else if (diffDays === 1) {
    return { days: 1, status: 'tomorrow', label: 'Regar mañana', badgeClass: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-900' };
  } else {
    return { days: diffDays, status: 'ok', label: `Regar en ${diffDays} días`, badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' };
  }
}

export default function Plantas() {
  const [searchParams] = useSearchParams();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'need_water' | 'ok'>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [form, setForm] = useState({
    nickname: '',
    species: '',
    watering_frequency_days: 7,
    last_watered_at: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    emoji: '🪴',
  });

  const { toast } = useToast();

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPlants(data);
    } catch (err: any) {
      toast.error('Error al cargar plantas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (plant?: Plant) => {
    if (plant) {
      setEditingPlant(plant);
      setForm({
        nickname: plant.nickname,
        species: plant.species,
        watering_frequency_days: plant.watering_frequency_days,
        last_watered_at: plant.last_watered_at,
        location: plant.location || '',
        notes: plant.notes || '',
        emoji: plant.emoji || '🪴',
      });
    } else {
      setEditingPlant(null);
      setForm({
        nickname: '',
        species: '',
        watering_frequency_days: 7,
        last_watered_at: new Date().toISOString().split('T')[0],
        location: '',
        notes: '',
        emoji: '🪴',
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nickname.trim() || !form.species.trim()) {
      toast.error('El apodo y la especie de la planta son requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const payload = {
        user_id: user.id,
        nickname: form.nickname.trim(),
        species: form.species.trim(),
        watering_frequency_days: Number(form.watering_frequency_days) || 7,
        last_watered_at: form.last_watered_at,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
        emoji: form.emoji || '🪴',
      };

      if (editingPlant) {
        const { error } = await supabase
          .from('plants')
          .update(payload)
          .eq('id', editingPlant.id);
        if (error) throw error;
        setPlants(plants.map(p => p.id === editingPlant.id ? { ...p, ...payload } : p));
        toast.success('Planta actualizada 🌱');
      } else {
        const { data, error } = await supabase
          .from('plants')
          .insert([payload])
          .select();
        if (error) throw error;
        if (data) setPlants([data[0], ...plants]);
        toast.success('¡Nueva planta registrada! 🪴');
      }

      setShowForm(false);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePlant = async (id: string) => {
    const plantToDelete = plants.find((p) => p.id === id);
    if (!plantToDelete) return;

    try {
      const { error } = await supabase.from('plants').delete().eq('id', id);
      if (error) throw error;
      setPlants((prev) => prev.filter((p) => p.id !== id));
      
      toast.undoable('Planta eliminada', async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { id: _, created_at: __, ...rest } = plantToDelete as any;
          const { error: restoreErr } = await supabase.from('plants').insert([{
            id: plantToDelete.id,
            user_id: user.id,
            ...rest,
          }]);
          if (restoreErr) throw restoreErr;
          fetchPlants();
          toast.success('Planta restaurada ↩️');
        } catch (err: any) {
          toast.error('Error al restaurar planta: ' + err.message);
        }
      });
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const waterToday = async (plant: Plant) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase
        .from('plants')
        .update({ last_watered_at: todayStr })
        .eq('id', plant.id);
      if (error) throw error;

      setPlants(plants.map(p => p.id === plant.id ? { ...p, last_watered_at: todayStr } : p));
      toast.success(`¡${plant.nickname} regada hoy! 💦`);
    } catch (err: any) {
      toast.error('Error al registrar riego: ' + err.message);
    }
  };

  const filteredPlants = plants.filter(p => {
    const info = getWateringStatus(p.last_watered_at, p.watering_frequency_days);
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'need_water' && info.days <= 0) ||
      (statusFilter === 'ok' && info.days > 0);

    if (!searchTerm) return matchesFilter;
    const term = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normNick = p.nickname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normSpec = p.species.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normLoc = (p.location || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normNotes = (p.notes || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const matchesSearch =
      normNick.includes(term) ||
      normSpec.includes(term) ||
      normLoc.includes(term) ||
      normNotes.includes(term);

    return matchesFilter && matchesSearch;
  });

  const needWaterCount = plants.filter(p => getWateringStatus(p.last_watered_at, p.watering_frequency_days).days <= 0).length;

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
    <div className="space-y-12 pb-28 sm:pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white flex items-center gap-3">
            <span>Control de <span className="text-gradient">Plantas</span></span>
            <span className="text-3xl">🌱</span>
          </h1>
          <p className="font-inter mt-2 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Monitorea el riego, especies, ubicaciones y notas de cuidado para tus plantas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar planta o especie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-gray-100 dark:ring-gray-700 font-inter text-sm shadow-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenForm()}
            className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 shrink-0"
          >
            <HiOutlinePlus className="text-lg" />
            Nueva Planta
          </motion.button>
        </div>
      </header>

      {/* Summary Chips / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
              statusFilter === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:text-black dark:hover:text-white'
            }`}
          >
            Todas ({plants.length})
          </button>
          <button
            onClick={() => setStatusFilter('need_water')}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
              statusFilter === 'need_water'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50'
            }`}
          >
            <span>Necesitan Riego</span>
            {needWaterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">{needWaterCount}</span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`px-5 py-2.5 rounded-2xl font-syne text-[10px] font-bold uppercase tracking-widest transition-all ${
              statusFilter === 'ok'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:text-black dark:hover:text-white'
            }`}
          >
            Al día ({plants.length - needWaterCount})
          </button>
        </div>
      </div>

      {/* Modal Form */}
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
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-2xl w-full border-none shadow-2xl my-8 cursor-default overflow-hidden"
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{form.emoji || '🪴'}</span>
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                      {editingPlant ? 'Editar Planta' : 'Registrar Nueva Planta'}
                    </h2>
                    <p className="font-inter text-xs text-gray-400">Completa la información sobre tu planta y sus necesidades de riego.</p>
                  </div>
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
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                  {/* Emoji selector */}
                  <div className="space-y-2">
                    <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ícono de la Planta</label>
                    <div className="flex flex-wrap gap-2">
                      {PLANT_EMOJIS.map(e => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setForm({ ...form, emoji: e })}
                          className={`size-10 text-xl rounded-xl border-2 transition-all ${
                            form.emoji === e
                              ? 'border-emerald-500 scale-110 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Nombre Personal / Apodo *</label>
                      <input
                        required
                        value={form.nickname}
                        onChange={e => setForm({ ...form, nickname: e.target.value })}
                        placeholder="Ej. Monstera de la sala, Cactus de la entrada..."
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Especie / Variedad *</label>
                      <input
                        required
                        value={form.species}
                        onChange={e => setForm({ ...form, species: e.target.value })}
                        placeholder="Ej. Monstera Deliciosa, Ficus, Suculenta..."
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Riego cada (Días) *</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        required
                        value={form.watering_frequency_days}
                        onChange={e => setForm({ ...form, watering_frequency_days: parseInt(e.target.value, 10) || 7 })}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Último Riego *</label>
                      <CustomDatePicker
                        required
                        value={form.last_watered_at}
                        onChange={(val) => setForm({ ...form, last_watered_at: val })}
                        placeholder="Fecha de último riego..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ubicación (Opcional)</label>
                      <input
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        placeholder="Ej. Balcón, Sala, Luz indirecta"
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-transparent focus:border-[var(--vibrant-sky-blue)] rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <RichTextEditor
                    label="Notas de Cuidado & Recomendaciones (Soporta Markdown)"
                    value={form.notes}
                    onChange={(val) => setForm({ ...form, notes: val })}
                    placeholder="Instrucciones de fertilización, tipo de sustrato, humedad recomendada..."
                    minHeight="180px"
                    rows={8}
                  />
                </div>

                {/* Sticky Footer Actions */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : (editingPlant ? 'Guardar Cambios' : 'Registrar Planta')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Grid of Plant Cards */}
      {filteredPlants.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900/50 rounded-[2.5rem] border-none p-8 space-y-3">
          <div className="text-5xl">🪴</div>
          <h3 className="font-dm-sans text-lg font-bold text-gray-900 dark:text-white">No se encontraron plantas</h3>
          <p className="font-inter text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta cambiar el término de búsqueda o el filtro seleccionado.'
              : 'Agrega tu primera planta para llevar el registro de sus riegos y cuidados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map(plant => {
            const info = getWateringStatus(plant.last_watered_at, plant.watering_frequency_days);
            const isPinned = isItemPinned(plant.id);

            return (
              <motion.div
                key={plant.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="group bg-white/80 dark:bg-gray-900/80 glass dark:dark-glass p-6 rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 overflow-hidden relative"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
                        {plant.emoji || '🪴'}
                      </div>
                      <div>
                        <h3 className="font-dm-sans font-bold text-xl text-gray-900 dark:text-white leading-tight">
                          {plant.nickname}
                        </h3>
                        <p className="font-inter text-xs italic text-gray-500 dark:text-gray-400">
                          {plant.species}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const pinned = togglePinItem({
                            id: plant.id,
                            type: 'plant',
                            title: `${plant.emoji || '🪴'} ${plant.nickname}`,
                            subtitle: `${plant.species} (${info.label})`,
                            path: '/admin/panel/plantas',
                          });
                          toast.info(pinned ? 'Planta fijada en el inicio 📌' : 'Planta desfijada');
                          setPlants([...plants]);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        title={isPinned ? 'Desfijar del inicio' : 'Fijar en el inicio'}
                      >
                        {isPinned ? '📌' : '📍'}
                      </button>

                      <button
                        onClick={() => handleOpenForm(plant)}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                        title="Editar planta"
                      >
                        <HiOutlinePencil className="text-base" />
                      </button>

                      <button
                        onClick={() => deletePlant(plant.id)}
                        className="p-2 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/35 border border-red-500/20 dark:border-red-500/30 rounded-xl transition-all shrink-0"
                        title="Eliminar planta"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`px-3 py-1 rounded-full font-syne text-[10px] font-bold uppercase tracking-wider border ${info.badgeClass}`}>
                      {info.label}
                    </span>

                    {plant.location && (
                      <span className="px-3 py-1 rounded-full font-syne text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <HiOutlineLocationMarker className="text-xs" />
                        {plant.location}
                      </span>
                    )}

                    <span className="px-3 py-1 rounded-full font-syne text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <HiOutlineCalendar className="text-xs" />
                      Cada {plant.watering_frequency_days} días
                    </span>
                  </div>

                  {/* Notes / Description */}
                  {plant.notes && (
                    <div className="pt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100/80 dark:border-gray-800/80">
                      <AutoFormattedText text={plant.notes} maxLength={140} expandable={true} />
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-inter text-gray-400 dark:text-gray-500">
                    Último riego: <span className="font-semibold text-gray-700 dark:text-gray-300">{plant.last_watered_at}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => waterToday(plant)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-syne text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span>Regar Hoy</span>
                    <span>💦</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
