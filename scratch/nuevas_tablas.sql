-- =============================================
-- SCRIPT: Nuevos módulos - Portafolio de Proyectos y Checklist Mensual
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================

-- === TABLA 1: Portafolio de Proyectos Creativos ===
CREATE TABLE IF NOT EXISTS public.creative_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Personal',
  status TEXT DEFAULT 'idea',
  emoji TEXT DEFAULT '🛠️',
  notes TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.creative_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_projects" ON public.creative_projects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === TABLA 2: Plantilla de ítems del Checklist Mensual ===
CREATE TABLE IF NOT EXISTS public.monthly_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  emoji TEXT DEFAULT '✅',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.monthly_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_checklist_items" ON public.monthly_checklist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === TABLA 3: Registro de completado por mes ===
CREATE TABLE IF NOT EXISTS public.monthly_checklist_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.monthly_checklist_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(item_id, month_year)
);

ALTER TABLE public.monthly_checklist_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_checklist_logs" ON public.monthly_checklist_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
