-- ==============================================================================
-- Script de Inserción: 2 Nuevas Plantas (Coleo / Terciopelo & Planta Zebra / Sanchezia)
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Detectar automáticamente el user_id del usuario del panel
    v_user_id := COALESCE(
        auth.uid(),
        (SELECT id FROM auth.users WHERE email LIKE '%andres%' LIMIT 1),
        (SELECT user_id FROM public.push_subscriptions LIMIT 1),
        '62d04e75-b322-4485-80a2-25cc81f3752b'::uuid
    );

    -- 1. Planta: Coleo / Terciopelo (Coleus scutellarioides)
    INSERT INTO public.plants (
        user_id,
        nickname,
        species,
        watering_frequency_days,
        last_watered_at,
        location,
        emoji,
        notes
    ) VALUES (
        v_user_id,
        'Coleo / Terciopelo',
        'Coleus scutellarioides',
        4, -- Rango recomendado: 3 a 5 días
        CURRENT_DATE,
        'Interior (luz indirecta brillante) o semisombra en exterior',
        '🌿',
        '### Cuidados & Recomendaciones' || E'\n' ||
        '• **Sensibilidad al agua**: Si dejas secar el sustrato por completo, la planta se desmayará drásticamente. Al regarla se recupera rápido, pero el estrés constante debilita sus tallos. Prefiere el sustrato constantemente húmedo, pero sin encharcar.' || E'\n' ||
        '• **Poda de mantenimiento**: Si notas que empieza a sacar una espiga de flores pequeñas en las puntas, es recomendable cortarla. La floración consume demasiada energía y hace que el follaje pierda fuerza y color.' || E'\n' ||
        '• **Luz**: Proteger del sol directo del mediodía para evitar que se destiñan sus hojas.'
    );

    -- 2. Planta: Planta Zebra / Sanchezia (Sanchezia speciosa)
    INSERT INTO public.plants (
        user_id,
        nickname,
        species,
        watering_frequency_days,
        last_watered_at,
        location,
        emoji,
        notes
    ) VALUES (
        v_user_id,
        'Planta Zebra / Sanchezia',
        'Sanchezia speciosa (Alandra)',
        5, -- Rango recomendado: 4 a 6 días
        CURRENT_DATE,
        'Interior junto a la ventana o balcón techado (sombra total / luz indirecta)',
        '🌿',
        '### Cuidados & Recomendaciones' || E'\n' ||
        '• **Sensibilidad al agua**: Al ser tropical, odia que la tierra se seque por completo; si le falta agua, sus hojas se caerán dramáticamente como si estuviera triste. Mantener sustrato húmedo, pero no encharcado.' || E'\n' ||
        '• **Limpieza**: Limpia el polvo de sus hojas de vez en cuando con un paño húmedo para que siga respirando de forma óptima.' || E'\n' ||
        '• **Luz**: Manténla alejada del sol directo de la barda del balcón, ya que sus hojas se decolorarían y quemarían muy rápido.'
    );

    RAISE NOTICE '¡2 nuevas plantas insertadas con éxito para el usuario %!', v_user_id;
END $$;

-- Verificación de las plantas agregadas
SELECT id, nickname, species, watering_frequency_days, location, emoji, last_watered_at, created_at 
FROM public.plants 
ORDER BY created_at DESC 
LIMIT 5;
