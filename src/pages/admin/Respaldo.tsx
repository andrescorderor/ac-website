import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineDatabase,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineExternalLink,
  HiOutlineColorSwatch,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineBookmark,
  HiX,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';

// Las 15 tablas activas del ecosistema Supabase
const SYSTEM_TABLES = [
  { id: 'finance_salary', label: 'Salario / Presupuesto', icon: HiOutlineCurrencyDollar, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40' },
  { id: 'finance_expenses', label: 'Historial de Gastos', icon: HiOutlineCurrencyDollar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40' },
  { id: 'tasks', label: 'Tareas y Pendientes', icon: HiOutlineClipboardList, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40' },
  { id: 'debts', label: 'Deudas (Cobros y Pagos)', icon: HiOutlineUserGroup, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40' },
  { id: 'vault_items', label: 'Bóveda de Textos', icon: HiOutlineLockClosed, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40' },
  { id: 'shopping_list', label: 'Mandado y Compras', icon: HiOutlineShoppingBag, color: 'text-green-500 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40' },
  { id: 'reminders', label: 'Fechas y Recordatorios', icon: HiOutlineCalendar, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/40' },
  { id: 'notes', label: 'Notas y Rutinas Gym', icon: HiOutlineDocumentText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40' },
  { id: 'bookmarks', label: 'Enlaces Rápidos', icon: HiOutlineExternalLink, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40' },
  { id: 'creative_projects', label: 'Proyectos Creativos', icon: HiOutlineColorSwatch, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40' },
  { id: 'monthly_checklist_items', label: 'Hábitos (Catálogo)', icon: HiOutlineCheckCircle, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40' },
  { id: 'monthly_checklist_logs', label: 'Hábitos (Historial Log)', icon: HiOutlineCheckCircle, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800/60' },
  { id: 'recipes', label: 'Recetario Fitness', icon: HiOutlineBookOpen, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40' },
  { id: 'plants', label: 'Mis Plantas y Riegos', icon: HiOutlineSparkles, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60' },
  { id: 'user_pinned_items', label: 'Elementos Fijados (Pins)', icon: HiOutlineBookmark, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60' },
] as const;

interface BackupFilePayload {
  version?: string;
  app?: string;
  exported_at: string;
  user_email?: string;
  total_records?: number;
  tables: Record<string, any[]>;
}

interface RestoreProgress {
  table: string;
  total: number;
  restored: number;
  status: 'pending' | 'running' | 'success' | 'error';
  errorMessage?: string;
}

export default function Respaldo() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de métricas
  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  // Estados de exportación
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Estados de importación / restauración
  const [parsedBackup, setParsedBackup] = useState<BackupFilePayload | null>(null);
  const [backupFileName, setBackupFileName] = useState<string>('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress[]>([]);
  const [restoreComplete, setRestoreComplete] = useState(false);

  useEffect(() => {
    fetchTableCounts();
  }, []);

  const fetchTableCounts = async () => {
    setLoadingStats(true);
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        SYSTEM_TABLES.map(async (t) => {
          try {
            const { count, error } = await supabase
              .from(t.id)
              .select('*', { count: 'exact', head: true });
            counts[t.id] = error ? 0 : count || 0;
          } catch {
            counts[t.id] = 0;
          }
        })
      );
      setTableStats(counts);
    } catch (err: any) {
      toast.error('Error al consultar métricas de la base de datos');
    } finally {
      setLoadingStats(false);
    }
  };

  const totalRecordsInDB = Object.values(tableStats).reduce((acc, c) => acc + c, 0);

  // ══════════════════════════════════════════════════════════
  // EXPORTACIÓN TOTAL JSON (15 Tablas + Schema de Restauración)
  // ══════════════════════════════════════════════════════════
  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesión no válida o expirada');
        return;
      }

      // Consultar en paralelo las 15 tablas completas
      const tablePromises = SYSTEM_TABLES.map(t =>
        supabase.from(t.id).select('*').then(res => ({ id: t.id, data: res.data || [] }))
      );
      const results = await Promise.all(tablePromises);

      const tablesMap: Record<string, any[]> = {};
      let totalItems = 0;

      results.forEach(res => {
        tablesMap[res.id] = res.data;
        totalItems += res.data.length;
      });

      const backupObj: BackupFilePayload = {
        app: 'Andrés Cordero • Personal OS',
        version: '6.21.0',
        exported_at: new Date().toISOString(),
        user_email: user.email || 'andres@example.com',
        total_records: totalItems,
        tables: tablesMap,
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `respaldo_completo_andres_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Respaldo descargado: ${totalItems} registros exportados con éxito`);
    } catch (err: any) {
      toast.error('Error al generar respaldo JSON: ' + (err.message || 'Error desconocido'));
    } finally {
      setExportingJson(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // EXPORTACIÓN REPORTE MULTITABLA CSV
  // ══════════════════════════════════════════════════════════
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const [exp, tsk, shp, rem, dbt, nts] = await Promise.all([
        supabase.from('finance_expenses').select('*'),
        supabase.from('tasks').select('title, priority, due_date, completed'),
        supabase.from('shopping_list').select('name, location, price, bought, quantity'),
        supabase.from('reminders').select('title, category, date, time'),
        supabase.from('debts').select('debtor_name, amount, concept, type, settled'),
        supabase.from('notes').select('title, category, content'),
      ]);

      let csv = '=== GASTOS Y FINANZAS ===\nFecha,Concepto,Categoria,Monto\n';
      exp.data?.forEach(e => {
        const itemDate = (e as any).date || (e.created_at ? e.created_at.split('T')[0] : '');
        csv += `"${itemDate}","${(e.concept || '').replace(/"/g, '""')}","${e.category || ''}",${e.amount}\n`;
      });

      csv += '\n=== TAREAS Y PENDIENTES ===\nTitulo,Prioridad,Fecha Limite,Completada\n';
      tsk.data?.forEach(t => {
        csv += `"${(t.title || '').replace(/"/g, '""')}","${t.priority || ''}","${t.due_date || ''}",${t.completed ? 'SI' : 'NO'}\n`;
      });

      csv += '\n=== MANDADO Y COMPRAS ===\nProducto,Tienda/Pasillo,Precio,Comprado,Cantidad\n';
      shp.data?.forEach(s => {
        csv += `"${(s.name || '').replace(/"/g, '""')}","${s.location || ''}",${s.price || 0},${s.bought ? 'SI' : 'NO'},${s.quantity || 1}\n`;
      });

      csv += '\n=== RECORDATORIOS Y FECHAS ===\nTitulo,Categoria,Fecha,Hora\n';
      rem.data?.forEach(r => {
        csv += `"${(r.title || '').replace(/"/g, '""')}","${r.category || ''}","${r.date || ''}","${r.time || ''}"\n`;
      });

      csv += '\n=== DEUDAS Y COBROS ===\nPersona/Entidad,Monto,Concepto,Tipo,Saldada\n';
      dbt.data?.forEach(d => {
        csv += `"${(d.debtor_name || '').replace(/"/g, '""')}",${d.amount},"${(d.concept || '').replace(/"/g, '""')}","${d.type || 'receivable'}",${d.settled ? 'SI' : 'NO'}\n`;
      });

      csv += '\n=== NOTAS GENERALES ===\nTitulo,Categoria,Contenido\n';
      nts.data?.filter(n => !n.category?.startsWith('Fitness_Routine_Data:')).forEach(n => {
        csv += `"${(n.title || '').replace(/"/g, '""')}","${n.category || ''}","${(n.content || '').replace(/"/g, '""').slice(0, 300)}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `reporte_tablas_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Reporte CSV generado y descargado correctamente');
    } catch (err: any) {
      toast.error('Error al generar CSV: ' + (err.message || 'Error desconocido'));
    } finally {
      setExportingCsv(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PROCESAMIENTO DEL ARCHIVO JSON SELECCIONADO
  // ══════════════════════════════════════════════════════════
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupFilePayload;

        if (!parsed || typeof parsed !== 'object' || !parsed.tables) {
          toast.error('El archivo no contiene un formato de respaldo válido de la app');
          return;
        }

        setParsedBackup(parsed);
        setShowRestoreModal(true);
        setRestoreComplete(false);
      } catch (err: any) {
        toast.error('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    // Resetear valor para permitir seleccionar el mismo archivo si es necesario
    e.target.value = '';
  };

  // ══════════════════════════════════════════════════════════
  // MOTOR DE RESTAURACIÓN RESILIENTE EN SUPABASE
  // ══════════════════════════════════════════════════════════
  const executeRestore = async () => {
    if (!parsedBackup || !parsedBackup.tables) return;

    setRestoring(true);
    setRestoreComplete(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesión no válida o expirada');
        setRestoring(false);
        return;
      }

      const activeUser = user.id;

      // Tablas a restaurar que existan en el payload
      const tablesInPayload = Object.keys(parsedBackup.tables);
      const initialProgress: RestoreProgress[] = tablesInPayload.map((tbl) => ({
        table: tbl,
        total: Array.isArray(parsedBackup.tables[tbl]) ? parsedBackup.tables[tbl].length : 0,
        restored: 0,
        status: 'pending',
      }));

      setRestoreProgress(initialProgress);

      for (let i = 0; i < tablesInPayload.length; i++) {
        const tableName = tablesInPayload[i];
        const rows: any[] = parsedBackup.tables[tableName] || [];

        setRestoreProgress(prev =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'running' } : p))
        );

        if (rows.length === 0) {
          setRestoreProgress(prev =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'success', restored: 0 } : p))
          );
          continue;
        }

        try {
          // Reasignar el user_id al usuario actual para garantizar RLS
          const sanitizedRows = rows.map((r) => {
            const copy = { ...r };
            if ('user_id' in copy || tableName !== 'user_pinned_items') {
              copy.user_id = activeUser;
            }
            return copy;
          });

          // Insertar en lotes de 50 para evitar exceder límites de payload
          const batchSize = 50;
          let tableRestoredCount = 0;

          for (let b = 0; b < sanitizedRows.length; b += batchSize) {
            const batch = sanitizedRows.slice(b, b + batchSize);
            const { error } = await supabase.from(tableName).upsert(batch, {
              onConflict: tableName === 'finance_salary' ? 'user_id' : 'id',
              ignoreDuplicates: false,
            });

            if (error) {
              // Si falla por foreign key o columna ausente, intentar insert simple ignorando conflictos
              const fallback = await supabase.from(tableName).insert(batch);
              if (fallback.error) {
                throw new Error(error.message);
              }
            }
            tableRestoredCount += batch.length;

            setRestoreProgress(prev =>
              prev.map((p, idx) => (idx === i ? { ...p, restored: tableRestoredCount } : p))
            );
          }

          setRestoreProgress(prev =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'success', restored: tableRestoredCount } : p))
          );
        } catch (tableErr: any) {
          console.warn(`Error al restaurar tabla ${tableName}:`, tableErr);
          setRestoreProgress(prev =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', errorMessage: tableErr.message || 'Error en inserción' }
                : p
            )
          );
        }
      }

      setRestoreComplete(true);
      toast.success('Restauración completada. Se actualizaron los datos en la base de datos');
      fetchTableCounts();
    } catch (err: any) {
      toast.error('Error general durante la restauración: ' + (err.message || 'Error desconocido'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ═══ Header de la Vista ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-gradient-to-tr from-[var(--vibrant-sky-blue)] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <HiOutlineDatabase className="text-3xl" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-syne font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white tracking-tight">
                Respaldo & Recuperación
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-syne font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                15 Tablas
              </span>
            </div>
            <p className="font-inter text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Centro de copias de seguridad completas y restauración de emergencia en caso de pérdida de datos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchTableCounts}
            disabled={loadingStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-syne text-xs font-bold uppercase tracking-wider min-h-[44px] cursor-pointer"
            title="Recargar conteo de registros"
          >
            <HiOutlineRefresh className={`text-base ${loadingStats ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ═══ Banner de Seguridad y Recuperación ═══ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-200/50 dark:border-sky-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-[var(--vibrant-sky-blue)] shrink-0 mt-0.5">
            <HiOutlineShieldCheck className="text-2xl" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-sm sm:text-base text-gray-900 dark:text-white">
              Garantía de Recuperación Total
            </h2>
            <p className="font-inter text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
              El archivo JSON generado contiene el 100% de tus datos (gastos, salarios, notas, deudas, mandado, bóveda, recetas, hábitos y plantas). Si la base de datos se pierde o se migra de proyecto, basta con subir tu copia aquí para restaurar todo en segundos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={exportingJson}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-syne text-xs font-bold uppercase tracking-wider min-h-[44px] shadow-lg shadow-black/10 dark:shadow-white/10 cursor-pointer"
          >
            <HiOutlineDownload className={`text-lg ${exportingJson ? 'animate-bounce' : ''}`} />
            <span>{exportingJson ? 'Exportando...' : 'Descargar JSON'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all font-syne text-xs font-bold uppercase tracking-wider min-h-[44px] shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <HiOutlineUpload className="text-lg" />
            <span>Restaurar Copia</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* ═══ Acciones Rápidas de Exportación ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Copia Total JSON */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-100 dark:border-blue-900/40">
                <HiOutlineDownload />
              </div>
              <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
                100% Recuperable
              </span>
            </div>
            <div>
              <h3 className="font-syne font-bold text-base text-gray-900 dark:text-white">
                Copia Maestra Total (JSON)
              </h3>
              <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Snapshot íntegro de las 15 tablas en formato crudo para recuperación ante desastres y restauración de base de datos.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="font-inter text-xs text-gray-400 dark:text-gray-500">
              {loadingStats ? 'Calculando...' : `${totalRecordsInDB.toLocaleString()} registros en BD`}
            </span>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={exportingJson}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-syne text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer"
            >
              {exportingJson ? 'Generando...' : 'Descargar JSON'}
            </button>
          </div>
        </div>

        {/* Card 2: Reporte Excel CSV */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-100 dark:border-emerald-900/40">
                <HiOutlineDocumentText />
              </div>
              <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                Visualización Tabular
              </span>
            </div>
            <div>
              <h3 className="font-syne font-bold text-base text-gray-900 dark:text-white">
                Reporte Consolidado (CSV)
              </h3>
              <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Exporta gastos, pendientes, compras, recordatorios, deudas y notas ordenados en texto delimitado para abrir en Microsoft Excel o Google Sheets.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="font-inter text-xs text-gray-400 dark:text-gray-500">
              Formato UTF-8
            </span>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-syne text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer"
            >
              {exportingCsv ? 'Generando...' : 'Descargar CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Desglose en Vivo de las 15 Tablas ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white">
              Estado de Tablas en Supabase
            </h3>
            <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
              Monitoreo reactivo de cada entidad registrada en la base de datos de producción.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-inter text-gray-500 dark:text-gray-400">Total global:</span>
            <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-dm-sans font-bold text-sm">
              {loadingStats ? '...' : totalRecordsInDB.toLocaleString()} registros
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SYSTEM_TABLES.map((table) => {
            const count = tableStats[table.id] ?? 0;
            const Icon = table.icon;
            return (
              <div
                key={table.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${table.color}`}>
                    <Icon className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-dm-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {table.label}
                    </p>
                    <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500 truncate">
                      {table.id}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-dm-sans font-bold text-xs">
                    {loadingStats ? '...' : count.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Modal de Restauración / Importación (4 Partes) ═══ */}
      <AnimatePresence>
        {showRestoreModal && parsedBackup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget && !restoring) {
                setShowRestoreModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[88vh] overflow-hidden"
            >
              {/* 1. Cabecera Fija */}
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                    <HiOutlineUpload />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                      Restauración de Base de Datos
                    </h3>
                    <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                      Archivo: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{backupFileName}</span>
                    </p>
                  </div>
                </div>

                {!restoring && (
                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  >
                    <HiX className="text-xl" />
                  </button>
                )}
              </div>

              {/* 2. Cuerpo Scrollable */}
              <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-4">
                {/* Resumen del Archivo */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-inter">
                    <span className="text-gray-500 dark:text-gray-400">Versión del Respaldo:</span>
                    <span className="font-dm-sans font-bold text-gray-900 dark:text-white">
                      {parsedBackup.version || 'Desconocida'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-inter">
                    <span className="text-gray-500 dark:text-gray-400">Fecha de Creación:</span>
                    <span className="font-dm-sans font-bold text-gray-900 dark:text-white">
                      {parsedBackup.exported_at ? new Date(parsedBackup.exported_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-inter">
                    <span className="text-gray-500 dark:text-gray-400">Tablas Detectadas:</span>
                    <span className="font-dm-sans font-bold text-emerald-600 dark:text-emerald-400">
                      {Object.keys(parsedBackup.tables || {}).length} tablas
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-inter">
                    <span className="text-gray-500 dark:text-gray-400">Total de Registros en Archivo:</span>
                    <span className="font-dm-sans font-bold text-blue-600 dark:text-blue-400">
                      {Object.values(parsedBackup.tables || {}).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0)} registros
                    </span>
                  </div>
                </div>

                {/* Advertencia preventiva */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
                  <HiOutlineExclamation className="text-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="font-inter text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    La restauración utiliza <strong className="font-bold">Upsert Inteligente</strong>. Los registros existentes se actualizarán con los valores del archivo y los que no existan se insertarán limpiamente, asignándolos a tu cuenta activa.
                  </p>
                </div>

                {/* Progreso de Restauración por Tabla */}
                {restoreProgress.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Progreso de Inserción
                    </h4>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {restoreProgress.map((p) => (
                        <div
                          key={p.table}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {p.status === 'success' && <HiOutlineCheck className="text-emerald-500 text-base shrink-0" />}
                            {p.status === 'running' && <HiOutlineRefresh className="text-blue-500 text-base animate-spin shrink-0" />}
                            {p.status === 'error' && <HiOutlineExclamation className="text-red-500 text-base shrink-0" />}
                            {p.status === 'pending' && <div className="size-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0 ml-1 mr-1" />}
                            <span className="font-mono text-gray-800 dark:text-gray-200 truncate">{p.table}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-dm-sans font-bold text-gray-600 dark:text-gray-300">
                              {p.restored} / {p.total}
                            </span>
                            {p.errorMessage && (
                              <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={p.errorMessage}>
                                {p.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Pie Fijo */}
              <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRestoreModal(false)}
                  disabled={restoring}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 font-syne text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-h-[44px] cursor-pointer disabled:opacity-50"
                >
                  {restoreComplete ? 'Cerrar' : 'Cancelar'}
                </button>

                {!restoreComplete ? (
                  <button
                    type="button"
                    onClick={executeRestore}
                    disabled={restoring}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-syne text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineUpload className={`text-base ${restoring ? 'animate-bounce' : ''}`} />
                    <span>{restoring ? 'Restaurando...' : 'Confirmar e Iniciar'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestoreModal(false);
                      window.location.reload();
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-syne text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <HiOutlineRefresh className="text-base" />
                    <span>Recargar Aplicación</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
