-- Mini-CRM de Prospectos (v10.0.0)
-- Seguridad RLS:
--   * Rol `anon` (visitantes públicos): SOLO puede insertar nuevos prospectos (`INSERT`).
--   * Rol `authenticated` (Andrés en Panel Privado): acceso completo (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

CREATE TABLE IF NOT EXISTS public.public_leads (
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

CREATE INDEX IF NOT EXISTS idx_public_leads_created_at
  ON public.public_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_leads_status
  ON public.public_leads (status);

ALTER TABLE public.public_leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.public_leads FROM anon;
GRANT INSERT ON TABLE public.public_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.public_leads TO authenticated;

DROP POLICY IF EXISTS "public_leads_anon_insert" ON public.public_leads;
CREATE POLICY "public_leads_anon_insert"
  ON public.public_leads
  FOR INSERT
  TO anon
  WITH CHECK (
    char_length(trim(full_name)) >= 2
    AND char_length(trim(email)) >= 5
  );

DROP POLICY IF EXISTS "public_leads_auth_select" ON public.public_leads;
CREATE POLICY "public_leads_auth_select"
  ON public.public_leads
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_leads_auth_insert" ON public.public_leads;
CREATE POLICY "public_leads_auth_insert"
  ON public.public_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_leads_auth_update" ON public.public_leads;
CREATE POLICY "public_leads_auth_update"
  ON public.public_leads
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_leads_auth_delete" ON public.public_leads;
CREATE POLICY "public_leads_auth_delete"
  ON public.public_leads
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');
