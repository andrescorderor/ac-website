import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { togglePinItem, isItemPinned } from '@/lib/pinned';
import { 
  HiOutlineSearch as SearchIcon, 
  HiOutlineX as CloseIcon,
  HiOutlineDocumentText, 
  HiOutlineCalendar, 
  HiOutlineClipboardList, 
  HiOutlineUserGroup, 
  HiOutlineLockClosed, 
  HiOutlineShoppingBag
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

type SearchResult = {
  id: string;
  type: 'note' | 'task' | 'debt' | 'vault' | 'shopping' | 'reminder';
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
  categoryLabel: string;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      searchAll('');
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) searchAll(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const searchAll = async (searchTerm: string) => {
    setSearching(true);
    const term = searchTerm.toLowerCase().trim();

    try {
      const [nts, rem, tsk, dbt, vlt, shp] = await Promise.all([
        supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('debts').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('vault_items').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('shopping_list').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const items: SearchResult[] = [];

      // Notes
      nts.data?.forEach((n) => {
        if (!term || n.title.toLowerCase().includes(term) || (n.content && n.content.toLowerCase().includes(term))) {
          items.push({
            id: n.id,
            type: 'note',
            title: n.title,
            subtitle: n.category ? `Categoría: ${n.category}` : n.content?.slice(0, 60),
            path: '/admin/panel/notas',
            icon: HiOutlineDocumentText,
            categoryLabel: 'Nota',
          });
        }
      });

      // Reminders
      rem.data?.forEach((r) => {
        if (!term || r.title.toLowerCase().includes(term) || (r.category && r.category.toLowerCase().includes(term))) {
          items.push({
            id: r.id,
            type: 'reminder',
            title: r.title,
            subtitle: `Fecha: ${r.date || r.event_date || 'Sin fecha'}${r.time ? ` - ${r.time} hrs` : ''}`,
            path: '/admin/panel/recordatorios',
            icon: HiOutlineCalendar,
            categoryLabel: 'Recordatorio',
          });
        }
      });

      // Tasks
      tsk.data?.forEach((t) => {
        if (!term || t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term))) {
          items.push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: t.completed ? 'Estado: Completada' : t.due_date ? `Vence: ${t.due_date}` : 'Pendiente',
            path: '/admin/panel/pendientes',
            icon: HiOutlineClipboardList,
            categoryLabel: 'Tarea',
          });
        }
      });

      // Debts
      dbt.data?.forEach((d) => {
        if (!term || d.debtor_name.toLowerCase().includes(term) || (d.concept && d.concept.toLowerCase().includes(term))) {
          items.push({
            id: d.id,
            type: 'debt',
            title: `${d.debtor_name} ($${d.amount})`,
            subtitle: d.concept ? `Concepto: ${d.concept}` : d.settled ? 'Estado: Cobrado' : 'Estado: Pendiente',
            path: '/admin/panel/deudas',
            icon: HiOutlineUserGroup,
            categoryLabel: 'Cuenta por Cobrar',
          });
        }
      });

      // Vault
      vlt.data?.forEach((v) => {
        if (!term || v.title.toLowerCase().includes(term) || (v.content && v.content.toLowerCase().includes(term))) {
          items.push({
            id: v.id,
            type: 'vault',
            title: v.title,
            subtitle: v.content,
            path: '/admin/panel/vault',
            icon: HiOutlineLockClosed,
            categoryLabel: 'Bóveda',
          });
        }
      });

      // Shopping List
      shp.data?.forEach((s) => {
        if (!term || s.name.toLowerCase().includes(term) || (s.location && s.location.toLowerCase().includes(term))) {
          items.push({
            id: s.id,
            type: 'shopping',
            title: s.name,
            subtitle: `${s.bought ? 'Comprado' : 'Por Comprar'}${s.location ? ` @ ${s.location}` : ''}`,
            path: '/admin/panel/compras',
            icon: HiOutlineShoppingBag,
            categoryLabel: 'Compra',
          });
        }
      });

      setResults(items);
    } catch (err) {
      console.error('Error en búsqueda global:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleTogglePin = (e: React.MouseEvent, res: SearchResult) => {
    e.stopPropagation();
    const isNowPinned = togglePinItem({
      id: res.id,
      type: res.type,
      title: res.title,
      subtitle: res.subtitle,
      path: res.path,
    });

    if (isNowPinned) {
      toast.success('¡Elemento fijado en el inicio! 📌');
    } else {
      toast.info('Elemento desfijado del inicio');
    }
    // Force re-render result items
    setResults([...results]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 gap-4">
              <SearchIcon className="text-xl text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en todo el panel (Notas, Fechas, Tareas, Deudas, Bóveda...)"
                className="w-full bg-transparent text-sm md:text-base font-inter text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-all"
              >
                <CloseIcon className="text-lg" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 scrollbar-thin">
              {searching ? (
                <div className="p-8 text-center text-xs font-syne uppercase tracking-widest text-gray-400">
                  Buscando en todo el panel...
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-sm font-inter text-gray-400 dark:text-gray-500">
                  {query ? 'No se encontraron resultados para tu búsqueda.' : 'Escribe para buscar...'}
                </div>
              ) : (
                results.map((res) => {
                  const pinned = isItemPinned(res.id);
                  const IconComp = res.icon;
                  return (
                    <div
                      key={res.id}
                      onClick={() => handleSelectResult(res.path)}
                      className="group p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                          <IconComp className="text-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-dm-sans font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {res.title}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200/60 dark:bg-gray-700/60 text-[9px] font-syne font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 rounded-full shrink-0">
                              {res.categoryLabel}
                            </span>
                          </div>
                          {res.subtitle && (
                            <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {res.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleTogglePin(e, res)}
                        className={`p-2 rounded-xl transition-all ${
                          pinned 
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                            : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        title={pinned ? 'Desfijar del inicio' : 'Fijar en la página principal'}
                      >
                        {pinned ? '📌' : '📍'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-syne font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-6">
              <span>Consejo: Presiona <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[10px]">Ctrl + K</kbd> en cualquier pantalla</span>
              <span>ESC para cerrar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
