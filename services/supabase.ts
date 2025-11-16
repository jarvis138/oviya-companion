import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://mrmebjsuiaqeentaqeya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybWVianN1aWFxZWVudGFxZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTUwNDMsImV4cCI6MjA3ODg5MTA0M30.6i7En1hPLxn5qUi-4a07RqjuJovwjjH5cmbLuQprJwc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_emoji: string;
          created_at: string;
          updated_at: string;
          preferences: {
            notifications: boolean;
            soundEffects: boolean;
            hapticFeedback: boolean;
          };
          onboarding_completed: boolean;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_emoji?: string;
          created_at?: string;
          updated_at?: string;
          preferences?: {
            notifications: boolean;
            soundEffects: boolean;
            hapticFeedback: boolean;
          };
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_emoji?: string;
          created_at?: string;
          updated_at?: string;
          preferences?: {
            notifications: boolean;
            soundEffects: boolean;
            hapticFeedback: boolean;
          };
          onboarding_completed?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          parts: {
            type: 'text' | 'gif' | 'sticker';
            text?: string;
            url?: string;
            alt?: string;
            emoji?: string;
          }[];
          timestamp: number;
          reactions: {
            emoji: string;
            timestamp: number;
          }[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          parts: {
            type: 'text' | 'gif' | 'sticker';
            text?: string;
            url?: string;
            alt?: string;
            emoji?: string;
          }[];
          timestamp: number;
          reactions?: {
            emoji: string;
            timestamp: number;
          }[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          parts?: {
            type: 'text' | 'gif' | 'sticker';
            text?: string;
            url?: string;
            alt?: string;
            emoji?: string;
          }[];
          timestamp?: number;
          reactions?: {
            emoji: string;
            timestamp: number;
          }[] | null;
          created_at?: string;
        };
      };
      user_memory: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          preferences: Record<string, string>;
          important_facts: string[];
          first_met_date: number;
          last_active_date: number;
          stress_level: number;
          consecutive_stress_days: number;
          last_stress_date: number | null;
          celebrated_milestones: number[];
          saved_moments: string[];
          current_mood: 'playful' | 'reflective' | 'energetic' | 'cozy' | 'caring';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          preferences?: Record<string, string>;
          important_facts?: string[];
          first_met_date?: number;
          last_active_date?: number;
          stress_level?: number;
          consecutive_stress_days?: number;
          last_stress_date?: number | null;
          celebrated_milestones?: number[];
          saved_moments?: string[];
          current_mood?: 'playful' | 'reflective' | 'energetic' | 'cozy' | 'caring';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          preferences?: Record<string, string>;
          important_facts?: string[];
          first_met_date?: number;
          last_active_date?: number;
          stress_level?: number;
          consecutive_stress_days?: number;
          last_stress_date?: number | null;
          celebrated_milestones?: number[];
          saved_moments?: string[];
          current_mood?: 'playful' | 'reflective' | 'energetic' | 'cozy' | 'caring';
          created_at?: string;
          updated_at?: string;
        };
      };
      detected_strengths: {
        Row: {
          id: string;
          user_id: string;
          strength_type: string;
          context: string;
          quote: string;
          detected_at: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strength_type: string;
          context: string;
          quote: string;
          detected_at?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strength_type?: string;
          context?: string;
          quote?: string;
          detected_at?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
