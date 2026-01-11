DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notes_max_length'
      AND conrelid = 'public.trades'::regclass
  ) THEN
    ALTER TABLE public.trades
      ADD CONSTRAINT notes_max_length
      CHECK (notes IS NULL OR length(notes) <= 10000);
  END IF;
END $$;