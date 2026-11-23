import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineDuplicate,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiX,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { loadSystemData, saveSystemData } from '@/lib/systemStore';

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  body: string;
  updatedAt: string;
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'prompt-seguimiento-comercial',
    title: 'Seguimiento de Propuesta Comercial',
    category: 'Clientes & Negocio',
    body: 'Hola {{cliente}}, ¿cómo estás?\n\nTe escribo para dar seguimiento a la propuesta de {{proyecto}} por un total de ${{monto}} que te compartí el {{fecha}}.\n\nSi tienes alguna duda técnica o quieres ajustar el alcance, con gusto lo revisamos en una llamada breve.\n\nSaludos,\nAndrés Cordero',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prompt-especificacion-tecnica',
    title: 'Prompt Arquitectura & Código',
    category: 'IA & Ingeniería',
    body: 'Actúa como Tech Lead Senior especialista en {{stack}}.\n\nContexto del proyecto: {{proyecto}}\nObjetivo principal: {{objetivo}}\nRestricciones clave: {{restricciones}}\n\nPropón primero la arquitectura, modelo de datos y casos borde antes de generar la implementación.',
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES = ['Clientes & Negocio', 'IA & Ingeniería', 'Mensajes & WhatsApp', 'Operación'];
const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function extractVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g);
  const set = new Set<string>();
  for (const m of matches) {
    if (m[1]) set.add(m[1].trim());
  }
  return Array.from(set);
}

export default function Prompts() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    category: 'Clientes & Negocio',
    body: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const saved = await loadSystemData<PromptTemplate[]>('prompt_templates', []);
    const list = Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_PROMPTS;
    setPrompts(list);
    setSelectedId(list[0]?.id || null);
    setLoading(false);
  };

  const persistPrompts = async (next: PromptTemplate[]) => {
    setPrompts(next);
    await saveSystemData('prompt_templates', next);
  };

  const filteredPrompts = useMemo(() => {
    const norm = normalize(searchTerm.trim());
    return prompts.filter((p) => {
      const catOk = categoryFilter === 'Todas' || p.category === categoryFilter;
      const searchOk =
        !norm ||
        normalize(p.title).includes(norm) ||
        normalize(p.category).includes(norm) ||
        normalize(p.body).includes(norm);
      return catOk && searchOk;
    });
  }, [prompts, searchTerm, categoryFilter]);

  const activePrompt = useMemo(
    () => prompts.find((p) => p.id === selectedId) || filteredPrompts[0] || null,
    [prompts, selectedId, filteredPrompts]
  );

  const detectedVariables = useMemo(
    () => (activePrompt ? extractVariables(activePrompt.body) : []),
    [activePrompt]
  );

  const renderedOutput = useMemo(() => {
    if (!activePrompt) return '';
    return activePrompt.body.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (full, name) => {
      const key = String(name).trim();
      const val = varValues[key];
      return val && val.trim() ? val : full;
    });
  }, [activePrompt, varValues]);

  const handleCopyRendered = async () => {
    if (!activePrompt) return;
    try {
      await navigator.clipboard.writeText(renderedOutput);
      setCopiedId(activePrompt.id);
      toast.success('Texto compilado copiado al portapapeles ✨');
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const openCreateModal = () => {
    setEditingPrompt(null);
    setFormState({ title: '', category: 'Clientes & Negocio', body: '' });
    setShowModal(true);
  };

  const openEditModal = (p: PromptTemplate) => {
    setEditingPrompt(p);
    setFormState({ title: p.title, category: p.category, body: p.body });
    setShowModal(true);
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.body.trim()) {
      toast.error('Título y plantilla son obligatorios.');
      return;
    }

    const nowIso = new Date().toISOString();
    if (editingPrompt) {
      const next = prompts.map((p) =>
        p.id === editingPrompt.id
          ? {
              ...p,
              title: formState.title.trim(),
              category: formState.category,
              body: formState.body,
              updatedAt: nowIso,
            }
          : p
      );
      await persistPrompts(next);
      toast.success('Plantilla actualizada ✨');
    } else {
      const created: PromptTemplate = {
        id: `prompt_${Date.now()}`,
        title: formState.title.trim(),
        category: formState.category,
        body: formState.body,
        updatedAt: nowIso,
      };
      const next = [created, ...prompts];
      await persistPrompts(next);
      setSelectedId(created.id);
      toast.success('Plantilla creada ✨');
    }
    setShowModal(false);
  };

  const handleDeletePrompt = async (p: PromptTemplate) => {
    const prev = prompts;
    const next = prompts.filter((item) => item.id !== p.id);
    await persistPrompts(next);
    if (selectedId === p.id) setSelectedId(next[0]?.id || null);

    toast.undoable('Plantilla eliminada', async () => {
      await persistPrompts(prev);
      setSelectedId(p.id);
      toast.success('Plantilla restaurada ↩️');
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-80 rounded-3xl" />
          <div className="lg:col-span-2 skeleton h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Prompts & <span className="text-gradient">Variables</span>
          </h1>
          <p className="hidden sm:block font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs">
            Plantillas reutilizables con campos dinámicos <code className="text-xs">{'{{variable}}'}</code> listos para copiar.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 sm:px-5 min-h-[44px] py-2 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <HiOutlinePlus className="text-lg" />
          <span>Nueva Plantilla</span>
        </button>
      </header>

      {/* Search + Categories */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar plantilla, categoría o variable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-xs"
          />
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['Todas', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 min-h-[40px] py-1.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                  : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Templates List */}
        <div className="space-y-3">
          {filteredPrompts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center space-y-2">
              <p className="font-dm-sans font-bold text-gray-700 dark:text-gray-200">Sin coincidencias</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('Todas');
                }}
                className="text-xs font-syne font-bold uppercase text-[var(--vibrant-sky-blue)] cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            filteredPrompts.map((p) => {
              const isSelected = activePrompt?.id === p.id;
              const vars = extractVariables(p.body);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setVarValues({});
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-gray-900 border-[var(--vibrant-sky-blue)] shadow-md'
                      : 'bg-white/75 dark:bg-gray-900/75 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-syne font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-300 mb-1">
                        {p.category}
                      </span>
                      <h3 className="font-dm-sans font-bold text-base text-gray-900 dark:text-white truncate">
                        {p.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-2 text-gray-400 hover:text-[var(--vibrant-sky-blue)] rounded-xl cursor-pointer"
                        title="Editar plantilla"
                      >
                        <HiOutlinePencil />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(p)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer"
                        title="Eliminar plantilla"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                  <p className="font-inter text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {p.body}
                  </p>
                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {vars.map((v) => (
                        <span
                          key={v}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Variable Filler & Preview */}
        <div className="lg:col-span-2">
          {activePrompt ? (
            <div className="bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] p-5 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-[var(--vibrant-sky-blue)] flex items-center gap-1.5">
                    <HiOutlineSparkles /> {activePrompt.category}
                  </span>
                  <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                    {activePrompt.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRendered}
                  className="px-5 min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                >
                  {copiedId === activePrompt.id ? <HiOutlineCheck className="text-lg" /> : <HiOutlineDuplicate className="text-lg" />}
                  <span>{copiedId === activePrompt.id ? 'Copiado' : 'Copiar Listo'}</span>
                </button>
              </div>

              {detectedVariables.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Rellenar Variables ({detectedVariables.length})
                    </span>
                    {Object.keys(varValues).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setVarValues({})}
                        className="font-syne text-[10px] font-bold uppercase text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      >
                        Limpiar campos
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detectedVariables.map((vName) => (
                      <div key={vName}>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                          {vName}
                        </label>
                        <input
                          type="text"
                          placeholder={`Valor para ${vName}...`}
                          value={varValues[vName] || ''}
                          onChange={(e) =>
                            setVarValues((prev) => ({ ...prev, [vName]: e.target.value }))
                          }
                          className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Vista Previa Final
                </span>
                <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/70 text-gray-800 dark:text-gray-100">
                  {renderedOutput}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center text-gray-400">
              Selecciona o crea una plantilla para comenzar.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Prompt Modal (4-Part Architecture) */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowModal(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 18 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[90vh] flex flex-col max-w-2xl w-full border-none shadow-2xl cursor-default overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 sm:p-7 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div>
                    <h2 className="font-dm-sans text-2xl font-bold text-gray-900 dark:text-white">
                      {editingPrompt ? 'Editar Plantilla' : 'Nueva Plantilla con Variables'}
                    </h2>
                    <p className="font-inter text-xs text-gray-400">
                      Usa {'{{nombre}}'} para generar campos automáticos al copiar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSavePrompt} className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Título *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Cotización Web"
                          value={formState.title}
                          onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                          className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Categoría
                        </label>
                        <CustomSelect
                          value={formState.category}
                          onChange={(val) => setFormState({ ...formState, category: val })}
                          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Contenido de la Plantilla *
                      </label>
                      <textarea
                        required
                        rows={7}
                        placeholder="Hola {{cliente}}, te comparto el detalle de {{proyecto}}..."
                        value={formState.body}
                        onChange={(e) => setFormState({ ...formState, body: e.target.value })}
                        className="w-full p-4 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[160px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-7 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      {editingPrompt ? 'Guardar Cambios' : 'Crear Plantilla'}
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
