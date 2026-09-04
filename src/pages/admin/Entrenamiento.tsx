import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineSearch,
  HiX,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import AutoFormattedText from '@/components/common/AutoFormattedText';
import RichTextEditor from '@/components/common/RichTextEditor';

export interface ExerciseSet {
  id: string;
  name: string;
  targetMuscle?: string;
  sets: number;
  reps: number;
  approxWeightKg: number;
  maxFailureWeightKg?: number;
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  dayType: 'Dia_A' | 'Dia_B'; // Un día sí y un día no
  title: string;
  description: string;
  focusMuscles: string;
  exercises: ExerciseSet[];
  lastCompletedAt?: string | null;
  createdAt: string;
}

const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine_day_a',
    dayType: 'Dia_A',
    title: 'Rutina Día A: Empuje & Pierna (Pecho, Hombro, Cuádriceps)',
    description: 'Enfocada en fuerza e hipertrofia. Realizar calentamiento articular previo.',
    focusMuscles: 'Pecho, Hombro, Tríceps, Pierna',
    exercises: [
      {
        id: 'ex_1',
        name: 'Press de Banca Plano con Barra',
        targetMuscle: 'Pecho',
        sets: 4,
        reps: 10,
        approxWeightKg: 60,
        maxFailureWeightKg: 75,
        notes: 'Controlar la bajada en 2 segundos y empuje explosivo.',
      },
      {
        id: 'ex_2',
        name: 'Press Militar con Mancuernas',
        targetMuscle: 'Hombro',
        sets: 4,
        reps: 10,
        approxWeightKg: 18,
        maxFailureWeightKg: 22,
        notes: 'Espalda recta apoyada en banco a 75 grados.',
      },
      {
        id: 'ex_3',
        name: 'Sentadilla Libre o Prensa 45°',
        targetMuscle: 'Cuádriceps',
        sets: 4,
        reps: 12,
        approxWeightKg: 80,
        maxFailureWeightKg: 100,
        notes: 'Profundidad completa manteniendo el core apretado.',
      },
      {
        id: 'ex_4',
        name: 'Extensiones de Tríceps en Polea',
        targetMuscle: 'Tríceps',
        sets: 3,
        reps: 12,
        approxWeightKg: 25,
        maxFailureWeightKg: 30,
        notes: 'Codos pegados al cuerpo.',
      },
    ],
    lastCompletedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'routine_day_b',
    dayType: 'Dia_B',
    title: 'Rutina Día B: Tracción & Posterior (Espalda, Bíceps, Isquios)',
    description: 'Enfocada en tracción y cadena posterior con control de peso máximo.',
    focusMuscles: 'Espalda, Bíceps, Isquiotibiales, Abdomen',
    exercises: [
      {
        id: 'ex_5',
        name: 'Jalón al Pecho en Polea / Dominadas',
        targetMuscle: 'Espalda',
        sets: 4,
        reps: 10,
        approxWeightKg: 55,
        maxFailureWeightKg: 70,
        notes: 'Llevar los codos hacia las costillas y apretar escápulas.',
      },
      {
        id: 'ex_6',
        name: 'Remo con Mancuerna en Banco',
        targetMuscle: 'Espalda Media',
        sets: 4,
        reps: 10,
        approxWeightKg: 24,
        maxFailureWeightKg: 28,
        notes: 'Tirón controlado hacia la cadera.',
      },
      {
        id: 'ex_7',
        name: 'Peso Muerto Rumano con Barra',
        targetMuscle: 'Isquios & Glúteo',
        sets: 4,
        reps: 10,
        approxWeightKg: 70,
        maxFailureWeightKg: 85,
        notes: 'Empujar la cadera hacia atrás sintiendo el estiramiento.',
      },
      {
        id: 'ex_8',
        name: 'Curl de Bíceps con Barra Z / Mancuernas',
        targetMuscle: 'Bíceps',
        sets: 3,
        reps: 12,
        approxWeightKg: 14,
        maxFailureWeightKg: 18,
        notes: 'Evitar balanceo con la espalda.',
      },
    ],
    lastCompletedAt: null,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'ac_fitness_routines_v1';
const NOTE_CATEGORY_PREFIX = 'Fitness_Routine_Data:';

export default function Entrenamiento() {
  const { toast } = useToast();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [activeDayFilter, setActiveDayFilter] = useState<'all' | 'Dia_A' | 'Dia_B'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

  // Form State
  const [formDayType, setFormDayType] = useState<'Dia_A' | 'Dia_B'>('Dia_A');
  const [formTitle, setFormTitle] = useState('');
  const [formFocus, setFormFocus] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExercises, setFormExercises] = useState<ExerciseSet[]>([]);

  // Exercise Sub-Form state
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExSets, setNewExSets] = useState('4');
  const [newExReps, setNewExReps] = useState('10');
  const [newExWeight, setNewExWeight] = useState('');
  const [newExMaxFailWeight, setNewExMaxFailWeight] = useState('');
  const [newExNotes, setNewExNotes] = useState('');

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      // 1. Try to load synced routines from notes table in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: noteRecords } = await supabase
          .from('notes')
          .select('*')
          .like('category', `${NOTE_CATEGORY_PREFIX}%`);

        if (noteRecords && noteRecords.length > 0) {
          const parsedRoutines: WorkoutRoutine[] = [];
          for (const rec of noteRecords) {
            try {
              const routineData = JSON.parse(rec.content);
              parsedRoutines.push({
                ...routineData,
                id: rec.id,
              });
            } catch {
              // ignore parse errors
            }
          }

          if (parsedRoutines.length > 0) {
            setRoutines(parsedRoutines);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedRoutines));
            return;
          }
        }
      }

      // 2. Fallback to localStorage or Seed defaults
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRoutines(JSON.parse(saved));
      } else {
        setRoutines(DEFAULT_ROUTINES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROUTINES));
        // Seed to Supabase in background
        seedDefaultRoutinesToSupabase(DEFAULT_ROUTINES);
      }
    } catch {
      setRoutines(DEFAULT_ROUTINES);
    }
  };

  const seedDefaultRoutinesToSupabase = async (defaultList: WorkoutRoutine[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const r of defaultList) {
        await supabase.from('notes').insert([
          {
            user_id: user.id,
            title: `🏋️ ${r.title}`,
            category: `${NOTE_CATEGORY_PREFIX}${r.dayType}`,
            content: JSON.stringify(r),
          },
        ]);
      }
    } catch {
      // silent background seed
    }
  };

  const saveRoutineToBackend = async (routine: WorkoutRoutine) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        title: `🏋️ ${routine.title}`,
        category: `${NOTE_CATEGORY_PREFIX}${routine.dayType}`,
        content: JSON.stringify(routine),
      };

      if (routine.id && !routine.id.startsWith('routine_')) {
        await supabase.from('notes').update(payload).eq('id', routine.id);
      } else {
        const { data } = await supabase.from('notes').insert([payload]).select();
        if (data && data[0]) {
          routine.id = data[0].id;
        }
      }
    } catch (err: any) {
      console.error('Error saving routine to cloud:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoutine(null);
    setFormDayType('Dia_A');
    setFormTitle('');
    setFormFocus('Pecho, Hombro, Tríceps');
    setFormDescription('');
    setFormExercises([]);
    setShowModal(true);
  };

  const handleOpenEdit = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setFormDayType(routine.dayType);
    setFormTitle(routine.title);
    setFormFocus(routine.focusMuscles);
    setFormDescription(routine.description);
    setFormExercises(routine.exercises || []);
    setShowModal(true);
  };

  const handleAddExerciseToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) {
      toast.error('Ingresa el nombre del ejercicio');
      return;
    }

    const ex: ExerciseSet = {
      id: 'ex_' + Date.now(),
      name: newExName.trim(),
      targetMuscle: newExMuscle.trim() || undefined,
      sets: parseInt(newExSets, 10) || 4,
      reps: parseInt(newExReps, 10) || 10,
      approxWeightKg: parseFloat(newExWeight) || 0,
      maxFailureWeightKg: parseFloat(newExMaxFailWeight) || undefined,
      notes: newExNotes.trim() || undefined,
    };

    setFormExercises([...formExercises, ex]);
    setNewExName('');
    setNewExMuscle('');
    setNewExWeight('');
    setNewExMaxFailWeight('');
    setNewExNotes('');
    toast.success('Ejercicio agregado a la rutina');
  };

  const handleRemoveExercise = (exId: string) => {
    setFormExercises(formExercises.filter(e => e.id !== exId));
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Ingresa el título de la rutina');
      return;
    }

    const updatedRoutine: WorkoutRoutine = {
      id: editingRoutine ? editingRoutine.id : 'routine_' + Date.now(),
      dayType: formDayType,
      title: formTitle.trim(),
      description: formDescription.trim(),
      focusMuscles: formFocus.trim(),
      exercises: formExercises,
      lastCompletedAt: editingRoutine ? editingRoutine.lastCompletedAt : null,
      createdAt: editingRoutine ? editingRoutine.createdAt : new Date().toISOString(),
    };

    let newRoutines: WorkoutRoutine[];
    if (editingRoutine) {
      newRoutines = routines.map(r => (r.id === editingRoutine.id ? updatedRoutine : r));
      toast.success('Rutina actualizada correctamente');
    } else {
      newRoutines = [updatedRoutine, ...routines];
      toast.success('Nueva rutina creada con éxito');
    }

    setRoutines(newRoutines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutines));
    await saveRoutineToBackend(updatedRoutine);
    setShowModal(false);
  };

  const handleDeleteRoutine = async (routine: WorkoutRoutine) => {
    const prevList = [...routines];
    const nextList = routines.filter(r => r.id !== routine.id);
    setRoutines(nextList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));

    if (routine.id && !routine.id.startsWith('routine_')) {
      await supabase.from('notes').delete().eq('id', routine.id);
    }

    toast.undoable('Rutina eliminada', async () => {
      setRoutines(prevList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prevList));
      await saveRoutineToBackend(routine);
      toast.success('Rutina restaurada ↩️');
    });
  };

  const handleMarkCompletedToday = async (routine: WorkoutRoutine) => {
    const today = new Date().toISOString().split('T')[0];
    const updated: WorkoutRoutine = {
      ...routine,
      lastCompletedAt: today,
    };

    const newRoutines = routines.map(r => (r.id === routine.id ? updated : r));
    setRoutines(newRoutines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutines));
    await saveRoutineToBackend(updated);
    toast.success(`💪 ¡Entrenamiento "${routine.title}" registrado como completado hoy!`);
  };

  const filteredRoutines = routines.filter(r => {
    const matchesDay = activeDayFilter === 'all' || r.dayType === activeDayFilter;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.focusMuscles.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.exercises.some(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-2xl">
              <FaDumbbell className="text-2xl" />
            </span>
            <span>Registro de Entrenamiento</span>
          </h1>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus rutinas alternadas (Día A / Día B), series, repeticiones y pesos máximos al fallo.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <HiOutlinePlus className="text-lg" />
          <span>Nueva Rutina</span>
        </button>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
          {[
            { key: 'all', label: 'Todas las Rutinas' },
            { key: 'Dia_A', label: '⚡ Día A (Empuje/Pierna)' },
            { key: 'Dia_B', label: '🔥 Día B (Tracción/Isquios)' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveDayFilter(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeDayFilter === tab.key
                  ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por ejercicio o músculo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-rose-500"
          />
          <HiOutlineSearch className="absolute left-3.5 top-3 text-gray-400 text-base" />
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoutines.length === 0 ? (
          <div className="lg:col-span-2 p-12 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-3">
            <FaDumbbell className="text-4xl text-gray-300 dark:text-gray-600 mx-auto" />
            <h3 className="font-dm-sans text-lg font-bold text-gray-800 dark:text-gray-200">
              No se encontraron rutinas
            </h3>
            <p className="font-inter text-xs text-gray-400 max-w-md mx-auto">
              Presiona "Nueva Rutina" para definir tus ejercicios, series, repeticiones y peso de fallo.
            </p>
          </div>
        ) : (
          filteredRoutines.map(routine => (
            <motion.div
              key={routine.id}
              layout
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs hover:border-gray-200 dark:hover:border-gray-700 transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Badge & Day indicator */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider ${
                        routine.dayType === 'Dia_A'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {routine.dayType === 'Dia_A' ? '⚡ Día A (Un día sí)' : '🔥 Día B (Día siguiente)'}
                    </span>

                    {routine.lastCompletedAt && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-inter font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1">
                        <HiOutlineCheckCircle /> Hecho el {routine.lastCompletedAt}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const pinned = togglePinItem({
                          id: routine.id,
                          type: 'project',
                          title: routine.title,
                          subtitle: `${routine.exercises.length} ejercicios • ${routine.focusMuscles}`,
                          path: '/admin/panel/entrenamiento',
                        });
                        toast.info(pinned ? 'Rutina fijada 📌' : 'Rutina desfijada');
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isItemPinned(routine.id)
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                      title="Fijar en Inicio"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(routine)}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      title="Editar Rutina"
                    >
                      <HiOutlinePencil className="text-lg" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(routine)}
                      className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      title="Eliminar Rutina"
                    >
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                    {routine.title}
                  </h2>
                  <p className="font-syne text-xs font-bold text-rose-500 dark:text-rose-400 mt-1 uppercase tracking-wider">
                    🎯 Enfoque: {routine.focusMuscles}
                  </p>
                  {routine.description && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <AutoFormattedText text={routine.description} maxLength={120} />
                    </div>
                  )}
                </div>

                {/* Exercise List */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-syne font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    <span>Ejercicio & Músculo</span>
                    <span className="text-right">Series / Reps / Peso</span>
                  </div>

                  {routine.exercises && routine.exercises.length > 0 ? (
                    routine.exercises.map((ex, i) => (
                      <div
                        key={ex.id || i}
                        className="p-3.5 bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 font-syne text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {ex.name}
                            </span>
                          </div>
                          {ex.targetMuscle && (
                            <span className="text-[10px] font-inter text-gray-400 block ml-7">
                              {ex.targetMuscle} {ex.notes ? `• ${ex.notes}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Stats Tags */}
                        <div className="flex items-center gap-2 flex-wrap sm:justify-end shrink-0 ml-7 sm:ml-0">
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-syne text-xs font-bold border border-gray-200/50 dark:border-gray-600 shadow-2xs">
                            {ex.sets} × {ex.reps} reps
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-syne text-xs font-bold border border-rose-200/50 dark:border-rose-900/40">
                            ~{ex.approxWeightKg} kg
                          </span>

                          {ex.maxFailureWeightKg && (
                            <span
                              className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-syne text-[10px] font-bold tracking-wider uppercase border border-amber-300/40 dark:border-amber-700/50"
                              title="Peso máximo al fallo muscular"
                            >
                              🔥 Fallo: {ex.maxFailureWeightKg} kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-inter text-xs text-gray-400 italic py-2">
                      Sin ejercicios agregados en esta rutina.
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                  <HiOutlineClock />
                  <span>{routine.exercises.length} Ejercicios</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleMarkCompletedToday(routine)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 interactive-hover"
                >
                  <HiOutlineCheckCircle className="text-base" />
                  <span>Completada Hoy</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ═══ CREATE / EDIT ROUTINE MODAL (USING PORTAL) ═══ */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={e => {
                if (e.target === e.currentTarget) setShowModal(false);
              }}
            >
              <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] h-[90vh] max-h-[820px] max-w-3xl lg:max-w-4xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden my-auto cursor-default"
              >
                {/* ═══ FIXED HEADER ═══ */}
                <div className="flex items-center justify-between p-5 sm:p-7 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FaDumbbell className="text-rose-500 text-lg sm:text-xl" />
                      <span>{editingRoutine ? 'Editar Rutina' : 'Nueva Rutina de Entrenamiento'}</span>
                    </h2>
                    <p className="font-inter text-xs text-gray-400 mt-0.5">
                      Configura la alternancia (Día A / Día B), series, repeticiones y peso.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSaveRoutine} className="flex flex-col flex-1 min-h-0">
                  {/* ═══ SINGLE SCROLLABLE BODY ═══ */}
                  <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          Alternancia / Día *
                        </label>
                        <CustomSelect
                          value={formDayType}
                          onChange={val => setFormDayType(val as any)}
                          options={[
                            { value: 'Dia_A', label: '⚡ Día A (Un día sí)' },
                            { value: 'Dia_B', label: '🔥 Día B (Día siguiente)' },
                          ]}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          Músculos / Enfoque *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Pecho, Hombro, Tríceps"
                          value={formFocus}
                          onChange={e => setFormFocus(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        Título de la Rutina *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Rutina Día A: Empuje & Pierna"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-inter text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-rose-500"
                      />
                    </div>

                    {/* Rich Text Description */}
                    <RichTextEditor
                      label="Notas & Recomendaciones"
                      value={formDescription}
                      onChange={val => setFormDescription(val)}
                      placeholder="Instrucciones de calentamiento, tiempo de descanso entre series (ej. 90 seg), etc."
                      minHeight="100px"
                    />

                    {/* Exercise Builder Sub-Section */}
                    <div className="space-y-3.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="font-dm-sans text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>💪 Ejercicios de la Rutina</span>
                          <span className="text-xs font-syne font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-full">
                            {formExercises.length}
                          </span>
                        </h3>
                      </div>

                      {/* Add Exercise Mini-Form */}
                      <div className="p-4 bg-gray-50/90 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nombre del Ejercicio (ej. Press de Banca)"
                            value={newExName}
                            onChange={e => setNewExName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-rose-500"
                          />
                          <input
                            type="text"
                            placeholder="Músculo (ej. Pecho Medio)"
                            value={newExMuscle}
                            onChange={e => setNewExMuscle(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-rose-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block font-syne text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Series
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newExSets}
                              onChange={e => setNewExSets(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block font-syne text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newExReps}
                              onChange={e => setNewExReps(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block font-syne text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Peso Aprox (kg)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="60"
                              value={newExWeight}
                              onChange={e => setNewExWeight(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block font-syne text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                              Fallo Max (kg)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="75"
                              value={newExMaxFailWeight}
                              onChange={e => setNewExMaxFailWeight(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            placeholder="Notas de técnica / RPE (ej. RPE 9, 2 RIR)"
                            value={newExNotes}
                            onChange={e => setNewExNotes(e.target.value)}
                            className="flex-1 px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-inter text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddExerciseToForm}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <HiOutlinePlus />
                            <span>Añadir Ejercicio</span>
                          </button>
                        </div>
                      </div>

                      {/* Added Exercises Chips in Form */}
                      {formExercises.length > 0 && (
                        <div className="space-y-1.5">
                          {formExercises.map((ex, i) => (
                            <div
                              key={ex.id || i}
                              className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-rose-500">{i + 1}.</span>
                                <span className="font-bold text-gray-900 dark:text-white truncate">{ex.name}</span>
                                <span className="text-gray-400">({ex.sets} × {ex.reps} reps @ {ex.approxWeightKg} kg{ex.maxFailureWeightKg ? ` | Fallo: ${ex.maxFailureWeightKg}kg` : ''})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                              >
                                <HiX className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ═══ FIXED FOOTER ACTIONS ═══ */}
                  <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <FaDumbbell className="text-sm" />
                      <span>Guardar Rutina</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
