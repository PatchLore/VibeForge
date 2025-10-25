-- Ensure tracks table exists with required columns for SootheAI SoundPainting
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  audio_url TEXT,
  image_url TEXT,
  duration INTEGER DEFAULT 600,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster task_id lookups
CREATE INDEX IF NOT EXISTS idx_tracks_task_id ON tracks(task_id);

-- Create index for faster created_at queries
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);

-- Add RLS (Row Level Security) if needed
-- ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON tracks TO authenticated;
-- GRANT ALL ON tracks TO service_role;

