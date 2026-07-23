-- SQL Fix for vault_items table schema
-- Run this in Supabase SQL Editor to add the category column if missing

ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
