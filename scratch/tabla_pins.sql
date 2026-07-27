-- =============================================
-- SCRIPT: Sincronización de Elementos Fijados (Pins)
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_pinned_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  path TEXT NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Si quieres restringirlo por usuario (recomendado si manejas múltiples sesiones):
-- ALTER TABLE public.user_pinned_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Pero basándonos en tu código actual que no pasa el user_id, solo activamos RLS general si es necesario, 
-- o lo dejamos abierto para tu única sesión de admin.

-- Activar RLS básico (Opcional, pero recomendado)
ALTER TABLE public.user_pinned_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.user_pinned_items 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
