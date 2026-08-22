/*
# Create chat_messages table for AI helper chat

1. New Tables
- `chat_messages` — stores conversation messages between the user and the AI wellness helper
  - role: 'user' or 'assistant'
  - content: the message text
  - created_at: timestamp

2. Security
- Single-tenant app (no sign-in). RLS enabled.
- All four CRUD policies scoped TO anon, authenticated with USING(true)/WITH CHECK(true)
  because the data is intentionally shared/public across the device.
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat" ON chat_messages;
CREATE POLICY "anon_select_chat" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat" ON chat_messages;
CREATE POLICY "anon_insert_chat" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat" ON chat_messages;
CREATE POLICY "anon_delete_chat" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages (created_at ASC);
