import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineExclamation,
  HiX,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import {
  TrashItem,
  getTrashItems,
  restoreFromTrash,
  deletePermanentlyFromTrash,
  emptyTrash,
} from '@/lib/trash';

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function daysUntilExpiration(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Papelera() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    setLoading(true);
    const data = await getTrashItems();
    setItems(data);
    setLoading(false);
  };

  const types = useMemo(() => {
    const set = new Set<string>(items.map((i) => i.entityLabel));
    return ['Todos', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const norm = normalize(searchTerm.trim());
    return items.filter((item) => {
      const matchesType = typeFilter === 'Todos' || item.entityLabel === typeFilter;
      const matchesSearch =
        !norm ||
        normalize(item.title).includes(norm) ||
        normalize(item.subtitle).includes(norm) ||
        normalize(item.entityLabel).includes(norm);
      return matchesType && matchesSearch;
    });
  }, [items, searchTerm, typeFilter]);

  const handleRestore = async (item: TrashItem) => {
    setRestoringId(item.trashId);
    try {
      await restoreFromTrash(item.trashId);
      setItems((prev) => prev.filter((i) => i.trashId !== item.trashId));
      toast.success(`"${item.title}" restaurado en ${item.entityLabel} ↩️`);
    } catch (err: any) {
      toast.error('Error al restaurar: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeletePermanent = async (trashId: string) => {
    const remaining = await deletePermanentlyFromTrash(trashId);
    setItems(remaining);
    toast.info('Elemento eliminado definitivamente.');
  };

  const handleConfirmEmpty = async () => {
    await emptyTrash();
    setItems([]);
    setShowEmptyConfirm(false);
    toast.success('Papelera vaciada correctamente.');
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="skeleton h-10 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Papelera de <span className="text-gradient">Reciclaje</span>
          </h1>
          <p className="font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Recupera registros eliminados hasta por 30 días sin ocupar almacenamiento extra.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTrash}
            className="min-w-[44px] min-h-[44px] p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 cursor-pointer flex items-center justify-center"
            title="Actualizar papelera"
          >
            <HiOutlineRefresh className="text-lg" />
          </button>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowEmptyConfirm(true)}
              className="px-4 min-h-[44px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <HiOutlineTrash />
              <span>Vaciar Papelera</span>
            </button>
          )}
        </div>
      </header>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar en papelera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 min-h-[44px] py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none font-inter text-sm text-gray-900 dark:text-white"
          />
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-4 min-h-[40px] py-2 rounded-2xl text-[11px] font-syne font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                typeFilter === t
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center shadow-sm space-y-2">
          <p className="font-dm-sans text-lg font-bold text-gray-700 dark:text-gray-200">
            Papelera vacía
          </p>
          <p className="font-inter text-sm text-gray-400">
            Los elementos que elimines en los módulos aparecerán aquí por 30 días.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.trashId}
              className="p-4 sm:p-5 bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 font-syne text-[10px] font-bold uppercase tracking-wider">
                    {item.entityLabel}
                  </span>
                  <span className="font-syne text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Expira en {daysUntilExpiration(item.expiresAt)} días
                  </span>
                </div>
                <h3 className="font-dm-sans font-bold text-base text-gray-900 dark:text-white truncate">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={restoringId === item.trashId}
                  onClick={() => handleRestore(item)}
                  className="px-4 min-h-[44px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-syne text-xs font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                >
                  {restoringId === item.trashId ? 'Restaurando...' : 'Restaurar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePermanent(item.trashId)}
                  className="min-w-[44px] min-h-[44px] p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer flex items-center justify-center"
                  title="Eliminar permanentemente"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Empty Trash Confirmation Modal (Rule 0.3: zero window.confirm) */}
      {createPortal(
        <AnimatePresence>
          {showEmptyConfirm && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowEmptyConfirm(false);
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden cursor-default flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <div className="flex items-center gap-2.5 text-rose-500">
                    <HiOutlineExclamation className="text-2xl" />
                    <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                      Vaciar Papelera
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(false)}
                    className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-center"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                  <p className="font-inter text-sm text-gray-600 dark:text-gray-300">
                    Se eliminarán definitivamente {items.length} elementos archivados. Esta acción no se puede deshacer.
                  </p>
                </div>

                <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(false)}
                    className="px-5 min-h-[44px] py-2.5 font-syne text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEmpty}
                    className="px-6 min-h-[44px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-syne text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Confirmar Vaciar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
