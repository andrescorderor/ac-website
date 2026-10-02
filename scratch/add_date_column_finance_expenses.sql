-- ==============================================================================
-- MIGRACIÓN SUPABASE: Agregar columna date a la tabla finance_expenses
-- ==============================================================================
-- Ejecutar en el SQL Editor de tu proyecto Supabase para optimizar consultas de fecha.
-- Nota: La aplicación web ya es 100% resiliente y funciona perfectamente tanto
-- si ejecutas este script como si no.

-- 1. Agregar la columna date si no existe
ALTER TABLE public.finance_expenses 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- 2. Rellenar filas existentes extrayendo la fecha desde created_at
UPDATE public.finance_expenses 
SET date = (created_at AT TIME ZONE 'UTC')::DATE 
WHERE date IS NULL AND created_at IS NOT NULL;

-- 3. Crear índice para acelerar filtrados por fecha
CREATE INDEX IF NOT EXISTS idx_finance_expenses_date ON public.finance_expenses(date);

-- 4. Notificar recarga de schema cache
NOTIFY pgrst, 'reload schema';
