-- Reminders / Important Dates
create table reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  date date not null,
  category text check (category in ('Cumpleaños', 'Documento', 'Pago', 'Otro')) default 'Otro',
  recurring boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reminders enable row level security;

create policy "Users can manage their own reminders." on reminders
  for all using (auth.uid() = user_id);

-- Quick Links / Private Bookmarks
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  url text not null,
  category text default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table bookmarks enable row level security;

create policy "Users can manage their own bookmarks." on bookmarks
  for all using (auth.uid() = user_id);
