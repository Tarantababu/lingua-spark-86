-- Add translation_preferences column to profiles table
-- This stores a JSON object mapping each target language to its preferred translation language
-- Example: {"es": "en", "fr": "en", "de": "en", "it": "en", "pt": "en", "en": "en", "tr": "en"}
ALTER TABLE public.profiles 
ADD COLUMN translation_preferences JSONB DEFAULT '{"es": "en", "fr": "en", "de": "en", "it": "en", "pt": "en", "en": "en", "tr": "en"}'::jsonb;

-- Update existing profiles to have default translation preferences
UPDATE public.profiles 
SET translation_preferences = '{"es": "en", "fr": "en", "de": "en", "it": "en", "pt": "en", "en": "en", "tr": "en"}'::jsonb
WHERE translation_preferences IS NULL;
