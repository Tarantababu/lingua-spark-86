import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VocabularyItem, WordStatus } from '@/types';

// SM-2 Algorithm implementation
// Quality: 0-5 (0-2 = fail, 3-5 = success)
// Returns new interval, repetitions, and ease factor

interface SRSResult {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export function calculateSRS(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SRSResult {
  let newInterval: number;
  let newRepetitions: number;
  let newEaseFactor: number;

  // Quality should be 0-5
  const q = Math.max(0, Math.min(5, quality));

  if (q < 3) {
    // Failed recall - reset
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = easeFactor;
  } else {
    // Successful recall
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    newRepetitions = repetitions + 1;
    
    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    
    // Minimum ease factor of 1.3
    newEaseFactor = Math.max(1.3, newEaseFactor);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    nextReviewDate,
  };
}

export function useSRS() {
  const processReview = useCallback(async (
    word: VocabularyItem,
    quality: number // 0-5: 0=complete blackout, 5=perfect response
  ): Promise<boolean> => {
    const result = calculateSRS(
      quality,
      word.repetitions,
      word.ease_factor,
      word.interval_days
    );

    // Determine new status based on repetitions
    let newStatus: WordStatus = word.status as WordStatus;
    if (quality < 3) {
      // Failed - go back to learning
      newStatus = Math.max(1, word.status - 1) as WordStatus;
    } else if (result.repetitions >= 4) {
      // Mastered
      newStatus = 5 as WordStatus;
    } else if (result.repetitions >= 2) {
      // Good progress
      newStatus = Math.min(4, word.status + 1) as WordStatus;
    }

    const { error } = await supabase
      .from('vocabulary')
      .update({
        interval_days: result.interval,
        repetitions: result.repetitions,
        ease_factor: result.easeFactor,
        next_review_date: result.nextReviewDate.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', word.id);

    if (error) {
      console.error('Error updating SRS:', error);
      return false;
    }

    return true;
  }, []);

  const getDueCards = useCallback(async (userId: string, language: string): Promise<VocabularyItem[]> => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .gt('status', 0) // Only learning words
      .lt('status', 5) // Not yet mastered
      .lte('next_review_date', now)
      .order('next_review_date', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching due cards:', error);
      return [];
    }

    return (data || []) as VocabularyItem[];
  }, []);

  const getNewCards = useCallback(async (userId: string, language: string, limit: number = 10): Promise<VocabularyItem[]> => {
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .eq('status', 1) // New words
      .eq('repetitions', 0) // Never reviewed
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching new cards:', error);
      return [];
    }

    return (data || []) as VocabularyItem[];
  }, []);

  return {
    processReview,
    getDueCards,
    getNewCards,
    calculateSRS,
  };
}
