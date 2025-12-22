import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lesson } from '@/types';
import { toast } from 'sonner';

interface LessonFilters {
  difficulty?: string;
  contentType?: string;
  topic?: string;
}

interface UpdateLessonData {
  title?: string;
  description?: string;
  difficulty_level?: string;
  content_type?: string;
  content?: string;
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
      .eq('is_archived', false)
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

  const updateLesson = useCallback(async (id: string, updates: UpdateLessonData): Promise<boolean> => {
    const { error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
      return false;
    }

    toast.success('Lesson updated successfully');
    await fetchLessons();
    return true;
  }, [fetchLessons]);

  const archiveLesson = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lessons')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving lesson:', error);
      toast.error('Failed to archive lesson');
      return false;
    }

    toast.success('Lesson archived');
    await fetchLessons();
    return true;
  }, [fetchLessons]);

  const deleteLesson = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
      return false;
    }

    toast.success('Lesson deleted successfully');
    await fetchLessons();
    return true;
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    getLesson,
    updateLesson,
    archiveLesson,
    deleteLesson,
    refetch: fetchLessons,
  };
}
