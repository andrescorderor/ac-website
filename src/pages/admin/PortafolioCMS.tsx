import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineDuplicate,
} from 'react-icons/hi';
import { useToast } from '@/components/common/ToastContext';
import {
  PortfolioCmsData,
  CmsProject,
  CmsExperience,
  CmsCertification,
  DEFAULT_CMS_DATA,
  loadPortfolioCms,
  savePortfolioCms,
} from '@/lib/portfolioCms';

type CmsTab = 'projects' | 'experiences' | 'certifications';

const SQL_SNIPPET = `CREATE TABLE IF NOT EXISTS public.portfolio_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read portfolio settings" ON public.portfolio_settings;
CREATE POLICY "Public read portfolio settings" ON public.portfolio_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner manage portfolio settings" ON public.portfolio_settings;
CREATE POLICY "Owner manage portfolio settings" ON public.portfolio_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

const CARD_CLS =
  'bg-white dark:bg-[#111827] rounded-[2rem] p-5 sm:p-6 border border-gray-200/80 dark:border-white/[0.09] shadow-sm space-y-4';
const INPUT_CLS =
  'w-full px-4 min-h-[44px] py-2 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white';
const LABEL_CLS =
  'block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1';

interface CollectionItemHeaderProps {
  label: string;
  index: number;
  visible: boolean;
  onToggleVisible: () => void;
  onRemove: () => void;
}

/** Shared header bar with visibility toggle and undoable delete for portfolio collection cards. */
function CollectionItemHeader({
  label,
  index,
  visible,
  onToggleVisible,
  onRemove,
}: CollectionItemHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-syne text-xs font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)]">
        {label} #{index + 1}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleVisible}
          className={`px-3 min-h-[40px] py-1.5 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
            visible
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {visible ? <HiOutlineEye /> : <HiOutlineEyeOff />}
          <span>{visible ? 'Visible' : 'Oculto'}</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="min-w-[40px] min-h-[40px] p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer flex items-center justify-center"
          title={`Quitar ${label.toLowerCase()}`}
        >
          <HiOutlineTrash />
        </button>
      </div>
    </div>
  );
}

export default function PortafolioCMS() {
  const [cms, setCms] = useState<PortfolioCmsData>(DEFAULT_CMS_DATA);
  const [activeTab, setActiveTab] = useState<CmsTab>('projects');
  const [sourceType, setSourceType] = useState<'public_table' | 'system_store' | 'default'>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      setCms(data);
      setSourceType(source);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { savedPublicTable } = await savePortfolioCms(cms);
      setSourceType(savedPublicTable ? 'public_table' : 'system_store');
      toast.success(
        savedPublicTable
          ? 'Portafolio público actualizado en vivo ✨'
          : 'Cambios guardados en tu panel ✨ (ejecuta el SQL público para reflejarlos a visitantes)'
      );
    } catch (err: any) {
      toast.error('Error al guardar CMS: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateCollectionItem = <K extends CmsTab>(
    key: K,
    idx: number,
    patch: Partial<PortfolioCmsData[K][number]>
  ) => {
    setCms((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  };

  const removeCollectionItem = <K extends CmsTab>(key: K, idx: number, entityName: string) => {
    const prevList = cms[key];
    const removed = prevList[idx] as { title?: string } | undefined;
    setCms((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
    toast.undoable(`${entityName} "${removed?.title || ''}" quitado`, () => {
      setCms((prev) => ({ ...prev, [key]: prevList }));
    });
  };

  const handleAddCurrent = () => {
    if (activeTab === 'projects') {
      const newProj: CmsProject = {
        id: `proj_${Date.now()}`,
        title: 'Nuevo Proyecto',
        description: 'Descripción concisa de arquitectura, stack e impacto logrado.',
        tags: ['React', 'TypeScript'],
        image: '/assets/projects-section/Project1.jpg',
        visible: true,
      };
      setCms((prev) => ({ ...prev, projects: [...prev.projects, newProj] }));
      return;
    }

    if (activeTab === 'experiences') {
      const newExp: CmsExperience = {
        id: `exp_${Date.now()}`,
        year: '2025 - Presente',
        title: 'Nuevo Rol / Experiencia',
        company: 'Organización',
        description: 'Responsabilidades clave, arquitectura y resultados alcanzados.',
        visible: true,
      };
      setCms((prev) => ({ ...prev, experiences: [...prev.experiences, newExp] }));
      return;
    }

    const newCert: CmsCertification = {
      id: `cert_${Date.now()}`,
      title: 'Nueva Certificación',
      subtitle: 'Institución • Emisor',
      link: 'https://',
      visible: true,
    };
    setCms((prev) => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SNIPPET);
      toast.success('SQL copiado. Pégalo en Supabase SQL Editor para publicar cambios en vivo.');
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    );
  }

  const addButtonLabels: Record<CmsTab, string> = {
    projects: 'Añadir Proyecto',
    experiences: 'Añadir Experiencia',
    certifications: 'Añadir Certificación',
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Mini-CMS <span className="text-gradient">Portafolio</span>
          </h1>
          <p className="font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-xs sm:text-sm">
            Administra las colecciones dinámicas de tu portafolio público (proyectos, experiencia y certificaciones) sin modificar código.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/"
            target="_blank"
            className="px-4 min-h-[44px] py-2.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/[0.09] text-gray-800 dark:text-gray-100 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <span>Ver Portafolio</span>
            <HiOutlineExternalLink className="text-base" />
          </Link>

          <button
            type="button"
            onClick={handleCopySql}
            title="Copiar script SQL para habilitar lectura pública en portfolio_settings"
            className="px-4 min-h-[44px] py-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <HiOutlineDuplicate />
            <span>{sourceType === 'public_table' ? 'Tabla Pública Activa ✓' : 'Copiar SQL Público'}</span>
          </button>
        </div>
      </header>

      {/* Collection Tabs + Add CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'projects' as const, label: `Proyectos (${cms.projects.length})` },
            { id: 'experiences' as const, label: `Experiencia (${cms.experiences.length})` },
            { id: 'certifications' as const, label: `Certificaciones (${cms.certifications.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-5 min-h-[44px] py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/[0.09] hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCurrent}
          className="px-4 sm:px-5 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <HiOutlinePlus className="text-base" />
          <span>{addButtonLabels[activeTab]}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {cms.projects.length === 0 ? (
              <div className={`${CARD_CLS} text-center py-10 text-gray-500 dark:text-gray-400 font-inter text-sm`}>
                No hay proyectos registrados en tu portafolio.
              </div>
            ) : (
              cms.projects.map((proj, idx) => (
                <div key={proj.id} className={CARD_CLS}>
                  <CollectionItemHeader
                    label="Proyecto"
                    index={idx}
                    visible={proj.visible}
                    onToggleVisible={() => updateCollectionItem('projects', idx, { visible: !proj.visible })}
                    onRemove={() => removeCollectionItem('projects', idx, 'Proyecto')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Título</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => updateCollectionItem('projects', idx, { title: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Ruta de Imagen / URL</label>
                      <input
                        type="text"
                        value={proj.image}
                        onChange={(e) => updateCollectionItem('projects', idx, { image: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Descripción</label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => updateCollectionItem('projects', idx, { description: e.target.value })}
                      className="w-full p-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[84px]"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Tecnologías / Tags (separados por coma)</label>
                    <input
                      type="text"
                      value={proj.tags.join(', ')}
                      onChange={(e) =>
                        updateCollectionItem('projects', idx, {
                          tags: e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'experiences' && (
          <div className="space-y-4">
            {cms.experiences.length === 0 ? (
              <div className={`${CARD_CLS} text-center py-10 text-gray-500 dark:text-gray-400 font-inter text-sm`}>
                No hay experiencias registradas en tu portafolio.
              </div>
            ) : (
              cms.experiences.map((exp, idx) => (
                <div key={exp.id} className={CARD_CLS}>
                  <CollectionItemHeader
                    label="Experiencia"
                    index={idx}
                    visible={exp.visible}
                    onToggleVisible={() => updateCollectionItem('experiences', idx, { visible: !exp.visible })}
                    onRemove={() => removeCollectionItem('experiences', idx, 'Experiencia')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Período / Año</label>
                      <input
                        type="text"
                        placeholder="Ej. 2024 - Presente"
                        value={exp.year}
                        onChange={(e) => updateCollectionItem('experiences', idx, { year: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Cargo / Título</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateCollectionItem('experiences', idx, { title: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Empresa / Institución</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateCollectionItem('experiences', idx, { company: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Descripción</label>
                    <textarea
                      rows={3}
                      value={exp.description}
                      onChange={(e) => updateCollectionItem('experiences', idx, { description: e.target.value })}
                      className="w-full p-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[var(--vibrant-sky-blue)] font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[84px]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-4">
            {cms.certifications.length === 0 ? (
              <div className={`${CARD_CLS} text-center py-10 text-gray-500 dark:text-gray-400 font-inter text-sm`}>
                No hay certificaciones registradas en tu portafolio.
              </div>
            ) : (
              cms.certifications.map((cert, idx) => (
                <div key={cert.id} className={CARD_CLS}>
                  <CollectionItemHeader
                    label="Certificación"
                    index={idx}
                    visible={cert.visible}
                    onToggleVisible={() =>
                      updateCollectionItem('certifications', idx, { visible: !cert.visible })
                    }
                    onRemove={() => removeCollectionItem('certifications', idx, 'Certificación')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Título de la Certificación</label>
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => updateCollectionItem('certifications', idx, { title: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Plataforma / Institución</label>
                      <input
                        type="text"
                        placeholder="Ej. edX • AWS"
                        value={cert.subtitle}
                        onChange={(e) =>
                          updateCollectionItem('certifications', idx, { subtitle: e.target.value })
                        }
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Enlace de Verificación (URL)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={cert.link}
                      onChange={(e) => updateCollectionItem('certifications', idx, { link: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 min-h-[48px] py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <HiOutlineCheck className="text-base" />
            <span>{saving ? 'Publicando...' : 'Guardar Cambios del Portafolio'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
