import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lesson } from '@/types';

interface LessonFilters {
  difficulty?: string;
  contentType?: string;
  topic?: string;
}

export function useLessons(filters?: LessonFilters) {
  const { targetLanguage } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('language', targetLanguage)
      .order('created_at', { ascending: false });

    if (filters?.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }
    if (filters?.contentType) {
      query = query.eq('content_type', filters.contentType);
    }
    if (filters?.topic) {
      query = query.eq('topic', filters.topic);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lessons:', error);
    } else {
      setLessons((data || []) as Lesson[]);
    }
    setLoading(false);
  }, [targetLanguage, filters?.difficulty, filters?.contentType, filters?.topic]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const getLesson = useCallback(async (id: string): Promise<Lesson | null> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson:', error);
      return null;
    }
    return data as Lesson | null;
  }, []);

  return {
    lessons,
    loading,
    getLesson,
    refetch: fetchLessons,
  };
}
