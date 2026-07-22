-- Extended SQL Migration Script for Hannia's Botanical RPG Game
-- Run this query in Supabase SQL Editor to support full RPG game save persistence

CREATE TABLE IF NOT EXISTS hannia_game_save (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tag VARCHAR(50) UNIQUE DEFAULT 'hannia_main',
  atelier_level INT DEFAULT 1,
  xp INT DEFAULT 0,
  thread_count INT DEFAULT 5,
  lace_count INT DEFAULT 3,
  pollen_count INT DEFAULT 2,
  crafted_dresses JSONB DEFAULT '[]'::jsonb,
  unlocked_relics JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hannia_game_save ENABLE ROW LEVEL SECURITY;

-- Public Policy for Read/Write
CREATE POLICY "Allow public read access to hannia_game_save" ON hannia_game_save FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to hannia_game_save" ON hannia_game_save FOR ALL USING (true) WITH CHECK (true);

-- Seed initial save state
INSERT INTO hannia_game_save (user_tag, atelier_level, xp, thread_count, lace_count, pollen_count)
VALUES ('hannia_main', 1, 0, 5, 3, 2)
ON CONFLICT (user_tag) DO NOTHING;
