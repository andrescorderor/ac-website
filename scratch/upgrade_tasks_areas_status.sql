-- Migración opcional para agregar columnas nativas de área, estado y etiquetas a la tabla tasks
-- Nota: La aplicación funciona con o sin estas columnas gracias al respaldo automático en description.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS area TEXT DEFAULT 'Personal',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_tasks_area ON public.tasks (area);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
