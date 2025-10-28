-- Add extended_prompt column to tracks table for enriched prompt storage
-- Run this in your Supabase SQL editor

-- Add the extended_prompt column if it doesn't exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS extended_prompt TEXT;

-- Add the status column if it doesn't exist (for tracking generation status)
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add the updated_at column if it doesn't exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);

-- Create index for user_id queries
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);

-- Update the deduct_credits function to work with profiles table
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits from profiles table
  SELECT credits INTO current_credits 
  FROM profiles 
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits atomically
  UPDATE profiles 
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add credits to profiles table
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
