-- Notes / Notas Importantes table
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  url text,
  category text default 'General',
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notes enable row level security;

drop policy if exists "Users can manage their own notes." on notes;

create policy "Users can manage their own notes." on notes
  for all using (auth.uid() = user_id);
