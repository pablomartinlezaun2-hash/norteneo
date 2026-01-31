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
      completed_sessions: {
        Row: {
          completed_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_articles: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          order_index: number
          slug: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          order_index?: number
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          order_index?: number
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "educational_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "educational_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      exercise_catalog: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          equipment: string[] | null
          execution: string | null
          id: string
          image_url: string | null
          is_compound: boolean | null
          name: string
          primary_muscle_id: string | null
          resistance_profile: string | null
          secondary_muscles: string[] | null
          slug: string
          strength_curve: string | null
          tips: string[] | null
          variants: string[] | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          execution?: string | null
          id?: string
          image_url?: string | null
          is_compound?: boolean | null
          name: string
          primary_muscle_id?: string | null
          resistance_profile?: string | null
          secondary_muscles?: string[] | null
          slug: string
          strength_curve?: string | null
          tips?: string[] | null
          variants?: string[] | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          execution?: string | null
          id?: string
          image_url?: string | null
          is_compound?: boolean | null
          name?: string
          primary_muscle_id?: string | null
          resistance_profile?: string | null
          secondary_muscles?: string[] | null
          slug?: string
          strength_curve?: string | null
          tips?: string[] | null
          variants?: string[] | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_catalog_primary_muscle_id_fkey"
            columns: ["primary_muscle_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_notes: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_notes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          approach_sets: string | null
          created_at: string
          execution: string | null
          id: string
          name: string
          order_index: number
          reps: string
          rest: string | null
          series: number
          session_id: string
          technique: string | null
          video_url: string | null
        }
        Insert: {
          approach_sets?: string | null
          created_at?: string
          execution?: string | null
          id?: string
          name: string
          order_index?: number
          reps: string
          rest?: string | null
          series?: number
          session_id: string
          technique?: string | null
          video_url?: string | null
        }
        Update: {
          approach_sets?: string | null
          created_at?: string
          execution?: string | null
          id?: string
          name?: string
          order_index?: number
          reps?: string
          rest?: string | null
          series?: number
          session_id?: string
          technique?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          category: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_warmup: boolean | null
          logged_at: string
          partial_reps: number | null
          reps: number
          rir: number | null
          set_number: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_warmup?: boolean | null
          logged_at?: string
          partial_reps?: number | null
          reps: number
          rir?: number | null
          set_number: number
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_warmup?: boolean | null
          logged_at?: string
          partial_reps?: number | null
          reps?: number
          rir?: number | null
          set_number?: number
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          program_id: string
          short_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          program_id: string
          short_name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          program_id?: string
          short_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
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
