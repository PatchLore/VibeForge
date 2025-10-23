-- Add image_url column to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_image_url ON tracks(image_url);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN tracks.image_url IS 'URL of the AI-generated artwork for this track';
