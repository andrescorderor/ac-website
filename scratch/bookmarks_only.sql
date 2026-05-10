create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  url text not null,
  category text default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table bookmarks enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can manage their own bookmarks.') THEN
    CREATE POLICY "Users can manage their own bookmarks." ON bookmarks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
