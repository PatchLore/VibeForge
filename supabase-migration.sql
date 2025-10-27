-- Migration: Add status and updated_at columns to tracks table
-- Run this in Supabase SQL Editor

-- Add status column (if it doesn't exist)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add updated_at column (if it doesn't exist)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing rows to have status 'pending' (older tracks without status)
UPDATE tracks SET status = 'pending' WHERE status IS NULL;

-- Verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('status', 'updated_at');

