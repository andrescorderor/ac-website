-- =============================================
-- SCRIPT: Módulo de Recetas
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================

CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  emoji TEXT DEFAULT '🍽️',
  ingredients JSONB DEFAULT '[]'::jsonb,  -- [{ id, name, quantity, checked }]
  reference_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_recipes" ON public.recipes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
