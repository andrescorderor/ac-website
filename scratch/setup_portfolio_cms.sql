-- Tabla pública opcional de 1 fila para publicar cambios del Mini-CMS del Portafolio a cualquier visitante
-- (Sin costo adicional; lectura pública anónima y escritura exclusiva para el dueño autenticado)

CREATE TABLE IF NOT EXISTS public.portfolio_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read portfolio settings" ON public.portfolio_settings;
CREATE POLICY "Public read portfolio settings"
  ON public.portfolio_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owner manage portfolio settings" ON public.portfolio_settings;
CREATE POLICY "Owner manage portfolio settings"
  ON public.portfolio_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
