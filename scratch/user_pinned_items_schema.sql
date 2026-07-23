-- SQL Schema Migration for Cross-Device Pinned Items Synchronization
-- Run this query in Supabase SQL Editor to enable permanent cross-device pinned item sync (PC & Mobile)

CREATE TABLE IF NOT EXISTS user_pinned_items (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  path TEXT NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_pinned_items ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access
CREATE POLICY "Allow public select on user_pinned_items" ON user_pinned_items FOR SELECT USING (true);
CREATE POLICY "Allow public all on user_pinned_items" ON user_pinned_items FOR ALL USING (true) WITH CHECK (true);
