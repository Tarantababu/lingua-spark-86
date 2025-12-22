import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { VocabularyItem, WordStatus } from '@/types';

export function useVocabulary() {
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVocabulary = useCallback(async () => {
    if (!user) {
      setVocabulary([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('language', targetLanguage)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vocabulary:', error);
    } else {
      setVocabulary((data || []) as VocabularyItem[]);
    }
    setLoading(false);
  }, [user, targetLanguage]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const getWordStatus = useCallback((word: string): WordStatus | null => {
    const normalizedWord = word.toLowerCase().trim();
    const item = vocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    return item ? (item.status as WordStatus) : null;
  }, [vocabulary]);

  const getWordData = useCallback((word: string): VocabularyItem | null => {
    const normalizedWord = word.toLowerCase().trim();
    return vocabulary.find(v => v.word.toLowerCase() === normalizedWord) || null;
  }, [vocabulary]);

  const addWord = useCallback(async (
    word: string,
    translation?: string,
    definition?: string,
    lessonId?: string
  ): Promise<VocabularyItem | null> => {
    if (!user) return null;

    const normalizedWord = word.toLowerCase().trim();
    
    // Check if word already exists
    const existing = vocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    if (existing) return existing;

    const newWord = {
      user_id: user.id,
      word: normalizedWord,
      language: targetLanguage,
      translation: translation || null,
      definition: definition || null,
      status: 1,
      is_phrase: word.includes(' '),
      source_lesson_id: lessonId || null,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vocabulary')
      .insert(newWord)
      .select()
      .single();

    if (error) {
      console.error('Error adding word:', error);
      return null;
    }

    const insertedItem = data as VocabularyItem;
    setVocabulary(prev => [insertedItem, ...prev]);
    return insertedItem;
  }, [user, targetLanguage, vocabulary]);

  const updateWordStatus = useCallback(async (wordId: string, status: WordStatus) => {
    const { error } = await supabase
      .from('vocabulary')
      .update({ status })
      .eq('id', wordId);

    if (error) {
      console.error('Error updating word status:', error);
      return false;
    }

    setVocabulary(prev =>
      prev.map(v => (v.id === wordId ? { ...v, status } : v))
    );
    return true;
  }, []);

  const updateWordTranslation = useCallback(async (
    wordId: string,
    translation: string,
    definition?: string
  ) => {
    const updates: Partial<VocabularyItem> = { translation };
    if (definition) updates.definition = definition;

    const { error } = await supabase
      .from('vocabulary')
      .update(updates)
      .eq('id', wordId);

    if (error) {
      console.error('Error updating word:', error);
      return false;
    }

    setVocabulary(prev =>
      prev.map(v => (v.id === wordId ? { ...v, ...updates } : v))
    );
    return true;
  }, []);

  const markAsKnown = useCallback(async (word: string) => {
    const wordData = getWordData(word);
    if (wordData) {
      return updateWordStatus(wordData.id, 0);
    }
    
    // If word doesn't exist, create it as known
    if (!user) return false;
    
    const { error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user.id,
        word: word.toLowerCase().trim(),
        language: targetLanguage,
        status: 0,
        is_phrase: word.includes(' '),
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      });

    if (!error) {
      await fetchVocabulary();
    }
    return !error;
  }, [user, targetLanguage, getWordData, updateWordStatus, fetchVocabulary]);

  const ignoreWord = useCallback(async (word: string) => {
    const wordData = getWordData(word);
    if (wordData) {
      return updateWordStatus(wordData.id, -1);
    }
    
    // If word doesn't exist, create it as ignored
    if (!user) return false;
    
    const { error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user.id,
        word: word.toLowerCase().trim(),
        language: targetLanguage,
        status: -1,
        is_phrase: word.includes(' '),
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      });

    if (!error) {
      await fetchVocabulary();
    }
    return !error;
  }, [user, targetLanguage, getWordData, updateWordStatus, fetchVocabulary]);

  const getKnownWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status === 0 || v.status === 5).length;
  }, [vocabulary]);

  const getLearningWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status >= 1 && v.status <= 4).length;
  }, [vocabulary]);

  const getIgnoredWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status === -1).length;
  }, [vocabulary]);

  return {
    vocabulary,
    loading,
    getWordStatus,
    getWordData,
    addWord,
    updateWordStatus,
    updateWordTranslation,
    markAsKnown,
    ignoreWord,
    getKnownWordsCount,
    getLearningWordsCount,
    getIgnoredWordsCount,
    refetch: fetchVocabulary,
  };
}
