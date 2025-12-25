export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_stats: {
        Row: {
          created_at: string
          date: string
          id: string
          known_words_count: number | null
          lingqs_created: number | null
          listening_time_seconds: number | null
          reading_time_seconds: number | null
          user_id: string
          words_learned: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          known_words_count?: number | null
          lingqs_created?: number | null
          listening_time_seconds?: number | null
          reading_time_seconds?: number | null
          user_id: string
          words_learned?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          known_words_count?: number | null
          lingqs_created?: number | null
          listening_time_seconds?: number | null
          reading_time_seconds?: number | null
          user_id?: string
          words_learned?: number | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          audio_url: string | null
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string
          estimated_minutes: number | null
          id: string
          is_archived: boolean
          is_premium: boolean | null
          language: string
          title: string
          topic: string | null
          word_count: number | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level: string
          estimated_minutes?: number | null
          id?: string
          is_archived?: boolean
          is_premium?: boolean | null
          language: string
          title: string
          topic?: string | null
          word_count?: number | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_minutes?: number | null
          id?: string
          is_archived?: boolean
          is_premium?: boolean | null
          language?: string
          title?: string
          topic?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_lingq_goal: number | null
          daily_reading_goal: number | null
          display_name: string | null
          id: string
          is_premium: boolean | null
          last_activity_date: string | null
          native_language: string | null
          streak_count: number | null
          target_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_lingq_goal?: number | null
          daily_reading_goal?: number | null
          display_name?: string | null
          id?: string
          is_premium?: boolean | null
          last_activity_date?: string | null
          native_language?: string | null
          streak_count?: number | null
          target_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_lingq_goal?: number | null
          daily_reading_goal?: number | null
          display_name?: string | null
          id?: string
          is_premium?: boolean | null
          last_activity_date?: string | null
          native_language?: string | null
          streak_count?: number | null
          target_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          lingqs_created: number | null
          listening_time_seconds: number | null
          reading_time_seconds: number | null
          user_id: string
          words_read: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          lingqs_created?: number | null
          listening_time_seconds?: number | null
          reading_time_seconds?: number | null
          user_id: string
          words_read?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          lingqs_created?: number | null
          listening_time_seconds?: number | null
          reading_time_seconds?: number | null
          user_id?: string
          words_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          created_at: string
          definition: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          is_phrase: boolean | null
          language: string
          last_reviewed_at: string | null
          next_review_date: string | null
          notes: string | null
          repetitions: number | null
          source_lesson_id: string | null
          status: number
          translation: string | null
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          is_phrase?: boolean | null
          language: string
          last_reviewed_at?: string | null
          next_review_date?: string | null
          notes?: string | null
          repetitions?: number | null
          source_lesson_id?: string | null
          status?: number
          translation?: string | null
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          is_phrase?: boolean | null
          language?: string
          last_reviewed_at?: string | null
          next_review_date?: string | null
          notes?: string | null
          repetitions?: number | null
          source_lesson_id?: string | null
          status?: number
          translation?: string | null
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
