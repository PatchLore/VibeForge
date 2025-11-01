-- Add dreamify boolean column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'dreamify'
  ) THEN
    ALTER TABLE public.tracks ADD COLUMN dreamify boolean DEFAULT false;
  END IF;
END $$;

