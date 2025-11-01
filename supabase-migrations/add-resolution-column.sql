-- Add resolution column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'resolution'
  ) THEN
    ALTER TABLE public.tracks ADD COLUMN resolution text;
  END IF;
END $$;
