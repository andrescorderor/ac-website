import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBriefcase,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineMail,
  HiOutlineTrash,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiX,
} from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io';
import { supabase } from '@/lib/supabase';
import { invalidateCache } from '@/lib/cache';
import {
  fetchAllLeads,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_META,
  LeadSource,
  LeadStatus,
  PUBLIC_LEADS_SQL,
  PublicLead,
} from '@/lib/leads';
import { useToast } from '@/components/common/ToastContext';
import CustomSelect from '@/components/common/CustomSelect';
import { useAccessibleModal } from '@/components/common/modals/Modal';

const normalize = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'en_propuesta', label: 'En propuesta' },
  { value: 'ganado', label: 'Ganado' },
  { value: 'descartado', label: 'Descartado' },
];

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos los orígenes' },
  { value: 'contact_modal', label: 'Formulario Contacto' },
  { value: 'diagnostico', label: 'Diagnóstico Digital' },
  { value: 'estimador', label: 'Estimador de Alcance' },
  { value: 'checklist_qa', label: 'Checklist QA' },
  { value: 'asistente_guiado', label: 'Asistente Guiado' },
  { value: 'pagina_servicio', label: 'Página de Servicio' },
  { value: 'manual', label: 'Registro Manual' },
];

export default function Leads() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<PublicLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Detail & Create Modal
  const [activeLead, setActiveLead] = useState<PublicLead | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    service_interest: 'Desarrollo de Software & IA',
    source: 'manual' as LeadSource,
    message: '',
  });

  const detailRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useAccessibleModal(Boolean(activeLead), () => setActiveLead(null), detailRef);
  useAccessibleModal(showCreateModal, () => setShowCreateModal(false), createRef);

  const loadLeads = async () => {
    setLoading(true);
    const { leads: rows, tableMissing: missing } = await fetchAllLeads();
    setLeads(rows);
    setTableMissing(missing);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      nuevos: leads.filter((l) => l.status === 'nuevo').length,
      propuesta: leads.filter((l) => l.status === 'en_propuesta').length,
      ganados: leads.filter((l) => l.status === 'ganado').length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = normalize(searchQuery.trim());
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (!term) return true;
      return (
        normalize(l.full_name).includes(term) ||
        normalize(l.email).includes(term) ||
        normalize(l.company).includes(term) ||
        normalize(l.service_interest).includes(term) ||
        normalize(l.message).includes(term) ||
        normalize(l.notes).includes(term)
      );
    });
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  const handleStatusChange = async (leadId: string, nextStatus: LeadStatus) => {
    const previous = leads;
    setLeads((curr) => curr.map((item) => (item.id === leadId ? { ...item, status: nextStatus } : item)));
    if (activeLead?.id === leadId) {
      setActiveLead((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    }

    try {
      const { error } = await supabase
        .from('public_leads')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
      invalidateCache('leads');
      invalidateCache('search_global');
      invalidateCache('dashboard_stats');
      toast.success(`Estado actualizado a ${LEAD_STATUS_META[nextStatus].label}`);
    } catch {
      setLeads(previous);
      toast.error('No se pudo actualizar el estado del prospecto');
    }
  };

  const handleSaveNotes = async () => {
    if (!activeLead) return;
    setSavingNotes(true);
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from('public_leads')
        .update({ notes: notesDraft.trim() || null, updated_at: updatedAt })
        .eq('id', activeLead.id);
      if (error) throw error;
      setLeads((curr) =>
        curr.map((item) =>
          item.id === activeLead.id ? { ...item, notes: notesDraft.trim() || null, updated_at: updatedAt } : item
        )
      );
      setActiveLead((prev) => (prev ? { ...prev, notes: notesDraft.trim() || null } : prev));
      invalidateCache('leads');
      invalidateCache('search_global');
      toast.success('Notas guardadas');
    } catch {
      toast.error('Error al guardar las notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteLead = async (lead: PublicLead) => {
    setLeads((curr) => curr.filter((item) => item.id !== lead.id));
    if (activeLead?.id === lead.id) setActiveLead(null);

    try {
      const { error } = await supabase.from('public_leads').delete().eq('id', lead.id);
      if (error) throw error;
      invalidateCache('leads');
      invalidateCache('search_global');
      invalidateCache('dashboard_stats');

      toast.undoable(`Prospecto "${lead.full_name}" eliminado`, async () => {
        try {
          const { error: restoreError } = await supabase.from('public_leads').insert([lead]);
          if (restoreError) throw restoreError;
          setLeads((curr) => [lead, ...curr]);
          invalidateCache('leads');
          invalidateCache('search_global');
          toast.success('Prospecto restaurado');
        } catch {
          toast.error('No se pudo restaurar el prospecto');
        }
      });
    } catch {
      setLeads((curr) => [lead, ...curr]);
      toast.error('No se pudo eliminar el prospecto');
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.full_name.trim() || !newForm.email.trim()) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('public_leads')
        .insert([
          {
            full_name: newForm.full_name.trim(),
            email: newForm.email.trim(),
            phone: newForm.phone.trim() || null,
            company: newForm.company.trim() || null,
            service_interest: newForm.service_interest.trim() || 'General',
            source: newForm.source,
            status: 'nuevo',
            message: newForm.message.trim() || null,
            metadata: {},
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) setLeads((curr) => [data as PublicLead, ...curr]);
      invalidateCache('leads');
      invalidateCache('search_global');
      invalidateCache('dashboard_stats');
      setShowCreateModal(false);
      setNewForm({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        service_interest: 'Desarrollo de Software & IA',
        source: 'manual',
        message: '',
      });
      toast.success('Prospecto registrado');
    } catch {
      toast.error('No se pudo registrar el prospecto');
    } finally {
      setCreating(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(PUBLIC_LEADS_SQL);
      setCopiedSql(true);
      toast.success('SQL copiado al portapapeles');
      window.setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      toast.error('No se pudo copiar el SQL');
    }
  };

  const buildWhatsappReplyUrl = (lead: PublicLead) => {
    const cleanDigits = (lead.phone || '').replace(/\D/g, '');
    const target = cleanDigits.length >= 10 ? cleanDigits : '';
    const msg = `Hola ${lead.full_name}, soy Andrés Cordero. Recibí tu solicitud sobre "${lead.service_interest}" desde mi sitio web. ¿Qué horario te funciona mejor para una breve llamada de diagnóstico?`;
    return target
      ? `https://wa.me/${target}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <HiOutlineBriefcase className="text-emerald-600 dark:text-emerald-400" />
            <span>Prospectos CRM</span>
          </h1>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400 mt-1">
            Embudo orgánico conectado al formulario público, diagnóstico interactivo, estimador y asistente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadLeads}
            aria-label="Actualizar prospectos"
            title="Actualizar prospectos"
            className="min-w-[44px] min-h-[44px] px-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <HiOutlineRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={tableMissing}
            className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-2xl bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            <HiOutlinePlus className="text-base" />
            <span>Nuevo Prospecto</span>
          </button>
        </div>
      </div>

      {/* Provisioning Banner if public_leads table is not yet created */}
      {tableMissing && (
        <div className="surface-card rounded-3xl p-5 sm:p-6 border-amber-300/70 dark:border-amber-700/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-syne font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <HiOutlineSparkles className="text-base" />
                Activar tabla en Supabase
              </span>
              <h2 className="font-dm-sans text-lg font-bold text-gray-900 dark:text-white">
                Ejecuta la migración SQL de <code className="font-mono-tech text-sm">public_leads</code>
              </h2>
              <p className="font-inter text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Copia este bloque y ejecútalo una sola vez en tu <strong>Supabase SQL Editor</strong> para habilitar el guardado seguro con RLS. Mientras tanto, tus avisos por EmailJS siguen llegando normalmente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopySql}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {copiedSql ? <HiOutlineCheck className="text-base" /> : <HiOutlineClipboardCopy className="text-base" />}
              <span>{copiedSql ? 'SQL Copiado' : 'Copiar SQL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-gray-950 text-emerald-300 text-[11px] font-mono-tech overflow-x-auto max-h-48">
            {PUBLIC_LEADS_SQL}
          </pre>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Prospectos', val: stats.total, accent: 'text-gray-900 dark:text-white' },
          { label: 'Nuevos', val: stats.nuevos, accent: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'En Propuesta', val: stats.propuesta, accent: 'text-amber-600 dark:text-amber-400' },
          { label: 'Ganados', val: stats.ganados, accent: 'text-violet-600 dark:text-violet-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <span className="font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
              {kpi.label}
            </span>
            <span className={`font-dm-sans text-2xl sm:text-3xl font-bold mt-1 block ${kpi.accent}`}>
              {kpi.val}
            </span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="surface-card rounded-2xl sm:rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo, empresa o servicio..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:border-[var(--vibrant-sky-blue)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-[360px]">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
          />
          <CustomSelect value={sourceFilter} onChange={setSourceFilter} options={SOURCE_OPTIONS} />
        </div>

        <span className="font-mono-tech text-xs text-gray-500 dark:text-gray-400 self-center shrink-0 px-2">
          {filteredLeads.length} / {leads.length}
        </span>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="surface-card rounded-3xl p-10 text-center space-y-3">
          <HiOutlineBriefcase className="text-4xl text-gray-300 dark:text-gray-700 mx-auto" />
          <h3 className="font-dm-sans text-lg font-bold text-gray-900 dark:text-white">
            {leads.length === 0 ? 'Sin prospectos registrados todavía' : 'Sin coincidencias para los filtros'}
          </h3>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {leads.length === 0
              ? 'Cada solicitud desde tu formulario público, diagnóstico, estimador o asistente aparecerá aquí automáticamente.'
              : 'Ajusta el término de búsqueda o restablece los filtros para ver todos los registros.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSourceFilter('all');
              }}
              className="px-4 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const statusMeta = LEAD_STATUS_META[lead.status] || LEAD_STATUS_META.nuevo;
            const score = typeof lead.metadata?.score === 'number' ? lead.metadata.score : null;
            return (
              <div
                key={lead.id}
                className="surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                    </span>
                    {score !== null && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        Score {score}/100
                      </span>
                    )}
                    <span className="font-mono-tech text-[11px] text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLead(lead);
                        setNotesDraft(lead.notes || '');
                      }}
                      className="font-dm-sans text-lg font-bold text-gray-900 dark:text-white hover:text-[var(--vibrant-sky-blue)] text-left transition-colors cursor-pointer"
                    >
                      {lead.full_name}
                    </button>
                    {lead.company && (
                      <span className="font-inter text-xs font-medium text-gray-500 dark:text-gray-400">
                        · {lead.company}
                      </span>
                    )}
                    <span className="font-mono-tech text-xs text-gray-500 dark:text-gray-400">
                      {lead.email}
                    </span>
                  </div>

                  <p className="font-inter text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {lead.service_interest}
                    {lead.message ? ` — ${lead.message.slice(0, 140)}${lead.message.length > 140 ? '…' : ''}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="w-40">
                    <CustomSelect
                      value={lead.status}
                      onChange={(val) => handleStatusChange(lead.id, val as LeadStatus)}
                      options={STATUS_OPTIONS}
                    />
                  </div>

                  <a
                    href={buildWhatsappReplyUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Responder a ${lead.full_name} por WhatsApp`}
                    title="Responder por WhatsApp"
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <IoLogoWhatsapp className="text-lg" />
                  </a>

                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent(`Seguimiento: ${lead.service_interest} — Andrés Cordero`)}`}
                    aria-label={`Enviar correo a ${lead.full_name}`}
                    title="Enviar correo"
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <HiOutlineMail className="text-lg" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveLead(lead);
                      setNotesDraft(lead.notes || '');
                    }}
                    className="px-3 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 font-syne text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Detalle
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteLead(lead)}
                    aria-label={`Eliminar prospecto ${lead.full_name}`}
                    title="Eliminar prospecto"
                    className="min-w-[44px] min-h-[44px] rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <HiOutlineTrash className="text-lg" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal (4-part architecture) */}
      <AnimatePresence>
        {activeLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveLead(null);
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer"
          >
            <motion.div
              ref={detailRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden cursor-default outline-none"
            >
              <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono-tech text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    {LEAD_SOURCE_LABELS[activeLead.source] || activeLead.source}
                  </span>
                  <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white truncate">
                    {activeLead.full_name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLead(null)}
                  aria-label="Cerrar detalle"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center cursor-pointer"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400 block">Correo</span>
                    <span className="font-mono-tech text-xs text-gray-900 dark:text-white break-all">{activeLead.email}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400 block">Teléfono / Empresa</span>
                    <span className="font-inter text-xs text-gray-900 dark:text-white">
                      {activeLead.phone || 'Sin teléfono'}{activeLead.company ? ` · ${activeLead.company}` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 space-y-2">
                  <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-gray-400 block">
                    Servicio y Mensaje
                  </span>
                  <p className="font-dm-sans font-bold text-sm text-gray-900 dark:text-white">
                    {activeLead.service_interest}
                  </p>
                  <p className="font-inter text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {activeLead.message || 'Sin mensaje adicional.'}
                  </p>
                </div>

                {activeLead.metadata && Object.keys(activeLead.metadata).length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
                    <span className="text-[10px] font-syne font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Datos del Diagnóstico / Herramienta
                    </span>
                    <pre className="font-mono-tech text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {JSON.stringify(activeLead.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="lead-notes-input"
                    className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Notas internas de seguimiento
                  </label>
                  <textarea
                    id="lead-notes-input"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Acuerdos de llamada, presupuesto estimado, próximos pasos..."
                    className="w-full min-h-[120px] p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:border-[var(--vibrant-sky-blue)] focus:outline-none resize-y"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveLead(null)}
                  className="px-4 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="px-5 min-h-[44px] rounded-xl bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Manual Lead Modal (4-part architecture) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer"
          >
            <motion.form
              ref={createRef as any}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              onSubmit={handleCreateManualLead}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[88vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden cursor-default outline-none"
            >
              <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-dm-sans text-xl font-bold text-gray-900 dark:text-white">
                  Nuevo Prospecto
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Cerrar"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center cursor-pointer"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.full_name}
                      onChange={(e) => setNewForm((f) => ({ ...f, full_name: e.target.value }))}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Correo *
                    </label>
                    <input
                      type="email"
                      required
                      value={newForm.email}
                      onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newForm.phone}
                      onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={newForm.company}
                      onChange={(e) => setNewForm((f) => ({ ...f, company: e.target.value }))}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Servicio de interés
                  </label>
                  <CustomSelect
                    value={newForm.service_interest}
                    onChange={(val) => setNewForm((f) => ({ ...f, service_interest: val }))}
                    options={[
                      { value: 'Desarrollo de Software & IA', label: 'Desarrollo de Software & IA' },
                      { value: 'Digitalización y Optimización de Procesos', label: 'Digitalización y Optimización de Procesos' },
                      { value: 'Pruebas de Software y QA', label: 'Pruebas de Software y QA' },
                      { value: 'Consultoría Integral', label: 'Consultoría Integral' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-syne font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Contexto / Requerimiento
                  </label>
                  <textarea
                    value={newForm.message}
                    onChange={(e) => setNewForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full min-h-[120px] p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white resize-y"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-syne text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 min-h-[44px] rounded-xl bg-black dark:bg-white text-white dark:text-black font-syne text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Guardar Prospecto'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
