-- ==============================================================================
-- Script de Inserción: 3 Nuevas Plantas (Kalanchoes 13, 14 y 15)
-- 13. Kalanchoe Aterciopelado (Kalanchoe millotii)
-- 14. Kalanchoe Oreja de Burro (Kalanchoe gastonis-bonnieri)
-- 15. Kalanchoe de Fedora (Kalanchoe fedtschenkoi)
--
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

    -- 13. Kalanchoe Aterciopelado (Kalanchoe millotii)
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
        'Kalanchoe Aterciopelado (Buda verde)',
        'Kalanchoe millotii',
        16, -- Rango recomendado: 15 a 18 días
        CURRENT_DATE,
        'Balcón en semisombra o exterior con sol filtrado',
        '🌵',
        '### Cuidados & Recomendaciones' || E'\n' ||
        '• **Sensible al encharcamiento**: El exceso de agua pudre sus raíces en pocos días. Aplicar la técnica de "remojo y secado": regar abundante directo al suelo sin mojar sus hojas peludas solo cuando la tierra esté 100% seca.' || E'\n' ||
        '• **Enderezamiento natural**: Al colocarla en un lugar con luz uniforme desde arriba (como tu balcón), las nuevas hojas crecerán rectas y compactas. Agradece el sol directo suave de la mañana para corregir su postura.' || E'\n' ||
        '• **Poda a futuro**: Si el tallo se vuelve demasiado largo e inestable, se puede decapitar la punta, dejar cicatrizar 4 días y volver a plantar para conseguir una planta enana y densa.'
    );

    -- 14. Kalanchoe Oreja de Burro (Kalanchoe gastonis-bonnieri)
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
        'Kalanchoe Oreja de Burro (Orejona)',
        'Kalanchoe gastonis-bonnieri',
        14, -- Rango recomendado: 12 a 15 días
        CURRENT_DATE,
        'Balcón, exterior con sol directo o semisombra brillante',
        '🌵',
        '### Cuidados & Recomendaciones' || E'\n' ||
        '• **Riego al suelo**: Regar abundantemente solo cuando todo el sustrato de la maceta esté 100% seco. Evitar encharcar el centro de la roseta de hojas al regar para prevenir hongos por acumulación de agua.' || E'\n' ||
        '• **Mantener el tutor**: Dejar el palito de soporte hasta que notes que el tallo central se vuelve grueso y lignificado (leñoso).' || E'\n' ||
        '• **Propagación**: Con el tiempo y buena luz, esta especie suele desarrollar pequeñas plantas bebés directamente en las puntas de sus hojas más grandes.'
    );

    -- 15. Kalanchoe de Fedora (Kalanchoe fedtschenkoi)
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
        'Kalanchoe de Fedora (Fedora)',
        'Kalanchoe fedtschenkoi',
        14, -- Rango recomendado: 12 a 15 días
        CURRENT_DATE,
        'Balcón, exterior con sol directo (soporta barda)',
        '🌵',
        '### Cuidados & Recomendaciones' || E'\n' ||
        '• **Excelente resistencia**: De toda tu colección de suculentas, esta es una de las más aguantadoras al sol directo y al viento exterior. Soporta muy bien las condiciones actuales de la barda.' || E'\n' ||
        '• **Riego**: Regar abundantemente solo cuando la tierra esté 100% seca de arriba a abajo. Al igual que los otros kalanchoes, su peor enemigo es el encharcamiento en raíces.' || E'\n' ||
        '• **Multiplicación autónoma**: Si alguna hoja se cae por accidente sobre la tierra, no la tires; déjala ahí y en unas semanas sacará raíces y una planta nueva por sí sola.'
    );

    RAISE NOTICE '¡3 nuevos Kalanchoes insertados con éxito para el usuario %!', v_user_id;
END $$;

-- Verificación de las plantas agregadas
SELECT id, nickname, species, watering_frequency_days, location, emoji, last_watered_at, created_at 
FROM public.plants 
ORDER BY created_at DESC 
LIMIT 6;
