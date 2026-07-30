-- Crear tabla de plantas
create table if not exists plants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nickname text not null,
  species text not null,
  watering_frequency_days integer not null default 7,
  last_watered_at date not null default CURRENT_DATE,
  location text,
  notes text,
  emoji text default '🪴',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table plants enable row level security;

-- Política de RLS para que cada usuario solo gestione sus propias plantas
create policy "Users can manage their own plants." on plants
  for all using (auth.uid() = user_id);

-- Insertar registros iniciales para el usuario
insert into plants (user_id, nickname, species, watering_frequency_days, location, emoji, notes)
values
(
  auth.uid(),
  'Aloe Diente de Tigre',
  'Aloe juvenna',
  17,
  'Interior (Pegado a la ventana)',
  '🪴',
  '### Recomendaciones & Cuidados
• **Riego**: Cada 15 a 20 días. Regar solo cuando el sustrato esté 100% seco.
• **Luz**: Luz indirecta muy brillante o sol directo matutino (2-3 horas).
• **Extra**: Requiere soporte (tutor) si el tallo principal está muy alto para evitar que se quiebre.'
),
(
  auth.uid(),
  'Planta Pulpo / Áloe Candelabro',
  'Aloe arborescens',
  13,
  'Sol directo (Exterior / Balcón)',
  '🌿',
  '### Recomendaciones & Cuidados
• **Riego**: Cada 12 a 15 días en calor. Tolera sequías largas; no soporta encharcamientos.
• **Luz**: Sol directo del exterior (balcón, terraza o alféizar). Mínimo 5 horas de sol al día.
• **Extra**: Retira los adornos u objetos pesados sobre la tierra para que el sustrato respire y seque rápido.'
),
(
  auth.uid(),
  'Cactus Viejito',
  'Austrocylindropuntia vestita',
  15,
  'Sol directo pleno (Exterior)',
  '🌵',
  '### Recomendaciones & Cuidados
• **Riego**: Cada 15 días en verano. Cero riego durante el invierno.
• **Luz**: Sol directo y pleno en el exterior. Requiere alta radiación para no deformarse.
• **Extra**: Separa el brote de áloe invasor de su maceta para que no muera deshidratado.'
),
(
  auth.uid(),
  'Planta Cebra',
  'Haworthiopsis attenuata',
  17,
  'Interior (Luz indirecta)',
  '🍀',
  '### Recomendaciones & Cuidados
• **Riego**: Cada 15 a 20 días. Sensible a la pudrición si se riega de más.
• **Luz**: Interior con luz indirecta brillante. Evita por completo el sol directo del mediodía.
• **Extra**: Retira el tallo intruso que cuelga y verifica que su maceta actual tenga agujero de drenaje.'
);
