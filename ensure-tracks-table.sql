-- Ensure tracks table exists with required columns for Soundswoop Infinite Vibes
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT UNIQUE,
  user_id TEXT,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  audio_url TEXT,
  image_url TEXT,
  mood TEXT,
  likes INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 600,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster task_id lookups
CREATE INDEX IF NOT EXISTS idx_tracks_task_id ON tracks(task_id);

-- Create index for faster created_at queries
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);

-- Create index for mood-based queries
CREATE INDEX IF NOT EXISTS idx_tracks_mood ON tracks(mood);

-- Create index for likes/popularity queries
CREATE INDEX IF NOT EXISTS idx_tracks_likes ON tracks(likes DESC);

-- Add RLS (Row Level Security) if needed
-- ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON tracks TO authenticated;
-- GRANT ALL ON tracks TO service_role;

-- RPC function to safely increment likes
CREATE OR REPLACE FUNCTION increment_track_likes(track_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE tracks 
  SET likes = likes + 1 
  WHERE id = track_id 
  RETURNING likes INTO new_likes;
  
  RETURN COALESCE(new_likes, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get popular moods
CREATE OR REPLACE FUNCTION get_popular_moods(limit_count INTEGER DEFAULT 12)
RETURNS TABLE(mood TEXT, count BIGINT, sample_track JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.mood,
    COUNT(*) as count,
    to_jsonb(t.*) as sample_track
  FROM tracks t
  WHERE t.mood IS NOT NULL
  GROUP BY t.mood
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

