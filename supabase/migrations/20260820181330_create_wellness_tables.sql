/*
# Create mental wellness tracking tables

1. New Tables
- `mood_entries` — daily mood check-ins (mood score 1-5, energy, anxiety, notes)
- `assessments` — wellness assessment results (PHQ-style questionnaire with computed risk classification)
- `journal_entries` — reflective journal posts with optional sentiment tag
- `breathing_sessions` — logged breathing exercise completions

2. Security
- Single-tenant app (no sign-in). RLS enabled on all tables.
- All four CRUD policies per table scoped TO anon, authenticated with USING(true)/WITH CHECK(true)
  because the data is intentionally shared/public across the device.
*/

CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood int NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy int NOT NULL CHECK (energy BETWEEN 1 AND 5),
  anxiety int NOT NULL CHECK (anxiety BETWEEN 1 AND 5),
  sleep_hours numeric CHECK (sleep_hours IS NULL OR sleep_hours BETWEEN 0 AND 24),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mood" ON mood_entries;
CREATE POLICY "anon_select_mood" ON mood_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_mood" ON mood_entries;
CREATE POLICY "anon_insert_mood" ON mood_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_mood" ON mood_entries;
CREATE POLICY "anon_update_mood" ON mood_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_mood" ON mood_entries;
CREATE POLICY "anon_delete_mood" ON mood_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answers jsonb NOT NULL,
  score int NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('flourishing','balanced','at-risk','high-risk')),
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assessments" ON assessments;
CREATE POLICY "anon_select_assessments" ON assessments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assessments" ON assessments;
CREATE POLICY "anon_insert_assessments" ON assessments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assessments" ON assessments;
CREATE POLICY "anon_update_assessments" ON assessments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assessments" ON assessments;
CREATE POLICY "anon_delete_assessments" ON assessments FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  sentiment text CHECK (sentiment IS NULL OR sentiment IN ('positive','neutral','negative')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
CREATE POLICY "anon_select_journal" ON journal_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
CREATE POLICY "anon_insert_journal" ON journal_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
CREATE POLICY "anon_update_journal" ON journal_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;
CREATE POLICY "anon_delete_journal" ON journal_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS breathing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technique text NOT NULL,
  duration_seconds int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_breathing" ON breathing_sessions;
CREATE POLICY "anon_select_breathing" ON breathing_sessions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_breathing" ON breathing_sessions;
CREATE POLICY "anon_insert_breathing" ON breathing_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_breathing" ON breathing_sessions;
CREATE POLICY "anon_delete_breathing" ON breathing_sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mood_created_at ON mood_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_breathing_created_at ON breathing_sessions (created_at DESC);
