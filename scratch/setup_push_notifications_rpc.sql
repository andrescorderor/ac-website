-- ==============================================================================
-- SQL Script: Web Push Notifications Setup (Table, RLS & RPC)
-- Ejecutar en Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Crear tabla de suscripciones Push si aún no existe
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda y concurrencia
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir registrar y actualizar suscripciones push desde la PWA
DROP POLICY IF EXISTS "Permitir guardar suscripciones push" ON public.push_subscriptions;
CREATE POLICY "Permitir guardar suscripciones push"
    ON public.push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Función RPC con SECURITY DEFINER para consultar alertas diarias sin exponer RLS
CREATE OR REPLACE FUNCTION public.get_daily_notifications_to_send()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    result JSON;
    subs JSON;
    notifs JSON;
BEGIN
    -- A. Obtener todas las suscripciones de dispositivos activas
    SELECT json_agg(
        json_build_object(
            'id', id,
            'endpoint', endpoint,
            'p256dh', p256dh,
            'auth', auth
        )
    )
    INTO subs
    FROM public.push_subscriptions
    WHERE endpoint IS NOT NULL AND p256dh IS NOT NULL AND auth IS NOT NULL;

    -- B. Calcular alertas de HOY (Recordatorios, Tareas y Riego de Plantas)
    WITH all_alerts AS (
        -- 1. Recordatorios para Hoy
        SELECT 
            '📌 ' || title AS title,
            '¡Hoy tienes un evento! (' || COALESCE(category, 'General') || ')' || 
                CASE WHEN time IS NOT NULL AND time != '' THEN ' a las ' || time || ' hrs' ELSE '' END || 
                CASE WHEN notes IS NOT NULL AND notes != '' THEN '. ' || LEFT(notes, 80) ELSE '' END AS body,
            '/admin/panel/recordatorios' AS url,
            'rem_' || id::text || '_today' AS tag
        FROM public.reminders
        WHERE (
            -- No recurrente: coincide fecha exacta hoy
            (recurring = false AND (date = today_date OR event_date = today_date))
            OR
            -- Recurrente: coincide mes y día
            (recurring = true AND (
                EXTRACT(MONTH FROM COALESCE(date, event_date)) = EXTRACT(MONTH FROM today_date) AND
                EXTRACT(DAY FROM COALESCE(date, event_date)) = EXTRACT(DAY FROM today_date)
            ))
        )

        UNION ALL

        -- 2. Tareas que vencen Hoy
        SELECT 
            '✅ Tarea Pendiente: ' || title AS title,
            '¡Esta tarea vence el día de hoy!' || 
                CASE WHEN description IS NOT NULL AND description != '' THEN ' ' || LEFT(description, 80) ELSE '' END AS body,
            '/admin/panel/pendientes' AS url,
            'task_' || id::text || '_today' AS tag
        FROM public.tasks
        WHERE completed = false AND due_date = today_date

        UNION ALL

        -- 3. Plantas que necesitan riego Hoy
        SELECT 
            COALESCE(emoji, '🪴') || ' Riego Hoy: ' || nickname AS title,
            '¡Hoy toca regar a ' || nickname || ' (' || species || ')! Frecuencia: cada ' || watering_frequency_days || ' días.' AS body,
            '/admin/panel/plantas' AS url,
            'plant_' || id::text || '_today' AS tag
        FROM public.plants
        WHERE last_watered_at IS NOT NULL 
          AND watering_frequency_days IS NOT NULL
          AND (today_date - last_watered_at) >= watering_frequency_days
    )
    SELECT json_agg(
        json_build_object(
            'title', title,
            'body', body,
            'url', url,
            'tag', tag
        )
    )
    INTO notifs
    FROM all_alerts;

    -- C. Ensamblar resultado final
    result := json_build_object(
        'date', today_date,
        'subscriptions', COALESCE(subs, '[]'::json),
        'notifications', COALESCE(notifs, '[]'::json)
    );

    RETURN result;
END;
$$;

-- 4. Otorgar permiso de ejecución para anon, authenticated y service_role
GRANT EXECUTE ON FUNCTION public.get_daily_notifications_to_send() TO anon, authenticated, service_role;
