-- Add examples and audio_cache fields to vocabulary table
ALTER TABLE public.vocabulary
ADD COLUMN IF NOT EXISTS examples JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS audio_cache JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.vocabulary.examples IS 'Array of example sentences with translations: [{"target": "sentence", "translation": "translation"}]';
COMMENT ON COLUMN public.vocabulary.audio_cache IS 'Cached audio URLs by text: {"sentence text": "audio_url"}';
