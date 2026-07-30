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
