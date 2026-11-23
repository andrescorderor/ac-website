import { supabase } from '@/lib/supabase';
import { fetchWithCache, invalidateCache } from '@/lib/cache';
import { loadSystemData, saveSystemData } from '@/lib/systemStore';

export interface CmsProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  visible: boolean;
}

export interface PortfolioCmsData {
  heroEyebrow: string;
  heroHeadline: string;
  heroPhrases: string[];
  heroBio: string;
  heroCta: string;
  projects: CmsProject[];
  updatedAt?: string;
}

export const DEFAULT_CMS_DATA: PortfolioCmsData = {
  heroEyebrow: '',
  heroHeadline: '',
  heroPhrases: [],
  heroBio: '',
  heroCta: '',
  projects: [
    {
      id: 'proj1',
      title: 'Gestión de Incidentes con IA',
      description: 'Sistema robusto para Volkswagen, optimizado con analítica predictiva impulsada por IA para una resolución de incidentes más rápida.',
      tags: ['React', 'Node.js', 'AWS', 'IA'],
      image: '/assets/projects-section/Project1.jpg',
      visible: true,
    },
    {
      id: 'proj2',
      title: 'Plataforma de Integración GovTech',
      description: 'Centro digital para que los ciudadanos procesen trámites gubernamentales, reduciendo drásticamente los tiempos de espera y la carga burocrática.',
      tags: ['Vue.js', 'Python', 'PostgreSQL', 'Docker'],
      image: '/assets/projects-section/Project2.jpg',
      visible: true,
    },
    {
      id: 'proj3',
      title: 'Ecosistema de Emprendimiento',
      description: 'Plataforma estatal que conecta startups, inversores y mentores. Incluye algoritmos de coincidencia y directorios de recursos.',
      tags: ['Next.js', 'TypeScript', 'Tailwind CSS'],
      image: '/assets/projects-section/Project3.jpg',
      visible: true,
    },
    {
      id: 'proj4',
      title: 'Plataforma Comercial Industrial',
      description: 'Software de e-commerce B2B especializado en el sector de tuberías, gestionando sistemas complejos de inventario y transacciones a gran escala.',
      tags: ['React', 'Express', 'MySQL', 'Stripe'],
      image: '/assets/projects-section/Project4.jpg',
      visible: true,
    },
    {
      id: 'proj5',
      title: 'Servicio de Imágenes Médicas con IA',
      description: 'Servicio seguro y conforme a HIPAA para clínicas, analizando imágenes de ultrasonido con diagnósticos asistidos por IA.',
      tags: ['React Native', 'Firebase', 'IA', 'AWS S3'],
      image: '/assets/projects-section/Project5.jpg',
      visible: true,
    },
  ],
};

const LOCAL_CMS_KEY = 'ac_portfolio_cms_v1';

/**
 * Loads portfolio CMS overrides: tries public `portfolio_settings` table first,
 * falling back transparently to System_Store / localStorage without throwing errors.
 */
export async function loadPortfolioCms(): Promise<{
  data: PortfolioCmsData;
  source: 'public_table' | 'system_store' | 'default';
}> {
  return fetchWithCache(
    'portfolio_cms_public',
    async () => {
      try {
        const { data: pubData, error } = await supabase
          .from('portfolio_settings')
          .select('data')
          .eq('id', 'main')
          .limit(1);

        if (!error && pubData && pubData.length > 0 && pubData[0].data) {
          const merged = { ...DEFAULT_CMS_DATA, ...(pubData[0].data as PortfolioCmsData) };
          try {
            localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(merged));
          } catch {}
          return { data: merged, source: 'public_table' as const };
        }
      } catch {
        // Table not provisioned yet
      }

      const stored = await loadSystemData<PortfolioCmsData | null>('portfolio_cms', null, 5 * 60 * 1000);
      if (stored) {
        return { data: { ...DEFAULT_CMS_DATA, ...stored }, source: 'system_store' as const };
      }

      try {
        const rawLocal = localStorage.getItem(LOCAL_CMS_KEY);
        if (rawLocal) {
          return {
            data: { ...DEFAULT_CMS_DATA, ...(JSON.parse(rawLocal) as PortfolioCmsData) },
            source: 'system_store' as const,
          };
        }
      } catch {}

      return { data: DEFAULT_CMS_DATA, source: 'default' as const };
    },
    10 * 60 * 1000
  );
}

/**
 * Saves portfolio CMS overrides to `portfolio_settings` (if provisioned) and `System_Store:portfolio_cms`.
 */
export async function savePortfolioCms(data: PortfolioCmsData): Promise<{ savedPublicTable: boolean }> {
  const withTimestamp: PortfolioCmsData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(withTimestamp));
  } catch {}
  invalidateCache('portfolio_cms');

  let savedPublicTable = false;
  try {
    const { error } = await supabase
      .from('portfolio_settings')
      .upsert({ id: 'main', data: withTimestamp, updated_at: withTimestamp.updatedAt });
    if (!error) savedPublicTable = true;
  } catch {
    // Fallback below handles storage
  }

  await saveSystemData('portfolio_cms', withTimestamp);
  return { savedPublicTable };
}
