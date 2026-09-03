import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, type JournalEntry, type MoodEntry, type Assessment, type ChatMessageRow } from './supabase';

const KEYS = {
  JOURNAL: '@mindspace_journal_entries',
  MOOD: '@mindspace_mood_entries',
  ASSESSMENT: '@mindspace_assessments',
  CHAT: '@mindspace_chat_messages',
};

// --- Journal Entries ---
export async function getLocalJournalEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.JOURNAL);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalJournalEntries(entries: JournalEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save local journal entries', e);
  }
}

export async function fetchJournalEntries(): Promise<{ data: JournalEntry[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      await saveLocalJournalEntries(data);
      return { data, error: null };
    }
    const local = await getLocalJournalEntries();
    return { data: local, error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalJournalEntries();
    return { data: local, error: e?.message ?? 'Network error' };
  }
}

export async function createJournalEntry(params: {
  title: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
}): Promise<{ data: JournalEntry; error: string | null }> {
  const tempEntry: JournalEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: params.title.trim() || 'Untitled',
    body: params.body.trim(),
    sentiment: params.sentiment,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        title: tempEntry.title,
        body: tempEntry.body,
        sentiment: tempEntry.sentiment,
      })
      .select()
      .single();

    if (!error && data) {
      const local = await getLocalJournalEntries();
      const updated = [data, ...local.filter((x) => x.id !== data.id && x.id !== tempEntry.id)];
      await saveLocalJournalEntries(updated);
      return { data, error: null };
    }

    // Fallback save to local storage
    const local = await getLocalJournalEntries();
    const updated = [tempEntry, ...local];
    await saveLocalJournalEntries(updated);
    return { data: tempEntry, error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalJournalEntries();
    const updated = [tempEntry, ...local];
    await saveLocalJournalEntries(updated);
    return { data: tempEntry, error: e?.message ?? null };
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    if (!id.startsWith('local_')) {
      await supabase.from('journal_entries').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('Remote delete failed, deleting locally', e);
  }
  const local = await getLocalJournalEntries();
  await saveLocalJournalEntries(local.filter((e) => e.id !== id));
}

// --- Mood Entries ---
export async function getLocalMoodEntries(): Promise<MoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MOOD);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalMoodEntries(entries: MoodEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.MOOD, JSON.stringify(entries));
  } catch {}
}

export async function fetchMoodEntries(limit = 10): Promise<{ data: MoodEntry[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      await saveLocalMoodEntries(data);
      return { data, error: null };
    }
    const local = await getLocalMoodEntries();
    return { data: local.slice(0, limit), error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalMoodEntries();
    return { data: local.slice(0, limit), error: e?.message ?? null };
  }
}

export async function createMoodEntry(params: {
  mood: number;
  energy: number;
  anxiety: number;
  sleep_hours: number | null;
  note: string | null;
}): Promise<{ data: MoodEntry; error: string | null }> {
  const tempEntry: MoodEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    mood: params.mood,
    energy: params.energy,
    anxiety: params.anxiety,
    sleep_hours: params.sleep_hours,
    note: params.note,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        mood: params.mood,
        energy: params.energy,
        anxiety: params.anxiety,
        sleep_hours: params.sleep_hours,
        note: params.note,
      })
      .select()
      .single();

    if (!error && data) {
      const local = await getLocalMoodEntries();
      const updated = [data, ...local.filter((x) => x.id !== data.id && x.id !== tempEntry.id)];
      await saveLocalMoodEntries(updated);
      return { data, error: null };
    }

    const local = await getLocalMoodEntries();
    const updated = [tempEntry, ...local];
    await saveLocalMoodEntries(updated);
    return { data: tempEntry, error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalMoodEntries();
    const updated = [tempEntry, ...local];
    await saveLocalMoodEntries(updated);
    return { data: tempEntry, error: e?.message ?? null };
  }
}

// --- Assessment Entries ---
export async function getLocalAssessments(): Promise<Assessment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ASSESSMENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalAssessments(entries: Assessment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ASSESSMENT, JSON.stringify(entries));
  } catch {}
}

export async function fetchAssessments(limit = 10): Promise<{ data: Assessment[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      await saveLocalAssessments(data);
      return { data, error: null };
    }
    const local = await getLocalAssessments();
    return { data: local.slice(0, limit), error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalAssessments();
    return { data: local.slice(0, limit), error: e?.message ?? null };
  }
}

export async function createAssessment(params: {
  answers: Record<number, number>;
  score: number;
  risk_level: any;
  summary: string | null;
}): Promise<{ data: Assessment; error: string | null }> {
  const tempEntry: Assessment = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    answers: params.answers,
    score: params.score,
    risk_level: params.risk_level,
    summary: params.summary,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        answers: params.answers,
        score: params.score,
        risk_level: params.risk_level,
        summary: params.summary,
      })
      .select()
      .single();

    if (!error && data) {
      const local = await getLocalAssessments();
      const updated = [data, ...local.filter((x) => x.id !== data.id && x.id !== tempEntry.id)];
      await saveLocalAssessments(updated);
      return { data, error: null };
    }

    const local = await getLocalAssessments();
    const updated = [tempEntry, ...local];
    await saveLocalAssessments(updated);
    return { data: tempEntry, error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalAssessments();
    const updated = [tempEntry, ...local];
    await saveLocalAssessments(updated);
    return { data: tempEntry, error: e?.message ?? null };
  }
}

// --- Chat Messages ---
export async function getLocalChatMessages(): Promise<ChatMessageRow[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHAT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalChatMessages(messages: ChatMessageRow[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CHAT, JSON.stringify(messages));
  } catch {}
}

export async function fetchChatMessages(limit = 100): Promise<{ data: ChatMessageRow[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (!error && data) {
      await saveLocalChatMessages(data);
      return { data, error: null };
    }
    const local = await getLocalChatMessages();
    return { data: local.slice(-limit), error: error ? error.message : null };
  } catch (e: any) {
    const local = await getLocalChatMessages();
    return { data: local.slice(-limit), error: e?.message ?? null };
  }
}

export async function recordChatMessage(params: {
  role: 'user' | 'assistant';
  content: string;
}): Promise<ChatMessageRow> {
  const tempMsg: ChatMessageRow = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    role: params.role,
    content: params.content,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        role: params.role,
        content: params.content,
      })
      .select()
      .single();

    if (!error && data) {
      const local = await getLocalChatMessages();
      await saveLocalChatMessages([...local, data]);
      return data;
    }
  } catch {}

  const local = await getLocalChatMessages();
  await saveLocalChatMessages([...local, tempMsg]);
  return tempMsg;
}
