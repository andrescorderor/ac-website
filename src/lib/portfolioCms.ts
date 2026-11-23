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

export interface CmsExperience {
  id: string;
  year: string;
  title: string;
  company: string;
  description: string;
  visible: boolean;
}

export interface CmsCertification {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  visible: boolean;
}

export interface PortfolioCmsData {
  heroEyebrow: string;
  heroHeadline: string;
  heroPhrases: string[];
  heroBio: string;
  heroCta: string;
  projects: CmsProject[];
  experiences: CmsExperience[];
  certifications: CmsCertification[];
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
  experiences: [
    {
      id: 'exp1',
      year: '2023 - Present',
      title: 'Quality Assurance Team Lead',
      company: 'CBQA Solutions Inc.',
      description: 'Led the QA department, establishing robust testing protocols and integrating automated testing pipelines. Managed project lifecycles to ensure high-quality software delivery.',
      visible: true,
    },
    {
      id: 'exp2',
      year: '2023 - Present',
      title: 'Project Manager & QA Lead',
      company: 'Uanify',
      description: 'Directed software development projects utilizing agile methodologies. Coordinated cross-functional teams to align business goals with technical execution while maintaining rigorous QA standards.',
      visible: true,
    },
    {
      id: 'exp3',
      year: '2023 - 2024',
      title: 'Web Developer & UX/UI Designer',
      company: 'Freelance',
      description: 'Delivered comprehensive digital solutions including custom web applications and interactive interfaces, focusing on user-centered design and seamless performance.',
      visible: true,
    },
    {
      id: 'exp4',
      year: '2020 - 2024',
      title: 'Software Engineering Degree',
      company: 'Universidad de La Salle Bajío',
      description: 'Comprehensive education in software architecture, algorithms, and project management.',
      visible: true,
    },
  ],
  certifications: [
    {
      id: 'cert1',
      title: 'DevOps on AWS: Code, Build, and Test',
      subtitle: 'edX • AWS',
      link: 'https://courses.edx.org/certificates/fb06b957b1ca403cb02de35feda5fd2e',
      visible: true,
    },
    {
      id: 'cert2',
      title: 'IT Fundamentals for Business Professionals: Software Development',
      subtitle: 'edX • Universitat Politècnica de València',
      link: 'https://courses.edx.org/certificates/6243f24e7232421da9bfe2ec6df9b0d5',
      visible: true,
    },
    {
      id: 'cert3',
      title: 'DevOps Basics for Everyone',
      subtitle: 'edX • IBM',
      link: 'https://courses.edx.org/certificates/1cc6ebef0115443e8e12ea7d8f639d85',
      visible: true,
    },
    {
      id: 'cert4',
      title: 'Introduction to Web Development with HTML5, CSS3, and JavaScript',
      subtitle: 'edX • IBM',
      link: 'https://courses.edx.org/certificates/259677bb5edf428e921e3e58def0b551',
      visible: true,
    },
    {
      id: 'cert5',
      title: 'Introduction to Cloud Native, DevOps, Agile, and NoSQL',
      subtitle: 'edX • IBM',
      link: 'https://courses.edx.org/certificates/c6119b76d0b94535b6dca33e3dfbf810',
      visible: true,
    },
    {
      id: 'cert6',
      title: 'Agile and Scrum Fundamentals',
      subtitle: 'edX • University of Washington',
      link: 'https://courses.edx.org/certificates/7b40186e2ad74e3381b360c716e12096',
      visible: true,
    },
    {
      id: 'cert7',
      title: 'Strategic Applications of IT Project & Program Management',
      subtitle: 'edX • University of Washington',
      link: 'https://courses.edx.org/certificates/6bf81cae38f247488d6487740745e73c',
      visible: true,
    },
  ],
};

const LOCAL_CMS_KEY = 'ac_portfolio_cms_v1';

/** Ensures legacy stored CMS records without newer collection arrays fall back safely to defaults. */
function mergeCmsWithDefaults(raw: Partial<PortfolioCmsData> | null | undefined): PortfolioCmsData {
  const src = raw || {};
  return {
    ...DEFAULT_CMS_DATA,
    ...src,
    projects: Array.isArray(src.projects) ? src.projects : DEFAULT_CMS_DATA.projects,
    experiences: Array.isArray(src.experiences) ? src.experiences : DEFAULT_CMS_DATA.experiences,
    certifications: Array.isArray(src.certifications) ? src.certifications : DEFAULT_CMS_DATA.certifications,
  };
}

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
          const merged = mergeCmsWithDefaults(pubData[0].data as Partial<PortfolioCmsData>);
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
        return { data: mergeCmsWithDefaults(stored), source: 'system_store' as const };
      }

      try {
        const rawLocal = localStorage.getItem(LOCAL_CMS_KEY);
        if (rawLocal) {
          return {
            data: mergeCmsWithDefaults(JSON.parse(rawLocal) as Partial<PortfolioCmsData>),
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
