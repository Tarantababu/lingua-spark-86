import PocketBase from 'pocketbase';

// Initialize PocketBase client
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false);

// Optional: Log auth state changes in development
if (import.meta.env.DEV) {
  pb.authStore.onChange((token, model) => {
    console.log('PocketBase auth changed:', { token: !!token, user: model?.email });
  });
}

// Types for our collections
export interface Profile {
  id: string;
  user: string;
  display_name?: string;
  native_language?: string;
  target_language?: string;
  daily_lingq_goal?: number;
  daily_reading_goal?: number;
  streak_count?: number;
  last_activity_date?: string;
  is_premium?: boolean;
  translation_preferences?: any;
  created: string;
  updated: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  description?: string;
  language: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content_type: 'article' | 'story' | 'dialogue' | 'news' | 'podcast' | 'other';
  topic?: string;
  audio_file?: string;
  word_count?: number;
  estimated_minutes?: number;
  is_archived?: boolean;
  is_premium?: boolean;
  created_by?: string;
  created: string;
  updated: string;
}

export interface VocabularyItem {
  id: string;
  user: string;
  word: string;
  language: string;
  translation?: string;
  definition?: string;
  notes?: string;
  status: number; // -1=ignored, 0=known, 1-4=learning, 5=mastered
  is_phrase?: boolean;
  ease_factor?: number;
  interval_days?: number;
  repetitions?: number;
  next_review_date?: string;
  last_reviewed_at?: string;
  source_lesson?: string;
  created: string;
  updated: string;
}

export interface ReadingSession {
  id: string;
  user: string;
  lesson: string;
  words_read?: number;
  reading_time_seconds?: number;
  listening_time_seconds?: number;
  lingqs_created?: number;
  completed_at?: string;
  created: string;
  updated: string;
}

export interface DailyStat {
  id: string;
  user: string;
  date: string;
  words_learned?: number;
  lingqs_created?: number;
  known_words_count?: number;
  reading_time_seconds?: number;
  listening_time_seconds?: number;
  created: string;
  updated: string;
}

// Helper function to get file URL
export function getFileUrl(record: any, filename: string): string {
  return pb.files.getURL(record, filename);
}

// Helper function to check if authenticated
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

// Helper function to get current user
export function getCurrentUser() {
  return pb.authStore.model;
}

// Helper function to logout
export function logout() {
  pb.authStore.clear();
}
