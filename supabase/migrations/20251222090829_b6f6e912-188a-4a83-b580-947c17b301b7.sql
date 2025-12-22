-- Drop the existing constraint that doesn't allow -1
ALTER TABLE public.vocabulary DROP CONSTRAINT vocabulary_status_check;

-- Add new constraint that allows -1 (ignored) through 5
ALTER TABLE public.vocabulary ADD CONSTRAINT vocabulary_status_check CHECK (status >= -1 AND status <= 5);