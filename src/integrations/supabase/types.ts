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
      activity_completions: {
        Row: {
          activity_name: string
          activity_type: string
          completed_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_name: string
          activity_type: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_name?: string
          activity_type?: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cardio_session_intervals: {
        Row: {
          created_at: string
          distance_m: number
          duration_seconds: number | null
          id: string
          interval_order: number
          notes: string | null
          pace_seconds_per_unit: number | null
          pace_unit_m: number
          rest_seconds: number | null
          session_log_id: string
        }
        Insert: {
          created_at?: string
          distance_m: number
          duration_seconds?: number | null
          id?: string
          interval_order?: number
          notes?: string | null
          pace_seconds_per_unit?: number | null
          pace_unit_m?: number
          rest_seconds?: number | null
          session_log_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number
          duration_seconds?: number | null
          id?: string
          interval_order?: number
          notes?: string | null
          pace_seconds_per_unit?: number | null
          pace_unit_m?: number
          rest_seconds?: number | null
          session_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_session_intervals_session_log_id_fkey"
            columns: ["session_log_id"]
            isOneToOne: false
            referencedRelation: "cardio_session_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_session_logs: {
        Row: {
          activity_type: string
          avg_pace_seconds_per_unit: number | null
          completed_at: string
          created_at: string
          id: string
          notes: string | null
          session_name: string | null
          total_distance_m: number
          total_duration_seconds: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          avg_pace_seconds_per_unit?: number | null
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_name?: string | null
          total_distance_m?: number
          total_duration_seconds?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          avg_pace_seconds_per_unit?: number | null
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_name?: string | null
          total_distance_m?: number
          total_duration_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      completed_sessions: {
        Row: {
          completed_at: string
          id: string
          microcycle_id: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          microcycle_id?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          microcycle_id?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_sessions_microcycle_id_fkey"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "microcycles"
            referencedColumns: ["id"]
          },
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
      food_catalog: {
        Row: {
          brand: string | null
          calories_per_100g: number
          carbs_per_100g: number
          category: string | null
          created_at: string
          fat_per_100g: number
          fiber_per_100g: number | null
          id: string
          is_default: boolean | null
          name: string
          protein_per_100g: number
          serving_size: number | null
          serving_unit: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          protein_per_100g?: number
          serving_size?: number | null
          serving_unit?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          protein_per_100g?: number
          serving_size?: number | null
          serving_unit?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          food_id: string | null
          food_name: string
          id: string
          logged_date: string
          meal_type: string
          protein: number
          quantity: number
          unit: string | null
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_id?: string | null
          food_name: string
          id?: string
          logged_date?: string
          meal_type: string
          protein?: number
          quantity?: number
          unit?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_id?: string | null
          food_name?: string
          id?: string
          logged_date?: string
          meal_type?: string
          protein?: number
          quantity?: number
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          mesocycle_number: number
          program_id: string
          start_date: string
          status: string
          total_microcycles: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          mesocycle_number?: number
          program_id: string
          start_date?: string
          status?: string
          total_microcycles?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          mesocycle_number?: number
          program_id?: string
          start_date?: string
          status?: string
          total_microcycles?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesocycles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      microcycles: {
        Row: {
          created_at: string
          duration_weeks: number
          end_date: string | null
          id: string
          mesocycle_id: string
          microcycle_number: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          mesocycle_id: string
          microcycle_number?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          mesocycle_id?: string
          microcycle_number?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "microcycles_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_fatigue_states: {
        Row: {
          current_fatigue_value: number
          hours_remaining_estimate: number | null
          id: string
          last_updated_at: string
          muscle_id: string
          user_id: string
        }
        Insert: {
          current_fatigue_value?: number
          hours_remaining_estimate?: number | null
          id?: string
          last_updated_at?: string
          muscle_id: string
          user_id: string
        }
        Update: {
          current_fatigue_value?: number
          hours_remaining_estimate?: number | null
          id?: string
          last_updated_at?: string
          muscle_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muscle_fatigue_states_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
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
      muscle_load_logs: {
        Row: {
          created_at: string
          id: string
          load_amount: number
          muscle_id: string
          session_date: string
          source_modality: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          load_amount?: number
          muscle_id: string
          session_date?: string
          source_modality?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          load_amount?: number
          muscle_id?: string
          session_date?: string
          source_modality?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muscle_load_logs_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          created_at: string
          daily_calories: number
          daily_carbs: number
          daily_fat: number
          daily_protein: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          metadata: Json | null
          read_flag: boolean
          severity: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_flag?: boolean
          severity?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_flag?: boolean
          severity?: string
          user_id?: string
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
      recipes: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          description: string | null
          fat: number
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string[] | null
          is_default: boolean | null
          meal_type: string[] | null
          name: string
          prep_time_minutes: number | null
          protein: number
          servings: number | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          description?: string | null
          fat?: number
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_default?: boolean | null
          meal_type?: string[] | null
          name: string
          prep_time_minutes?: number | null
          protein?: number
          servings?: number | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          description?: string | null
          fat?: number
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_default?: boolean | null
          meal_type?: string[] | null
          name?: string
          prep_time_minutes?: number | null
          protein?: number
          servings?: number | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_exercise_summary: {
        Row: {
          adjusted_pct: number | null
          baseline: number | null
          created_at: string
          exercise_id: string
          id: string
          pct_change: number | null
          session_date: string
          session_est_1rm: number
          session_iem: number
          user_id: string
        }
        Insert: {
          adjusted_pct?: number | null
          baseline?: number | null
          created_at?: string
          exercise_id: string
          id?: string
          pct_change?: number | null
          session_date: string
          session_est_1rm?: number
          session_iem?: number
          user_id: string
        }
        Update: {
          adjusted_pct?: number | null
          baseline?: number | null
          created_at?: string
          exercise_id?: string
          id?: string
          pct_change?: number | null
          session_date?: string
          session_est_1rm?: number
          session_iem?: number
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          created_at: string
          est_1rm_set: number | null
          exercise_id: string
          id: string
          iem_set: number | null
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
          est_1rm_set?: number | null
          exercise_id: string
          id?: string
          iem_set?: number | null
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
          est_1rm_set?: number | null
          exercise_id?: string
          id?: string
          iem_set?: number | null
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
      supplement_logs: {
        Row: {
          id: string
          logged_date: string
          supplement_id: string | null
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_date?: string
          supplement_id?: string | null
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_date?: string
          supplement_id?: string | null
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_notification_history: {
        Row: {
          action_at: string | null
          action_taken: string | null
          id: string
          reminder_id: string | null
          sent_at: string
          supplement_id: string | null
          user_id: string
        }
        Insert: {
          action_at?: string | null
          action_taken?: string | null
          id?: string
          reminder_id?: string | null
          sent_at?: string
          supplement_id?: string | null
          user_id: string
        }
        Update: {
          action_at?: string | null
          action_taken?: string | null
          id?: string
          reminder_id?: string | null
          sent_at?: string
          supplement_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_notification_history_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "supplement_reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_notification_history_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_reminders: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          reminder_times: string[]
          sound_enabled: boolean
          supplement_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          reminder_times?: string[]
          sound_enabled?: boolean
          supplement_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          reminder_times?: string[]
          sound_enabled?: boolean
          supplement_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_reminders_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
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
      user_supplements: {
        Row: {
          created_at: string
          dosage: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          timing: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          timing?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          timing?: string | null
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
