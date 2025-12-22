export type WordStatus = -1 | 0 | 1 | 2 | 3 | 4 | 5;
// -1 = ignored (no highlight, excluded from stats)
// 0 = known (no highlight, counted as known)
// 1 = new (blue)
// 2 = learning level 1 (dark yellow)
// 3 = learning level 2 (medium yellow)
// 4 = learning level 3 (light yellow)
// 5 = learned (no highlight, counted as known)

export interface VocabularyItem {
  id: string;
  user_id: string;
  word: string;
  language: string;
  translation: string | null;
  definition: string | null;
  notes: string | null;
  status: WordStatus;
  is_phrase: boolean;
  source_lesson_id: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string;
  language: string;
  difficulty_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  content_type: 'article' | 'story' | 'news' | 'podcast' | 'mini_story';
  topic: string | null;
  word_count: number | null;
  estimated_minutes: number | null;
  audio_url: string | null;
  is_premium: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  native_language: string;
  target_language: string;
  daily_lingq_goal: number;
  daily_reading_goal: number;
  is_premium: boolean;
  streak_count: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  words_learned: number;
  lingqs_created: number;
  reading_time_seconds: number;
  listening_time_seconds: number;
  known_words_count: number;
  created_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  lesson_id: string;
  reading_time_seconds: number;
  listening_time_seconds: number;
  words_read: number;
  lingqs_created: number;
  completed_at: string | null;
  created_at: string;
}
