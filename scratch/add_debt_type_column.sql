-- ==============================================================================
-- SQL Script: Añadir columna 'type' a la tabla debts
-- Permite distinguir entre 'receivable' (Me deben) y 'payable' (Yo debo)
-- Ejecutar en Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'receivable';

-- Índice para optimizar consultas por tipo de deuda
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts(type);

-- Comentario explicativo
COMMENT ON COLUMN public.debts.type IS 'Tipo de deuda: receivable (cuenta por cobrar / me deben) o payable (cuenta por pagar / yo debo)';
