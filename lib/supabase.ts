import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export type MoodEntry = {
  id: string;
  mood: number;
  energy: number;
  anxiety: number;
  sleep_hours: number | null;
  note: string | null;
  created_at: string;
};

export type RiskLevel = 'flourishing' | 'balanced' | 'at-risk' | 'high-risk';

export type Assessment = {
  id: string;
  answers: Record<number, number>;
  score: number;
  risk_level: RiskLevel;
  summary: string | null;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
};

export type BreathingSession = {
  id: string;
  technique: string;
  duration_seconds: number;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};
