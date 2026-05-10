create table vault_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table vault_items enable row level security;

create policy "Users can manage their own vault items." on vault_items
  for all using (auth.uid() = user_id);
