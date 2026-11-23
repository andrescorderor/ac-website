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
  DEFAULT_CMS_DATA,
  loadPortfolioCms,
  savePortfolioCms,
} from '@/lib/portfolioCms';

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

export default function PortafolioCMS() {
  const [cms, setCms] = useState<PortfolioCmsData>(DEFAULT_CMS_DATA);
  const [phrasesInput, setPhrasesInput] = useState('');
  const [activeTab, setActiveTab] = useState<'hero' | 'projects'>('hero');
  const [sourceType, setSourceType] = useState<'public_table' | 'system_store' | 'default'>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadPortfolioCms().then(({ data, source }) => {
      setCms(data);
      setPhrasesInput((data.heroPhrases || []).join(', '));
      setSourceType(source);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedPhrases = phrasesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: PortfolioCmsData = {
        ...cms,
        heroPhrases: parsedPhrases,
      };

      const { savedPublicTable } = await savePortfolioCms(payload);
      setSourceType(savedPublicTable ? 'public_table' : 'system_store');
      toast.success(
        savedPublicTable
          ? 'Portafolio público actualizado en vivo ✨'
          : 'Guardado en modo privado/local ✨ (agrega el SQL para hacerlo público a visitantes)'
      );
    } catch (err: any) {
      toast.error('Error al guardar CMS: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = () => {
    const newProj: CmsProject = {
      id: `proj_${Date.now()}`,
      title: 'Nuevo Proyecto',
      description: 'Descripción concisa de arquitectura, stack e impacto logrado.',
      tags: ['React', 'TypeScript'],
      image: '/assets/projects-section/Project1.jpg',
      visible: true,
    };
    setCms((prev) => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const handleUpdateProject = (idx: number, patch: Partial<CmsProject>) => {
    setCms((prev) => ({
      ...prev,
      projects: prev.projects.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  };

  const handleRemoveProject = (idx: number) => {
    const removed = cms.projects[idx];
    const prevList = cms.projects;
    setCms((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
    toast.undoable(`Proyecto "${removed?.title}" quitado`, () => {
      setCms((prev) => ({ ...prev, projects: prevList }));
    });
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

  return (
    <div className="space-y-8 pb-28 sm:pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-dm-sans text-3xl md:text-4xl font-bold tracking-tight text-[var(--black)] dark:text-white">
            Mini-CMS <span className="text-gradient">Portafolio</span>
          </h1>
          <p className="font-inter mt-1 text-[var(--dark-gray)] dark:text-gray-400 font-light text-sm">
            Edita tu Hero y proyectos destacados públicos sin modificar código ni hacer deploy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/"
            target="_blank"
            className="px-4 min-h-[44px] py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
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

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'hero', label: 'Hero & Perfil' },
          { id: 'projects', label: `Proyectos (${cms.projects.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 min-h-[44px] py-2.5 rounded-2xl text-xs font-syne font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'hero' ? (
          <div className="bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] p-5 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Rol / Eyebrow (Deja vacío para usar idioma por defecto)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Desarrollo de Software & Gestión de Proyectos"
                  value={cms.heroEyebrow}
                  onChange={(e) => setCms({ ...cms, heroEyebrow: e.target.value })}
                  className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Titular Principal (Línea 1)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Arquitectura"
                  value={cms.heroHeadline}
                  onChange={(e) => setCms({ ...cms, heroHeadline: e.target.value })}
                  className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Frases Rotativas (separadas por coma)
              </label>
              <input
                type="text"
                placeholder="Estabilidad, Precisión, Impacto, Innovación, Sinergia de IA..."
                value={phrasesInput}
                onChange={(e) => setPhrasesInput(e.target.value)}
                className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Bio / Párrafo de Presentación
              </label>
              <textarea
                rows={4}
                placeholder="Deja vacío para mantener el texto bilingüe original..."
                value={cms.heroBio}
                onChange={(e) => setCms({ ...cms, heroBio: e.target.value })}
                className="w-full p-4 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[120px]"
              />
            </div>

            <div>
              <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Texto del Botón CTA
              </label>
              <input
                type="text"
                placeholder="Ej. Explora mi Portafolio"
                value={cms.heroCta}
                onChange={(e) => setCms({ ...cms, heroCta: e.target.value })}
                className="w-full px-4 min-h-[44px] py-2.5 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 min-h-[44px] py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-syne text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <HiOutlinePlus />
                <span>Añadir Proyecto</span>
              </button>
            </div>

            {cms.projects.map((proj, idx) => (
              <div
                key={proj.id}
                className="bg-white/90 dark:bg-gray-900/90 glass dark:dark-glass rounded-[2rem] p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-syne text-xs font-bold uppercase tracking-wider text-[var(--vibrant-sky-blue)]">
                    Proyecto #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateProject(idx, { visible: !proj.visible })}
                      className={`px-3 min-h-[36px] py-1.5 rounded-xl text-[10px] font-syne font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                        proj.visible
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {proj.visible ? <HiOutlineEye /> : <HiOutlineEyeOff />}
                      <span>{proj.visible ? 'Visible' : 'Oculto'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                      title="Quitar proyecto"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleUpdateProject(idx, { title: e.target.value })}
                      className="w-full px-4 min-h-[44px] py-2 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Ruta de Imagen / URL
                    </label>
                    <input
                      type="text"
                      value={proj.image}
                      onChange={(e) => handleUpdateProject(idx, { image: e.target.value })}
                      className="w-full px-4 min-h-[44px] py-2 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleUpdateProject(idx, { description: e.target.value })}
                    className="w-full p-3 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white resize-y min-h-[84px]"
                  />
                </div>

                <div>
                  <label className="block font-syne text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Tecnologías / Tags (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={proj.tags.join(', ')}
                    onChange={(e) =>
                      handleUpdateProject(idx, {
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-4 min-h-[44px] py-2 bg-gray-50/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl font-inter text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
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
