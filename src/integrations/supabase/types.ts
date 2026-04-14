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
      adherence_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          microcycle_adherence: number | null
          nutrition_adherence: number | null
          sleep_adherence: number | null
          supplement_adherence: number | null
          total_adherence: number | null
          training_adherence: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          microcycle_adherence?: number | null
          nutrition_adherence?: number | null
          sleep_adherence?: number | null
          supplement_adherence?: number | null
          total_adherence?: number | null
          training_adherence?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          microcycle_adherence?: number | null
          nutrition_adherence?: number | null
          sleep_adherence?: number | null
          supplement_adherence?: number | null
          total_adherence?: number | null
          training_adherence?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adherence_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      adherence_metric_settings: {
        Row: {
          created_at: string
          id: string
          nutrition_enabled: boolean
          sleep_enabled: boolean
          supplements_enabled: boolean
          training_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nutrition_enabled?: boolean
          sleep_enabled?: boolean
          supplements_enabled?: boolean
          training_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nutrition_enabled?: boolean
          sleep_enabled?: boolean
          supplements_enabled?: boolean
          training_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_metrics: {
        Row: {
          created_at: string | null
          date: string
          fatigue_subjective: number | null
          id: string
          injuries_or_discomfort: string | null
          mental_load: string | null
          readiness_score: number | null
          sleep_hours: number | null
          sleep_quality: string | null
          stress_level: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          fatigue_subjective?: number | null
          id?: string
          injuries_or_discomfort?: string | null
          mental_load?: string | null
          readiness_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          fatigue_subjective?: number | null
          id?: string
          injuries_or_discomfort?: string | null
          mental_load?: string | null
          readiness_score?: number | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autoregulation_recommendations: {
        Row: {
          created_at: string
          exercise_id: string | null
          id: string
          recommendation_payload: Json | null
          recommendation_reason: string | null
          recommendation_type: string
          responded_at: string | null
          session_autoregulation_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          recommendation_payload?: Json | null
          recommendation_reason?: string | null
          recommendation_type: string
          responded_at?: string | null
          session_autoregulation_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          recommendation_payload?: Json | null
          recommendation_reason?: string | null
          recommendation_type?: string
          responded_at?: string | null
          session_autoregulation_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autoregulation_recommendations_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autoregulation_recommendations_session_autoregulation_id_fkey"
            columns: ["session_autoregulation_id"]
            isOneToOne: false
            referencedRelation: "session_autoregulation_state"
            referencedColumns: ["id"]
          },
        ]
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
      coach_conversations: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_conversations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          athlete_id: string
          coach_id: string
          context_type: string | null
          conversation_id: string
          created_at: string
          id: string
          is_system_message: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          context_type?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          context_type?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string | null
          id: string
          note: string | null
          priority: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          priority?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_performance_alerts: {
        Row: {
          alert_message: string | null
          alert_title: string | null
          alert_type: string | null
          created_at: string | null
          date: string
          id: string
          is_active: boolean | null
          severity: string | null
          user_id: string
        }
        Insert: {
          alert_message?: string | null
          alert_title?: string | null
          alert_type?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_active?: boolean | null
          severity?: string | null
          user_id: string
        }
        Update: {
          alert_message?: string | null
          alert_title?: string | null
          alert_type?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_active?: boolean | null
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_performance_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_training_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          deviation_score: number | null
          id: string
          microcycle_name: string | null
          notes: string | null
          planned: boolean | null
          session_type: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          deviation_score?: number | null
          id?: string
          microcycle_name?: string | null
          notes?: string | null
          planned?: boolean | null
          session_type?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          deviation_score?: number | null
          id?: string
          microcycle_name?: string | null
          notes?: string | null
          planned?: boolean | null
          session_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_sessions: {
        Row: {
          completed_at: string
          fatigue_score: number | null
          id: string
          microcycle_id: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          fatigue_score?: number | null
          id?: string
          microcycle_id?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          fatigue_score?: number | null
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
      custom_microcycle_exercises: {
        Row: {
          created_at: string
          exercise_catalog_id: string
          id: string
          microcycle_id: string
          order_index: number
          rep_range_max: number
          rep_range_min: number
          sets: number
        }
        Insert: {
          created_at?: string
          exercise_catalog_id: string
          id?: string
          microcycle_id: string
          order_index?: number
          rep_range_max?: number
          rep_range_min?: number
          sets?: number
        }
        Update: {
          created_at?: string
          exercise_catalog_id?: string
          id?: string
          microcycle_id?: string
          order_index?: number
          rep_range_max?: number
          rep_range_min?: number
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_microcycle_exercises_exercise_catalog_id_fkey"
            columns: ["exercise_catalog_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_microcycle_exercises_microcycle_id_fkey"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "custom_microcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_microcycles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          created_at: string
          date: string
          general_discomfort: number | null
          general_energy: number | null
          id: string
          mental_stress: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          general_discomfort?: number | null
          general_energy?: number | null
          id?: string
          mental_stress?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          general_discomfort?: number | null
          general_energy?: number | null
          id?: string
          mental_stress?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          user_id?: string
        }
        Relationships: []
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
      fatigue_state: {
        Row: {
          alert_level: string | null
          connective_fatigue: number | null
          created_at: string | null
          date: string
          global_fatigue: number | null
          id: string
          muscular_fatigue: number | null
          neuro_fatigue: number | null
          recovery_trend: string | null
          user_id: string
        }
        Insert: {
          alert_level?: string | null
          connective_fatigue?: number | null
          created_at?: string | null
          date: string
          global_fatigue?: number | null
          id?: string
          muscular_fatigue?: number | null
          neuro_fatigue?: number | null
          recovery_trend?: string | null
          user_id: string
        }
        Update: {
          alert_level?: string | null
          connective_fatigue?: number | null
          created_at?: string | null
          date?: string
          global_fatigue?: number | null
          id?: string
          muscular_fatigue?: number | null
          neuro_fatigue?: number | null
          recovery_trend?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fatigue_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          fatigue_index: number | null
          id: string
          mesocycle_id: string
          microcycle_number: number
          performance_trend: number | null
          recommendation: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          fatigue_index?: number | null
          id?: string
          mesocycle_id: string
          microcycle_number?: number
          performance_trend?: number | null
          recommendation?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          fatigue_index?: number | null
          id?: string
          mesocycle_id?: string
          microcycle_number?: number
          performance_trend?: number | null
          recommendation?: string | null
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
      nutrition_daily: {
        Row: {
          calories_actual: number | null
          calories_target: number | null
          carbs_actual: number | null
          carbs_target: number | null
          created_at: string | null
          date: string
          fats_actual: number | null
          fats_target: number | null
          hydration_status: string | null
          id: string
          protein_actual: number | null
          protein_target: number | null
          user_id: string
        }
        Insert: {
          calories_actual?: number | null
          calories_target?: number | null
          carbs_actual?: number | null
          carbs_target?: number | null
          created_at?: string | null
          date: string
          fats_actual?: number | null
          fats_target?: number | null
          hydration_status?: string | null
          id?: string
          protein_actual?: number | null
          protein_target?: number | null
          user_id: string
        }
        Update: {
          calories_actual?: number | null
          calories_target?: number | null
          carbs_actual?: number | null
          carbs_target?: number | null
          created_at?: string | null
          date?: string
          fats_actual?: number | null
          fats_target?: number | null
          hydration_status?: string | null
          id?: string
          protein_actual?: number | null
          protein_target?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      planning_mesocycles: {
        Row: {
          created_at: string
          duration_weeks: number
          goal: string | null
          id: string
          microcycle_count: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          goal?: string | null
          id?: string
          microcycle_count?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          goal?: string | null
          id?: string
          microcycle_count?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_microcycles: {
        Row: {
          created_at: string
          id: string
          mesocycle_id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          mesocycle_id: string
          name?: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          mesocycle_id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_microcycles_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "planning_mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_session_exercises: {
        Row: {
          created_at: string
          exercise_catalog_id: string
          id: string
          notes: string | null
          order_index: number
          rep_range_max: number
          rep_range_min: number
          session_id: string
          sets: number
        }
        Insert: {
          created_at?: string
          exercise_catalog_id: string
          id?: string
          notes?: string | null
          order_index?: number
          rep_range_max?: number
          rep_range_min?: number
          session_id: string
          sets?: number
        }
        Update: {
          created_at?: string
          exercise_catalog_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          rep_range_max?: number
          rep_range_min?: number
          session_id?: string
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_session_exercises_exercise_catalog_id_fkey"
            columns: ["exercise_catalog_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_sessions: {
        Row: {
          created_at: string
          id: string
          microcycle_id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          microcycle_id: string
          name?: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          microcycle_id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_sessions_microcycle_id_fkey"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "planning_microcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_workout_checkins: {
        Row: {
          available_time_minutes: number | null
          created_at: string
          expected_strength: number | null
          id: string
          local_fatigue_target_muscle: number | null
          session_id: string
          specific_pain_or_discomfort: number | null
          user_id: string
        }
        Insert: {
          available_time_minutes?: number | null
          created_at?: string
          expected_strength?: number | null
          id?: string
          local_fatigue_target_muscle?: number | null
          session_id: string
          specific_pain_or_discomfort?: number | null
          user_id: string
        }
        Update: {
          available_time_minutes?: number | null
          created_at?: string
          expected_strength?: number | null
          id?: string
          local_fatigue_target_muscle?: number | null
          session_id?: string
          specific_pain_or_discomfort?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_workout_checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_model: string | null
          age: number | null
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          disciplines: string[] | null
          display_name: string | null
          email: string | null
          full_name: string | null
          height: number | null
          id: string
          main_goal: string | null
          role: string | null
          updated_at: string
          user_id: string
          vb2_enabled: boolean | null
          weight: number | null
          years_training: string | null
        }
        Insert: {
          active_model?: string | null
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          disciplines?: string[] | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          main_goal?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          vb2_enabled?: boolean | null
          weight?: number | null
          years_training?: string | null
        }
        Update: {
          active_model?: string | null
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          disciplines?: string[] | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          main_goal?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          vb2_enabled?: boolean | null
          weight?: number | null
          years_training?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      session_autoregulation_state: {
        Row: {
          active_state: Json | null
          completed_session_id: string | null
          created_at: string
          id: string
          local_fatigue_score: number | null
          planned_state: Json | null
          readiness_score: number | null
          recommended_state: Json | null
          session_id: string
          started_at: string | null
          systemic_fatigue_score: number | null
          user_id: string
        }
        Insert: {
          active_state?: Json | null
          completed_session_id?: string | null
          created_at?: string
          id?: string
          local_fatigue_score?: number | null
          planned_state?: Json | null
          readiness_score?: number | null
          recommended_state?: Json | null
          session_id: string
          started_at?: string | null
          systemic_fatigue_score?: number | null
          user_id: string
        }
        Update: {
          active_state?: Json | null
          completed_session_id?: string | null
          created_at?: string
          id?: string
          local_fatigue_score?: number | null
          planned_state?: Json | null
          readiness_score?: number | null
          recommended_state?: Json | null
          session_id?: string
          started_at?: string | null
          systemic_fatigue_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_autoregulation_state_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_autoregulation_state_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercise_state: {
        Row: {
          active_rep_range: string | null
          active_rir: number | null
          active_sets: number | null
          autoregulation_state_id: string
          created_at: string
          exercise_id: string
          fatigue_cost: number | null
          id: string
          planned_rep_range: string
          planned_rir: number
          planned_sets: number
          recommended_rep_range: string | null
          recommended_rir: number | null
          recommended_sets: number | null
          substituted_by_exercise_id: string | null
          target_muscle_group: string | null
        }
        Insert: {
          active_rep_range?: string | null
          active_rir?: number | null
          active_sets?: number | null
          autoregulation_state_id: string
          created_at?: string
          exercise_id: string
          fatigue_cost?: number | null
          id?: string
          planned_rep_range: string
          planned_rir?: number
          planned_sets: number
          recommended_rep_range?: string | null
          recommended_rir?: number | null
          recommended_sets?: number | null
          substituted_by_exercise_id?: string | null
          target_muscle_group?: string | null
        }
        Update: {
          active_rep_range?: string | null
          active_rir?: number | null
          active_sets?: number | null
          autoregulation_state_id?: string
          created_at?: string
          exercise_id?: string
          fatigue_cost?: number | null
          id?: string
          planned_rep_range?: string
          planned_rir?: number
          planned_sets?: number
          recommended_rep_range?: string | null
          recommended_rir?: number | null
          recommended_sets?: number | null
          substituted_by_exercise_id?: string | null
          target_muscle_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercise_state_autoregulation_state_id_fkey"
            columns: ["autoregulation_state_id"]
            isOneToOne: false
            referencedRelation: "session_autoregulation_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercise_state_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercise_state_substituted_by_exercise_id_fkey"
            columns: ["substituted_by_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
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
          deviation_reason: string | null
          est_1rm_set: number | null
          exercise_id: string
          id: string
          iem_set: number | null
          is_warmup: boolean | null
          logged_at: string
          partial_reps: number | null
          reps: number
          rir: number | null
          rir_deviation: number | null
          set_number: number
          target_rir: number | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          deviation_reason?: string | null
          est_1rm_set?: number | null
          exercise_id: string
          id?: string
          iem_set?: number | null
          is_warmup?: boolean | null
          logged_at?: string
          partial_reps?: number | null
          reps: number
          rir?: number | null
          rir_deviation?: number | null
          set_number: number
          target_rir?: number | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          deviation_reason?: string | null
          est_1rm_set?: number | null
          exercise_id?: string
          id?: string
          iem_set?: number | null
          is_warmup?: boolean | null
          logged_at?: string
          partial_reps?: number | null
          reps?: number
          rir?: number | null
          rir_deviation?: number | null
          set_number?: number
          target_rir?: number | null
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
      sleep_logs: {
        Row: {
          awakenings: number | null
          bedtime: string | null
          created_at: string
          deep_sleep_minutes: number | null
          id: string
          light_sleep_minutes: number | null
          logged_date: string
          notes: string | null
          quality: number | null
          rem_sleep_minutes: number | null
          total_hours: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          awakenings?: number | null
          bedtime?: string | null
          created_at?: string
          deep_sleep_minutes?: number | null
          id?: string
          light_sleep_minutes?: number | null
          logged_date?: string
          notes?: string | null
          quality?: number | null
          rem_sleep_minutes?: number | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          awakenings?: number | null
          bedtime?: string | null
          created_at?: string
          deep_sleep_minutes?: number | null
          id?: string
          light_sleep_minutes?: number | null
          logged_date?: string
          notes?: string | null
          quality?: number | null
          rem_sleep_minutes?: number | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
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
          source_planning_mesocycle_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source_planning_mesocycle_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source_planning_mesocycle_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_source_planning_mesocycle_id_fkey"
            columns: ["source_planning_mesocycle_id"]
            isOneToOne: false
            referencedRelation: "planning_mesocycles"
            referencedColumns: ["id"]
          },
        ]
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
      user_training_baselines: {
        Row: {
          baseline_energy: number | null
          baseline_readiness: number | null
          baseline_sleep: number | null
          baseline_volume_tolerance: string
          created_at: string
          id: string
          training_experience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_energy?: number | null
          baseline_readiness?: number | null
          baseline_sleep?: number | null
          baseline_volume_tolerance?: string
          created_at?: string
          id?: string
          training_experience?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_energy?: number | null
          baseline_readiness?: number | null
          baseline_sleep?: number | null
          baseline_volume_tolerance?: string
          created_at?: string
          id?: string
          training_experience?: string
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
      get_coach_athlete_profiles: {
        Args: { _coach_auth_uid: string }
        Returns: {
          active_model: string
          age: number
          avatar_url: string
          coach_id: string
          created_at: string
          disciplines: string[]
          display_name: string
          full_name: string
          id: string
          main_goal: string
          role: string
          updated_at: string
          user_id: string
          vb2_enabled: boolean
          years_training: string
        }[]
      }
      get_profile_id: { Args: { _auth_uid: string }; Returns: string }
      get_user_role: { Args: { _auth_uid: string }; Returns: string }
      is_coach_of: {
        Args: { _athlete_profile_id: string; _coach_auth_uid: string }
        Returns: boolean
      }
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
