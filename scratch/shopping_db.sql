create table shopping_list (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  location text,
  price numeric(10,2),
  priority text check (priority in ('Alta', 'Media', 'Baja')) default 'Media',
  bought boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table shopping_list enable row level security;

create policy "Users can manage their own shopping list." on shopping_list
  for all using (auth.uid() = user_id);
