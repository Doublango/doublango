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
      achievements: {
        Row: {
          crystal_reward: number | null
          description: string
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          crystal_reward?: number | null
          description: string
          icon_name?: string | null
          id?: string
          name: string
        }
        Update: {
          crystal_reward?: number | null
          description?: string
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          audio_url: string | null
          correct_answer: string
          exercise_order: number
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          hint: string | null
          id: string
          lesson_id: string
          options: Json | null
          question: string
        }
        Insert: {
          audio_url?: string | null
          correct_answer: string
          exercise_order: number
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          hint?: string | null
          id?: string
          lesson_id: string
          options?: Json | null
          question: string
        }
        Update: {
          audio_url?: string | null
          correct_answer?: string
          exercise_order?: number
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          hint?: string | null
          id?: string
          lesson_id?: string
          options?: Json | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          mistakes: number | null
          perfect_score: boolean | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          mistakes?: number | null
          perfect_score?: boolean | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          mistakes?: number | null
          perfect_score?: boolean | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          lesson_number: number
          title: string
          unit_id: string
          xp_reward: number | null
        }
        Insert: {
          id?: string
          lesson_number: number
          title: string
          unit_id: string
          xp_reward?: number | null
        }
        Update: {
          id?: string
          lesson_number?: number
          title?: string
          unit_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          daily_goal_xp: number | null
          display_name: string | null
          id: string
          motivation: string | null
          native_language: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal_xp?: number | null
          display_name?: string | null
          id: string
          motivation?: string | null
          native_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal_xp?: number | null
          display_name?: string | null
          id?: string
          motivation?: string | null
          native_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          crystal_reward: number | null
          description: string
          icon_name: string | null
          id: string
          quest_type: Database["public"]["Enums"]["quest_type"]
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          crystal_reward?: number | null
          description: string
          icon_name?: string | null
          id?: string
          quest_type: Database["public"]["Enums"]["quest_type"]
          target_value: number
          title: string
          xp_reward: number
        }
        Update: {
          crystal_reward?: number | null
          description?: string
          icon_name?: string | null
          id?: string
          quest_type?: Database["public"]["Enums"]["quest_type"]
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      units: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          description: string | null
          icon_name: string | null
          id: string
          language_code: Database["public"]["Enums"]["language_code"]
          title: string
          total_lessons: number | null
          unit_number: number
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          description?: string | null
          icon_name?: string | null
          id?: string
          language_code: Database["public"]["Enums"]["language_code"]
          title: string
          total_lessons?: number | null
          unit_number: number
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          description?: string | null
          icon_name?: string | null
          id?: string
          language_code?: Database["public"]["Enums"]["language_code"]
          title?: string
          total_lessons?: number | null
          unit_number?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_courses: {
        Row: {
          current_lesson: number | null
          current_unit: number | null
          id: string
          is_active: boolean | null
          language_code: Database["public"]["Enums"]["language_code"]
          last_practiced_at: string | null
          proficiency_level: Database["public"]["Enums"]["cefr_level"] | null
          started_at: string | null
          total_xp: number | null
          user_id: string
        }
        Insert: {
          current_lesson?: number | null
          current_unit?: number | null
          id?: string
          is_active?: boolean | null
          language_code: Database["public"]["Enums"]["language_code"]
          last_practiced_at?: string | null
          proficiency_level?: Database["public"]["Enums"]["cefr_level"] | null
          started_at?: string | null
          total_xp?: number | null
          user_id: string
        }
        Update: {
          current_lesson?: number | null
          current_unit?: number | null
          id?: string
          is_active?: boolean | null
          language_code?: Database["public"]["Enums"]["language_code"]
          last_practiced_at?: string | null
          proficiency_level?: Database["public"]["Enums"]["cefr_level"] | null
          started_at?: string | null
          total_xp?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          crystals: number | null
          current_streak: number | null
          id: string
          last_practice_date: string | null
          league_position: number | null
          lives: number | null
          lives_last_regenerated: string | null
          longest_streak: number | null
          streak_freeze_count: number | null
          today_xp: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          crystals?: number | null
          current_streak?: number | null
          id?: string
          last_practice_date?: string | null
          league_position?: number | null
          lives?: number | null
          lives_last_regenerated?: string | null
          longest_streak?: number | null
          streak_freeze_count?: number | null
          today_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          crystals?: number | null
          current_streak?: number | null
          id?: string
          last_practice_date?: string | null
          league_position?: number | null
          lives?: number | null
          lives_last_regenerated?: string | null
          longest_streak?: number | null
          streak_freeze_count?: number | null
          today_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          assigned_date: string | null
          completed_at: string | null
          current_progress: number | null
          id: string
          is_completed: boolean | null
          quest_id: string
          user_id: string
        }
        Insert: {
          assigned_date?: string | null
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          quest_id: string
          user_id: string
        }
        Update: {
          assigned_date?: string | null
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      exercise_type:
        | "multiple_choice"
        | "translation"
        | "match_pairs"
        | "fill_blank"
        | "type_what_you_hear"
        | "speak_answer"
        | "word_bank"
        | "select_sentence"
      language_code:
        | "es"
        | "fr"
        | "de"
        | "ja"
        | "it"
        | "ko"
        | "zh"
        | "pt"
        | "ru"
        | "ar"
        | "tr"
        | "nl"
        | "sv"
        | "ga"
        | "pl"
        | "hi"
        | "he"
        | "vi"
        | "el"
        | "no"
        | "da"
        | "ro"
        | "fi"
        | "cs"
        | "uk"
        | "cy"
        | "gd"
        | "hu"
        | "id"
        | "haw"
        | "nv"
        | "sw"
        | "eo"
        | "val"
        | "tlh"
        | "la"
        | "yi"
        | "ht"
        | "zu"
        | "ta"
        | "ca"
        | "th"
      quest_type: "daily" | "weekly" | "monthly"
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
    Enums: {
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      exercise_type: [
        "multiple_choice",
        "translation",
        "match_pairs",
        "fill_blank",
        "type_what_you_hear",
        "speak_answer",
        "word_bank",
        "select_sentence",
      ],
      language_code: [
        "es",
        "fr",
        "de",
        "ja",
        "it",
        "ko",
        "zh",
        "pt",
        "ru",
        "ar",
        "tr",
        "nl",
        "sv",
        "ga",
        "pl",
        "hi",
        "he",
        "vi",
        "el",
        "no",
        "da",
        "ro",
        "fi",
        "cs",
        "uk",
        "cy",
        "gd",
        "hu",
        "id",
        "haw",
        "nv",
        "sw",
        "eo",
        "val",
        "tlh",
        "la",
        "yi",
        "ht",
        "zu",
        "ta",
        "ca",
        "th",
      ],
      quest_type: ["daily", "weekly", "monthly"],
    },
  },
} as const
