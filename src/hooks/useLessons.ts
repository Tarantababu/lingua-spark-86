import { useState, useEffect, useCallback } from 'react';
import { pb, getFileUrl } from '@/lib/pocketbase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lesson } from '@/types';
import { toast } from 'sonner';
import { generateLessonAudio } from '@/api/openai';

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
    
    try {
      let filterString = `language="${targetLanguage}" && is_archived=false`;
      
      if (filters?.difficulty) {
        filterString += ` && difficulty_level="${filters.difficulty}"`;
      }
      if (filters?.contentType) {
        filterString += ` && content_type="${filters.contentType}"`;
      }
      if (filters?.topic) {
        filterString += ` && topic="${filters.topic}"`;
      }

      const records = await pb.collection('lessons').getFullList({
        filter: filterString,
        sort: '-created',
      });

      // Map PocketBase records to Lesson type and add audio URLs
      const lessonsWithUrls = records.map((record: any) => ({
        ...record,
        audio_url: record.audio_file ? getFileUrl(record, record.audio_file) : null,
        created_at: record.created,
        updated_at: record.updated,
      })) as Lesson[];

      setLessons(lessonsWithUrls);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
    setLoading(false);
  }, [targetLanguage, filters?.difficulty, filters?.contentType, filters?.topic]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Real-time subscription for lesson updates
  useEffect(() => {
    if (!targetLanguage) return;

    console.log(`🔔 Subscribing to lessons updates for language: ${targetLanguage}`);

    // Subscribe to lessons collection changes
    pb.collection('lessons').subscribe('*', (e) => {
      console.log('📡 Lesson real-time event:', e.action, e.record);
      
      const record = e.record as any;
      
      // Only update if the change is for the current language and not archived (or if it's being archived)
      if (record.language === targetLanguage) {
        if (e.action === 'create' && !record.is_archived) {
          setLessons(prev => {
            // Check if already exists to avoid duplicates
            if (prev.find(l => l.id === record.id)) return prev;
            
            const newLesson = {
              ...record,
              audio_url: record.audio_file ? getFileUrl(record, record.audio_file) : null,
              created_at: record.created,
              updated_at: record.updated,
            } as Lesson;
            
            return [newLesson, ...prev];
          });
        } else if (e.action === 'update') {
          setLessons(prev => {
            // If lesson is now archived, remove it from the list
            if (record.is_archived) {
              return prev.filter(l => l.id !== record.id);
            }
            
            // Otherwise update it
            return prev.map(l => l.id === record.id ? {
              ...record,
              audio_url: record.audio_file ? getFileUrl(record, record.audio_file) : null,
              created_at: record.created,
              updated_at: record.updated,
            } as Lesson : l);
          });
        } else if (e.action === 'delete') {
          setLessons(prev => prev.filter(l => l.id !== record.id));
        }
      }
    });

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      console.log(`🔕 Unsubscribing from lessons updates`);
      pb.collection('lessons').unsubscribe('*');
    };
  }, [targetLanguage]);

  const getLesson = useCallback(async (id: string): Promise<Lesson | null> => {
    try {
      const record = await pb.collection('lessons').getOne(id);
      return {
        ...record,
        audio_url: record.audio_file ? getFileUrl(record, record.audio_file) : null,
        created_at: record.created,
        updated_at: record.updated,
      } as any;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      return null;
    }
  }, []);

  const updateLesson = useCallback(async (id: string, updates: UpdateLessonData): Promise<boolean> => {
    try {
      await pb.collection('lessons').update(id, updates);
      toast.success('Lesson updated successfully');
      await fetchLessons();
      return true;
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
      return false;
    }
  }, [fetchLessons]);

  const archiveLesson = useCallback(async (id: string): Promise<boolean> => {
    try {
      await pb.collection('lessons').update(id, { 
        is_archived: true,
        audio_file: '', // Clear audio file
      });
      toast.success('Lesson archived');
      await fetchLessons();
      return true;
    } catch (error) {
      console.error('Error archiving lesson:', error);
      toast.error('Failed to archive lesson');
      return false;
    }
  }, [fetchLessons]);

  const generateAudio = useCallback(async (id: string, content: string, language: string): Promise<string | null> => {
    toast.loading('Generating audio...', { id: 'audio-gen' });
    
    try {
      // Generate audio using OpenAI
      const audioBlob = await generateLessonAudio(content);
      
      // Create FormData to upload audio file
      const formData = new FormData();
      formData.append('audio_file', audioBlob, `${id}.mp3`);

      // Update lesson with audio file
      const updatedRecord = await pb.collection('lessons').update(id, formData);
      
      const audioUrl = updatedRecord.audio_file ? getFileUrl(updatedRecord, updatedRecord.audio_file) : null;
      
      toast.success('Audio generated!', { id: 'audio-gen' });
      await fetchLessons();
      return audioUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio', { id: 'audio-gen' });
      return null;
    }
  }, [fetchLessons]);

  const deleteLesson = useCallback(async (id: string): Promise<boolean> => {
    try {
      await pb.collection('lessons').delete(id);
      toast.success('Lesson deleted successfully');
      await fetchLessons();
      return true;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
      return false;
    }
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    getLesson,
    updateLesson,
    archiveLesson,
    deleteLesson,
    generateLessonAudio: generateAudio,
    refetch: fetchLessons,
  };
}
