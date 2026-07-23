-- Script para crear la tabla finance_salary y configurar RLS

CREATE TABLE IF NOT EXISTS public.finance_salary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT finance_salary_user_id_key UNIQUE (user_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.finance_salary ENABLE ROW LEVEL SECURITY;

-- Crear políticas para que cada usuario solo gestione su propio salario
CREATE POLICY "Users can manage their own salary" 
ON public.finance_salary
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
