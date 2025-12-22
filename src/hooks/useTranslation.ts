import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranslationResult {
  translation: string;
  definition: string | null;
  examples: string[];
  pronunciation: string | null;
}

export function useTranslation() {
  const [loading, setLoading] = useState(false);

  const translate = useCallback(async (
    word: string,
    targetLanguage: string,
    nativeLanguage: string = 'en'
  ): Promise<TranslationResult | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { word, targetLanguage, nativeLanguage },
      });

      if (error) {
        console.error('Translation error:', error);
        toast.error('Translation failed. Please try again.');
        return null;
      }

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many requests. Please wait a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      return {
        translation: data.translation || '',
        definition: data.definition || null,
        examples: data.examples || [],
        pronunciation: data.pronunciation || null,
      };
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Translation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { translate, loading };
}
