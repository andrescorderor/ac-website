import emailjs from 'emailjs-com';
import { supabase } from '@/lib/supabase';
import { fetchWithCache, invalidateCache } from '@/lib/cache';

export type LeadStatus = 'nuevo' | 'contactado' | 'en_propuesta' | 'ganado' | 'descartado';

export type LeadSource =
  | 'contact_modal'
  | 'diagnostico'
  | 'estimador'
  | 'checklist_qa'
  | 'asistente_guiado'
  | 'pagina_servicio'
  | 'manual';

export interface PublicLead {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service_interest: string;
  source: LeadSource | string;
  status: LeadStatus;
  message?: string | null;
  metadata?: Record<string, any> | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface SubmitLeadInput {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  serviceInterest: string;
  source: LeadSource;
  message?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
}

const EMAILJS_SERVICE_ID = 'service_4tnvqx8';
const EMAILJS_TEMPLATE_ID = 'template_jsty4d9';
const EMAILJS_USER_ID = 'UFG_EnlAJMQC_VCCO';

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; badgeClass: string }
> = {
  nuevo: {
    label: 'Nuevo',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  },
  contactado: {
    label: 'Contactado',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
  },
  en_propuesta: {
    label: 'En propuesta',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  },
  ganado: {
    label: 'Ganado',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800/50',
  },
  descartado: {
    label: 'Descartado',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  },
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  contact_modal: 'Formulario Contacto',
  diagnostico: 'Diagnóstico Digital',
  estimador: 'Estimador de Alcance',
  checklist_qa: 'Checklist QA',
  asistente_guiado: 'Asistente Guiado',
  pagina_servicio: 'Página de Servicio',
  manual: 'Registro Manual',
};

export const PUBLIC_LEADS_SQL = `CREATE TABLE IF NOT EXISTS public.public_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_interest TEXT NOT NULL DEFAULT 'General',
  source TEXT NOT NULL DEFAULT 'contact_modal',
  status TEXT NOT NULL DEFAULT 'nuevo',
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_public_leads_created_at ON public.public_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_leads_status ON public.public_leads (status);
ALTER TABLE public.public_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_leads FROM anon;
GRANT INSERT ON TABLE public.public_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.public_leads TO authenticated;
DROP POLICY IF EXISTS "public_leads_anon_insert" ON public.public_leads;
CREATE POLICY "public_leads_anon_insert" ON public.public_leads FOR INSERT TO anon WITH CHECK (char_length(trim(full_name)) >= 2 AND char_length(trim(email)) >= 5);
DROP POLICY IF EXISTS "public_leads_auth_select" ON public.public_leads;
CREATE POLICY "public_leads_auth_select" ON public.public_leads FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "public_leads_auth_insert" ON public.public_leads;
CREATE POLICY "public_leads_auth_insert" ON public.public_leads FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "public_leads_auth_update" ON public.public_leads;
CREATE POLICY "public_leads_auth_update" ON public.public_leads FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "public_leads_auth_delete" ON public.public_leads;
CREATE POLICY "public_leads_auth_delete" ON public.public_leads FOR DELETE TO authenticated USING (auth.role() = 'authenticated');`;

/**
 * Captures a public lead into Supabase `public_leads` and sends an automatic EmailJS notification.
 */
export async function submitPublicLead(
  input: SubmitLeadInput
): Promise<{ savedToSupabase: boolean; emailSent: boolean }> {
  const cleanName = input.fullName.trim();
  const cleanEmail = input.email.trim();
  const cleanPhone = input.phone?.trim() || null;
  const cleanCompany = input.company?.trim() || null;
  const cleanMessage = input.message?.trim() || '';
  const serviceInterest = input.serviceInterest.trim() || 'General';

  let savedToSupabase = false;
  try {
    const { error } = await supabase.from('public_leads').insert([
      {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        company: cleanCompany,
        service_interest: serviceInterest,
        source: input.source,
        status: 'nuevo',
        message: cleanMessage || null,
        metadata: input.metadata || {},
      },
    ]);
    if (!error) {
      savedToSupabase = true;
      invalidateCache('leads');
      invalidateCache('search_global');
      invalidateCache('dashboard_stats');
    }
  } catch {
    // Graceful fallback if table is not provisioned yet
  }

  let emailSent = false;
  if (input.sendEmail !== false) {
    try {
      const sourceLabel = LEAD_SOURCE_LABELS[input.source] || input.source;
      const metaLines: string[] = [
        `[Origen: ${sourceLabel}]`,
        `[Interés: ${serviceInterest}]`,
      ];
      if (cleanCompany) metaLines.push(`[Empresa: ${cleanCompany}]`);
      if (cleanPhone) metaLines.push(`[Teléfono/WhatsApp: ${cleanPhone}]`);
      if (input.metadata && Object.keys(input.metadata).length > 0) {
        if (typeof input.metadata.score === 'number') {
          metaLines.push(`[Puntaje: ${input.metadata.score}/100]`);
        }
        if (input.metadata.summary) {
          metaLines.push(`[Resumen: ${String(input.metadata.summary)}]`);
        }
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          fullName: cleanName,
          mailAddress: cleanEmail,
          message: `${metaLines.join(' ')}\n\n${cleanMessage}`.trim(),
        },
        EMAILJS_USER_ID
      );
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return { savedToSupabase, emailSent };
}

export async function fetchAllLeads(): Promise<{
  leads: PublicLead[];
  tableMissing: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('public_leads')
      .select('id, full_name, email, phone, company, service_interest, source, status, message, metadata, notes, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const missing =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        msg.includes('public_leads') ||
        msg.includes('does not exist') ||
        msg.includes('schema cache');
      return { leads: [], tableMissing: missing };
    }

    return { leads: (data || []) as PublicLead[], tableMissing: false };
  } catch {
    return { leads: [], tableMissing: true };
  }
}

export async function fetchNewLeadsCount(): Promise<number> {
  return fetchWithCache(
    'leads_new_count',
    async () => {
      try {
        const { count, error } = await supabase
          .from('public_leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'nuevo');
        return error ? 0 : count || 0;
      } catch {
        return 0;
      }
    },
    60 * 1000
  );
}
