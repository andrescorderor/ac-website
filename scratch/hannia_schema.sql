-- SQL Migration Script for Hannia's Digital Garden
-- Run this query in Supabase SQL Editor if you wish to persist garden state

CREATE TABLE IF NOT EXISTS hannia_garden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_slot INT UNIQUE NOT NULL,
  flower_name VARCHAR(100) NOT NULL,
  growth_stage INT DEFAULT 1, -- 1: Semilla, 2: Brote, 3: Botón, 4: Lili Florecida
  water_count INT DEFAULT 0,
  unlocked_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hannia_garden ENABLE ROW LEVEL SECURITY;

-- Public Policy for Read/Write
CREATE POLICY "Allow public read access to hannia_garden" ON hannia_garden FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to hannia_garden" ON hannia_garden FOR ALL USING (true) WITH CHECK (true);

-- Seed initial 5 lily slots if empty
INSERT INTO hannia_garden (flower_slot, flower_name, growth_stage, water_count)
VALUES 
  (1, 'Lili Rosa Victoria', 1, 0),
  (2, 'Lili Ébano de Gótica', 1, 0),
  (3, 'Lili Neón de Moda', 1, 0),
  (4, 'Lili Abejita Pibo', 1, 0),
  (5, 'Lili Corazón Dorado', 1, 0)
ON CONFLICT (flower_slot) DO NOTHING;
