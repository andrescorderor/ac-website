-- SQL Script to fix reminders table and add missing columns
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  date date not null,
  category text check (category in ('Cumpleaños', 'Documento', 'Pago', 'Otro')) default 'Otro',
  recurring boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table was already created without them
alter table reminders add column if not exists date date;
alter table reminders add column if not exists title text;
alter table reminders add column if not exists category text default 'Otro';
alter table reminders add column if not exists recurring boolean default false;
alter table reminders add column if not exists notes text;

alter table reminders enable row level security;

drop policy if exists "Users can manage their own reminders." on reminders;

create policy "Users can manage their own reminders." on reminders
  for all using (auth.uid() = user_id);
