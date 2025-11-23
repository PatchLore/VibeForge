-- Archive tracks that don't have valid image URLs
-- Run this in your Supabase SQL Editor
-- This preserves incomplete tracks instead of deleting them

-- Step 1: Mark all completed tracks without images as archived
UPDATE tracks
SET status = 'archived'
WHERE (status = 'completed' OR status IS NULL)
  AND (image_url IS NULL OR image_url = '');

-- Step 2: Optionally, create an index for faster queries on status + image_url
CREATE INDEX IF NOT EXISTS idx_tracks_status_image 
ON tracks(status, image_url) 
WHERE status != 'archived';

-- Step 3: Verify the archive operation
-- Run this query to see how many tracks were archived:
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as with_images,
  COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as without_images
FROM tracks
GROUP BY status
ORDER BY status;

-- Optional: View archived tracks if you want to review them
-- SELECT id, title, prompt, created_at FROM tracks WHERE status = 'archived' ORDER BY created_at DESC LIMIT 20;

-- Optional: Restore a specific track (uncomment and replace <track_id>):
-- UPDATE tracks SET status = 'completed' WHERE id = '<track_id>';



