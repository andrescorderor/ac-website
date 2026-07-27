import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type ResultType = 'note' | 'task' | 'debt' | 'vault' | 'shopping' | 'reminder' | 'project' | 'checklist' | 'recipe';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ElementType;
  categoryLabel: string;
  badgeColor: string;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_META: Record<ResultType, { label: string; icon: React.ElementType; color: string }> = {
  note:      { label: 'Nota',          icon: HiOutlineDocumentText,  color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  reminder:  { label: 'Fecha',         icon: HiOutlineCalendar,      color: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300' },
  task:      { label: 'Tarea',         icon: HiOutlineClipboardList, color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' },
  debt:      { label: 'Deuda',         icon: HiOutlineUserGroup,     color: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' },
  vault:     { label: 'Bóveda',        icon: HiOutlineLockClosed,    color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' },
  shopping:  { label: 'Compra',        icon: HiOutlineShoppingBag,   color: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300' },
  project:   { label: 'Proyecto',      icon: HiOutlineColorSwatch,   color: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' },
  checklist: { label: 'Checklist',     icon: HiOutlineCheckCircle,   color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' },
  recipe:    { label: 'Receta',        icon: HiOutlineBookOpen,      color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
};

/** Highlight matching substring with <mark> */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-inherit rounded-sm px-px">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Focus input and reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
      searchAll('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) searchAll(query);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard: Escape, arrows, Enter
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      }
      if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        handleSelectResult(results[activeIndex].path);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, results, activeIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const searchAll = useCallback(async (searchTerm: string) => {
    setSearching(true);
    const term = searchTerm.toLowerCase().trim();

    try {
      const [nts, rem, tsk, dbt, vlt, shp, prj, chk, rec] = await Promise.all([
        supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('debts').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('vault_items').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('shopping_list').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('creative_projects').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('monthly_checklist_items').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('recipes').select('*').order('created_at', { ascending: false }).limit(12),
      ]);

      const items: SearchResult[] = [];

      const push = (r: SearchResult) => items.push(r);

      // Notes
      nts.data?.forEach(n => {
        if (!term || n.title.toLowerCase().includes(term) || n.content?.toLowerCase().includes(term)) {
          push({ id: n.id, type: 'note', title: n.title, subtitle: n.category || n.content?.slice(0, 70), path: '/admin/panel/notas', icon: TYPE_META.note.icon, categoryLabel: TYPE_META.note.label, badgeColor: TYPE_META.note.color });
        }
      });

      // Reminders
      rem.data?.forEach(r => {
        if (!term || r.title.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term)) {
          push({ id: r.id, type: 'reminder', title: r.title, subtitle: `${r.date || r.event_date || 'Sin fecha'}${r.time ? ` · ${r.time}` : ''}`, path: '/admin/panel/recordatorios', icon: TYPE_META.reminder.icon, categoryLabel: TYPE_META.reminder.label, badgeColor: TYPE_META.reminder.color });
        }
      });

      // Tasks
      tsk.data?.forEach(t => {
        if (!term || t.title.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term)) {
          push({ id: t.id, type: 'task', title: t.title, subtitle: t.completed ? '✓ Completada' : t.due_date ? `Vence: ${t.due_date}` : 'Pendiente', path: '/admin/panel/pendientes', icon: TYPE_META.task.icon, categoryLabel: TYPE_META.task.label, badgeColor: TYPE_META.task.color });
        }
      });

      // Debts
      dbt.data?.forEach(d => {
        if (!term || d.debtor_name.toLowerCase().includes(term) || d.concept?.toLowerCase().includes(term)) {
          push({ id: d.id, type: 'debt', title: d.debtor_name, subtitle: `$${d.amount}${d.concept ? ` · ${d.concept}` : ''}`, path: '/admin/panel/deudas', icon: TYPE_META.debt.icon, categoryLabel: TYPE_META.debt.label, badgeColor: TYPE_META.debt.color });
        }
      });

      // Vault
      vlt.data?.forEach(v => {
        if (!term || v.title.toLowerCase().includes(term)) {
          push({ id: v.id, type: 'vault', title: v.title, subtitle: '🔒 Texto seguro en bóveda', path: '/admin/panel/vault', icon: TYPE_META.vault.icon, categoryLabel: TYPE_META.vault.label, badgeColor: TYPE_META.vault.color });
        }
      });

      // Shopping
      shp.data?.forEach(s => {
        if (!term || s.name.toLowerCase().includes(term) || s.location?.toLowerCase().includes(term)) {
          push({ id: s.id, type: 'shopping', title: s.name, subtitle: `${s.bought ? '✓ Comprado' : 'Por comprar'}${s.location ? ` · ${s.location}` : ''}`, path: '/admin/panel/compras', icon: TYPE_META.shopping.icon, categoryLabel: TYPE_META.shopping.label, badgeColor: TYPE_META.shopping.color });
        }
      });

      // Projects
      prj.data?.forEach(p => {
        if (!term || p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)) {
          push({ id: p.id, type: 'project', title: `${p.emoji || '🎨'} ${p.name}`, subtitle: p.category, path: '/admin/panel/proyectos', icon: TYPE_META.project.icon, categoryLabel: TYPE_META.project.label, badgeColor: TYPE_META.project.color });
        }
      });

      // Checklist items
      chk.data?.forEach(c => {
        if (!term || c.title.toLowerCase().includes(term) || c.category?.toLowerCase().includes(term)) {
          push({ id: c.id, type: 'checklist', title: c.title, subtitle: c.category, path: '/admin/panel/checklist', icon: TYPE_META.checklist.icon, categoryLabel: TYPE_META.checklist.label, badgeColor: TYPE_META.checklist.color });
        }
      });

      // Recipes
      rec.data?.forEach(r => {
        if (!term || r.name.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term) || r.description?.toLowerCase().includes(term)) {
          push({ id: r.id, type: 'recipe', title: `${r.emoji || '🍽️'} ${r.name}`, subtitle: r.category, path: '/admin/panel/recetas', icon: TYPE_META.recipe.icon, categoryLabel: TYPE_META.recipe.label, badgeColor: TYPE_META.recipe.color });
        }
      });

      setResults(items);
      setActiveIndex(-1);
    } catch (err) {
      console.error('Error en búsqueda global:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectResult = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleTogglePin = (e: React.MouseEvent, res: SearchResult) => {
    e.stopPropagation();
    const isNowPinned = togglePinItem({ id: res.id, type: res.type, title: res.title, subtitle: res.subtitle, path: res.path });
    toast.info(isNowPinned ? '¡Fijado en el inicio! 📌' : 'Desfijado del inicio');
    setResults([...results]);
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.categoryLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatResults = results;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-12 md:pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-lg"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-3xl border border-gray-200/60 dark:border-gray-800/60 shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden z-10"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              {searching ? (
                <div className="size-5 border-2 border-gray-300 dark:border-gray-600 border-t-[var(--vibrant-sky-blue)] rounded-full animate-spin shrink-0" />
              ) : (
                <HiOutlineSearch className="text-xl text-gray-400 dark:text-gray-500 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar notas, tareas, fechas, recetas, proyectos..."
                className="flex-1 bg-transparent font-inter text-base text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <HiOutlineX className="text-sm" />
                </button>
              )}
              <button
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-syne font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[62vh] overflow-y-auto scrollbar-none">
              {searching ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="skeleton size-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-3/5 rounded-lg" />
                        <div className="skeleton h-3 w-2/5 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="text-4xl">🔍</div>
                  <p className="font-dm-sans font-bold text-gray-700 dark:text-gray-300">
                    {query ? 'Sin resultados' : 'Empieza a escribir...'}
                  </p>
                  <p className="font-inter text-sm text-gray-400 dark:text-gray-500">
                    {query
                      ? `No se encontró nada para "${query}" en ningún módulo.`
                      : 'Busca en notas, tareas, fechas, recetas y más.'}
                  </p>
                </div>
              ) : (
                <div className="p-3">
                  {Object.entries(grouped).map(([category, items]) => {
                    return (
                      <div key={category} className="mb-4">
                        {/* Category header */}
                        <div className="px-3 py-1.5 mb-1">
                          <span className="font-syne text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            {category} · {items.length}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {items.map(res => {
                            const globalIdx = flatResults.indexOf(res);
                            const pinned = isItemPinned(res.id);
                            const isActive = globalIdx === activeIndex;
                            const IconComp = res.icon;

                            return (
                              <motion.div
                                key={res.id}
                                data-idx={globalIdx}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleSelectResult(res.path)}
                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                className={`group flex items-center justify-between gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Icon */}
                                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${res.badgeColor.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                                    <IconComp className="text-base" />
                                  </div>

                                  {/* Text */}
                                  <div className="min-w-0">
                                    <p className="font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
                                      <Highlight text={res.title} query={query} />
                                    </p>
                                    {res.subtitle && (
                                      <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        <Highlight text={res.subtitle} query={query} />
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={e => handleTogglePin(e, res)}
                                    className={`p-1.5 rounded-xl transition-all ${
                                      pinned
                                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                        : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                    }`}
                                    title={pinned ? 'Desfijar' : 'Fijar en inicio'}
                                  >
                                    <span className="text-sm">{pinned ? '📌' : '📍'}</span>
                                  </button>
                                  <HiOutlineArrowRight className={`text-sm text-gray-300 dark:text-gray-600 transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`} />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-syne font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">↑↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">↵</kbd>
                  Abrir
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px]">ESC</kbd>
                  Cerrar
                </span>
              </div>
              {results.length > 0 && (
                <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {results.length} resultado{results.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
