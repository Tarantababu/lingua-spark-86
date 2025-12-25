import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { VocabularyItem, WordStatus } from '@/types';

export function useVocabulary(languageOverride?: string) {
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Use override language if provided, otherwise use target language
  const activeLanguage = languageOverride || targetLanguage;

  const fetchVocabulary = useCallback(async () => {
    if (!user) {
      setVocabulary([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const records = await pb.collection('vocabulary').getFullList({
        filter: `user="${user.id}" && language="${activeLanguage}"`,
        sort: '-created',
      });

      setVocabulary(records as unknown as VocabularyItem[]);
      setUpdateCounter(prev => prev + 1);
      console.log(`📚 Loaded ${records.length} vocabulary items for language: ${activeLanguage} (update #${updateCounter + 1})`);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setVocabulary([]);
    }
    setLoading(false);
  }, [user, activeLanguage, updateCounter]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  // Real-time subscription for vocabulary updates
  useEffect(() => {
    if (!user || !activeLanguage) return;

    console.log(`🔔 Subscribing to vocabulary updates for user ${user.id}, language: ${activeLanguage}`);

    // Subscribe to vocabulary collection changes
    pb.collection('vocabulary').subscribe('*', (e) => {
      console.log('📡 Vocabulary real-time event:', e.action, e.record);
      
      // Only update if the change is for the current user and language
      const record = e.record as any;
      if (record.user === user.id && record.language === activeLanguage) {
        if (e.action === 'create') {
          setVocabulary(prev => {
            // Check if already exists to avoid duplicates
            if (prev.find(v => v.id === record.id)) return prev;
            return [record as unknown as VocabularyItem, ...prev];
          });
          setUpdateCounter(prev => prev + 1);
        } else if (e.action === 'update') {
          setVocabulary(prev => 
            prev.map(v => v.id === record.id ? record as unknown as VocabularyItem : v)
          );
          setUpdateCounter(prev => prev + 1);
        } else if (e.action === 'delete') {
          setVocabulary(prev => prev.filter(v => v.id !== record.id));
          setUpdateCounter(prev => prev + 1);
        }
      }
    });

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      console.log(`🔕 Unsubscribing from vocabulary updates`);
      pb.collection('vocabulary').unsubscribe('*');
    };
  }, [user, activeLanguage]);

  const getWordStatus = useCallback((word: string): WordStatus | null => {
    const normalizedWord = word.toLowerCase().trim();
    const item = vocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    return item ? (item.status as WordStatus) : null;
  }, [vocabulary]); // Added vocabulary as dependency

  const getWordData = useCallback((word: string): VocabularyItem | null => {
    const normalizedWord = word.toLowerCase().trim();
    return vocabulary.find(v => v.word.toLowerCase() === normalizedWord) || null;
  }, [vocabulary]);

  const addWord = useCallback(async (
    word: string,
    language: string,
    translation?: string,
    definition?: string,
    lessonId?: string
  ): Promise<VocabularyItem | null> => {
    if (!user) return null;

    const normalizedWord = word.toLowerCase().trim();
    
    // Check if word already exists
    const existing = vocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    if (existing) return existing;

    try {
      const newWord: any = {
        user: user.id,
        word: normalizedWord,
        language: language,
        status: 1,
        is_phrase: word.includes(' '),
        ease_factor: 2.3,
        interval_days: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      };

      if (translation) newWord.translation = translation;
      if (definition) newWord.definition = definition;
      if (lessonId) newWord.source_lesson = lessonId;

      console.log('✏️ Creating vocabulary:', newWord);
      const record = await pb.collection('vocabulary').create(newWord);
      const insertedItem = record as unknown as VocabularyItem;
      
      // Refetch to ensure UI is in sync
      await fetchVocabulary();
      
      return insertedItem;
    } catch (error) {
      console.error('❌ Error adding word:', error);
      return null;
    }
  }, [user, vocabulary, fetchVocabulary]);

  const updateWordStatus = useCallback(async (wordId: string, status: WordStatus) => {
    try {
      console.log(`🔄 Updating word status: ${wordId} -> ${status}`);
      await pb.collection('vocabulary').update(wordId, { status });
      
      // Immediately refetch to ensure UI updates
      await fetchVocabulary();
      
      console.log('✅ Status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating word status:', error);
      return false;
    }
  }, [fetchVocabulary]);

  const updateWordTranslation = useCallback(async (
    wordId: string,
    translation: string,
    definition?: string
  ) => {
    try {
      const updates: any = { translation };
      if (definition) updates.definition = definition;

      await pb.collection('vocabulary').update(wordId, updates);
      await fetchVocabulary();
      return true;
    } catch (error) {
      console.error('Error updating word:', error);
      return false;
    }
  }, [fetchVocabulary]);

  const markAsKnown = useCallback(async (word: string, language: string) => {
    const wordData = getWordData(word);
    if (wordData) {
      return updateWordStatus(wordData.id, 0);
    }
    
    if (!user) return false;
    
    try {
      const vocabData: any = {
        user: user.id,
        word: word.toLowerCase().trim(),
        language: language,
        status: 0,
        is_phrase: word.includes(' '),
        ease_factor: 2.3,
        interval_days: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      };

      console.log('✅ Marking word as known:', vocabData);
      await pb.collection('vocabulary').create(vocabData);
      await fetchVocabulary();
      return true;
    } catch (error) {
      console.error('Error marking word as known:', error);
      return false;
    }
  }, [user, getWordData, updateWordStatus, fetchVocabulary]);

  const ignoreWord = useCallback(async (word: string, language: string) => {
    const wordData = getWordData(word);
    if (wordData) {
      return updateWordStatus(wordData.id, -1);
    }
    
    if (!user) return false;
    
    try {
      const vocabData: any = {
        user: user.id,
        word: word.toLowerCase().trim(),
        language: language,
        status: -1,
        is_phrase: word.includes(' '),
        ease_factor: 2.3,
        interval_days: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      };

      console.log('🚫 Ignoring word:', vocabData);
      await pb.collection('vocabulary').create(vocabData);
      await fetchVocabulary();
      return true;
    } catch (error) {
      console.error('Error ignoring word:', error);
      return false;
    }
  }, [user, getWordData, updateWordStatus, fetchVocabulary]);

  const getKnownWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status === 0 || v.status === 5).length;
  }, [vocabulary]);

  const getLearningWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status >= 1 && v.status <= 4).length;
  }, [vocabulary]);

  const getIgnoredWordsCount = useCallback(() => {
    return vocabulary.filter(v => v.status === -1).length;
  }, [vocabulary]);

  const markAllWordsAsKnown = useCallback(async (words: string[], language: string) => {
    if (!user) return { success: false, markedCount: 0 };

    const normalizedWords = words.map(w => w.toLowerCase().trim()).filter(w => w.length > 0);
    const uniqueWords = [...new Set(normalizedWords)];

    const existingWordStrings = vocabulary.map(v => v.word.toLowerCase());
    const wordsToCreate = uniqueWords.filter(w => !existingWordStrings.includes(w));

    let markedCount = 0;

    if (wordsToCreate.length > 0) {
      try {
        for (const word of wordsToCreate) {
          const vocabData: any = {
            user: user.id,
            word,
            language: language,
            status: 0,
            is_phrase: word.includes(' '),
            ease_factor: 2.3,
            interval_days: 0,
            repetitions: 0,
            next_review_date: new Date().toISOString(),
          };
          
          await pb.collection('vocabulary').create(vocabData);
          markedCount++;
        }
      } catch (error) {
        console.error('Error marking words as known:', error);
      }
    }

    await fetchVocabulary();
    return { success: true, markedCount };
  }, [user, vocabulary, fetchVocabulary]);

  const resetLanguageProgress = useCallback(async (language: string) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      const vocabItems = await pb.collection('vocabulary').getFullList({
        filter: `user="${user.id}" && language="${language}"`,
      });

      for (const item of vocabItems) {
        await pb.collection('vocabulary').delete(item.id);
      }

      const lessons = await pb.collection('lessons').getFullList({
        filter: `created_by="${user.id}" && language="${language}"`,
        fields: 'id',
      });

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        for (const lessonId of lessonIds) {
          const sessions = await pb.collection('reading_sessions').getFullList({
            filter: `user="${user.id}" && lesson="${lessonId}"`,
          });
          for (const session of sessions) {
            await pb.collection('reading_sessions').delete(session.id);
          }
        }
      }

      if (language === activeLanguage) {
        await fetchVocabulary();
      }

      return { success: true, message: 'Progress reset successfully' };
    } catch (error) {
      console.error('Error resetting progress:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, activeLanguage, fetchVocabulary]);

  return {
    vocabulary,
    loading,
    updateCounter, // Expose this for UI to trigger re-renders
    getWordStatus,
    getWordData,
    addWord,
    updateWordStatus,
    updateWordTranslation,
    markAsKnown,
    ignoreWord,
    markAllWordsAsKnown,
    getKnownWordsCount,
    getLearningWordsCount,
    getIgnoredWordsCount,
    resetLanguageProgress,
    refetch: fetchVocabulary,
  };
}