import { useState, useCallback } from 'react';
import { translateWord } from '@/api/openai';
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
      const result = await translateWord(word, targetLanguage, nativeLanguage);

      return {
        translation: result.translation || '',
        definition: result.definition || null,
        examples: result.examples || [],
        pronunciation: result.pronunciation || null,
      };
    } catch (err: any) {
      console.error('Translation error:', err);
      
      // Handle specific error cases
      if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
        toast.error('Too many requests. Please wait a moment.');
      } else if (err.message?.includes('quota') || err.message?.includes('credits')) {
        toast.error('AI credits exhausted.');
      } else {
        toast.error('Translation failed. Please try again.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { translate, loading };
}
