-- Add task_id column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE public.tracks ADD COLUMN task_id text;
  END IF;
END $$;





