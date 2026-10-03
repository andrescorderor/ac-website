-- ==============================================================================
-- MASTER DATABASE SETUP SCRIPT FOR AC-PANEL (SUPABASE)
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu nuevo proyecto en Supabase (https://supabase.com/dashboard/project/...)
-- 2. En el menú lateral izquierdo, haz clic en "SQL Editor"
-- 3. Haz clic en "+ New query"
-- 4. Pega todo este contenido y haz clic en "Run" (botón verde)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla: Tareas / Pendientes
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Media',
  due_date TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Tabla: Deudas y Cuentas por Cobrar (Bidireccional)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  debtor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  concept TEXT,
  settled BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'receivable', -- 'receivable' (Me deben) o 'payable' (Yo debo)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Tabla: Bóveda Segura
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Tabla: Lista de Compras y Mandado Semanal
CREATE TABLE IF NOT EXISTS public.shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  price NUMERIC,
  bought BOOLEAN DEFAULT false,
  quantity TEXT,
  priority TEXT DEFAULT 'Media',
  purchase_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Tabla: Recordatorios y Fechas Importantes
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  date TEXT,
  time TEXT,
  notes TEXT,
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Tabla: Notas Importantes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Tabla: Enlaces y Marcadores
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Tabla: Recetario Personal
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Almuerzo / Comida',
  emoji TEXT DEFAULT '🍽️',
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Tabla: Cuidado de Plantas
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  species TEXT NOT NULL,
  location TEXT,
  watering_frequency_days INTEGER DEFAULT 7,
  last_watered_at TEXT,
  notes TEXT,
  emoji TEXT DEFAULT '🪴',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Tabla: Salario Mensual
CREATE TABLE IF NOT EXISTS public.finance_salary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  amount NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 12. Tabla: Gastos Financieros (Base Fija y Mandado)
CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'servicios', 'comida', 'insumos'
  concept TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_date ON public.finance_expenses(date);

-- 13. Tabla: Proyectos Creativos
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

-- 14. Tablas: Checklist Mensual
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

CREATE TABLE IF NOT EXISTS public.monthly_checklist_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.monthly_checklist_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(item_id, month_year)
);

-- 15. Tabla: Ítems Fijados en Inicio (Pins)
CREATE TABLE IF NOT EXISTS public.user_pinned_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, item_id, type)
);

-- 16. Tabla: Suscripciones Web Push PWA
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 17. Políticas de Seguridad Permisivas para Operación Fluida
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_access" ON public.debts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vault_access" ON public.vault_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_access" ON public.shopping_list FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_access" ON public.reminders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_access" ON public.notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_access" ON public.bookmarks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_access" ON public.recipes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plants_access" ON public.plants FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.finance_salary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_access" ON public.finance_salary FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_access" ON public.finance_expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.creative_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_access" ON public.creative_projects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.monthly_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_items_access" ON public.monthly_checklist_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.monthly_checklist_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_logs_access" ON public.monthly_checklist_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.user_pinned_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pinned_access" ON public.user_pinned_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_access" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 18. Notificar recarga de schema cache
NOTIFY pgrst, 'reload schema';
