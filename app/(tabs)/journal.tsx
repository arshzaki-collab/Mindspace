import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Sparkles } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, type JournalEntry } from '@/lib/supabase';

// Simple keyword-based sentiment classifier (on-device "feature engineering").
const POSITIVE_WORDS = ['happy', 'grateful', 'hope', 'joy', 'calm', 'peace', 'love', 'good', 'great', 'proud', 'excited', 'thankful', 'better', 'progress', 'smile'];
const NEGATIVE_WORDS = ['sad', 'anxious', 'worried', 'angry', 'fear', 'hopeless', 'stressed', 'tired', 'alone', 'pain', 'struggle', 'difficult', 'bad', 'hurt', 'lost'];

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 1;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

const SENTIMENT_META = {
  positive: { label: 'Positive', color: Colors.success, bg: '#DCFCE7' },
  neutral: { label: 'Neutral', color: Colors.neutral[600], bg: Colors.neutral[200] },
  negative: { label: 'Reflective', color: Colors.warning, bg: '#FEF3C7' },
};

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSave = async () => {
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const sentiment = analyzeSentiment(body);
    const { error: err } = await supabase.from('journal_entries').insert({
      title: title.trim() || 'Untitled',
      body: body.trim(),
      sentiment,
    });
    setSaving(false);
    if (err) {
      setError('Could not save your entry. Please try again.');
      return;
    }
    setTitle('');
    setBody('');
    setWriting(false);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id);
    loadEntries();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            eyebrow="Reflect"
            title="Your journal"
            subtitle="A private place to put thoughts into words and notice patterns over time."
            action={!writing ? { label: 'New entry', icon: <Plus size={15} color={Colors.neutral[700]} />, onPress: () => setWriting(true) } : undefined}
          />

          {writing && (
            <Card style={{ marginTop: Spacing.md }}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Entry title"
                placeholderTextColor={Colors.neutral[400]}
              />
              <TextInput
                style={styles.bodyInput}
                value={body}
                onChangeText={setBody}
                placeholder="Write what's on your mind..."
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.writeActions}>
                <Pressable style={styles.cancelButton} onPress={() => { setWriting(false); setTitle(''); setBody(''); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.saveEntryButton, (!body.trim() || saving) && { opacity: 0.5 }]} onPress={handleSave} disabled={!body.trim() || saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Sparkles size={16} color={Colors.white} />
                      <Text style={styles.saveEntryText}>Save</Text>
                    </>
                  )}
                </Pressable>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </Card>
          )}

          <Text style={styles.sectionTitle}>Your Entries ({entries.length})</Text>

          {loading ? (
            <ActivityIndicator color={Colors.primary[600]} style={{ marginTop: Spacing.md }} />
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>Tap the + button above to start writing.</Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {entries.map((entry) => {
                const meta = entry.sentiment ? SENTIMENT_META[entry.sentiment] : null;
                return (
                  <Card key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryTitle}>{entry.title}</Text>
                        <Text style={styles.entryDate}>
                          {new Date(entry.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      {meta && (
                        <View style={[styles.sentimentBadge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.sentimentText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      )}
                      <Pressable onPress={() => handleDelete(entry.id)} hitSlop={8}>
                        <Trash2 size={16} color={Colors.neutral[400]} />
                      </Pressable>
                    </View>
                    <Text style={styles.entryBody} numberOfLines={4}>{entry.body}</Text>
                  </Card>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  title: { ...Typography.h1, fontFamily: 'Inter-Bold', color: Colors.neutral[900] },
  subtitle: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 2 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  } as ViewStyle,
  titleInput: {
    ...Typography.h3,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    paddingBottom: 8,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  bodyInput: {
    ...Typography.body,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[800],
    minHeight: 120,
    lineHeight: 24,
  } as ViewStyle,
  writeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutral[200] } as ViewStyle,
  cancelButton: { paddingVertical: 10, paddingHorizontal: Spacing.md } as ViewStyle,
  cancelText: { ...Typography.bodyMedium, fontFamily: 'Inter-Medium', color: Colors.neutral[500] },
  saveEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  } as ViewStyle,
  saveEntryText: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.white },
  errorText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.error, marginTop: 8, textAlign: 'right' },
  sectionTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800], marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700], marginTop: Spacing.sm },
  emptyText: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[400], marginTop: 4, textAlign: 'center' },
  entryCard: {} as ViewStyle,
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm } as ViewStyle,
  entryTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  entryDate: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 2 },
  sentimentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full } as ViewStyle,
  sentimentText: { ...Typography.caption, fontFamily: 'Inter-SemiBold' },
  entryBody: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[600], marginTop: Spacing.sm, lineHeight: 22 },
});
