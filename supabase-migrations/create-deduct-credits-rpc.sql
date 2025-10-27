-- Create RPC function for atomic credit deduction
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_amount THEN
    RAISE NOTICE 'Insufficient credits: current=%, required=%', current_credits, p_amount;
    RETURN FALSE;
  END IF;
  
  -- Deduct credits atomically
  UPDATE profiles
  SET 
    credits = credits - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND credits >= p_amount;
  
  -- Return true if at least one row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

