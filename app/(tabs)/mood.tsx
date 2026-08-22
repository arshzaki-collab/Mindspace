import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Check, Moon, PenLine } from 'lucide-react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, type MoodEntry } from '@/lib/supabase';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const SCALE = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

export default function MoodScreen() {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [calm, setCalm] = useState(3);
  const [sleep, setSleep] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data, error: err } = await supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(14);
    if (!err && data) setHistory(data);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const sleepHours = sleep.trim() ? parseFloat(sleep) : null;
    const { error: insertError } = await supabase.from('mood_entries').insert({
      mood,
      energy,
      anxiety: 6 - calm,
      sleep_hours: sleepHours,
      note: note.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      setError('Could not save your check-in. Please try again.');
      return;
    }
    setSaved(true);
    setNote('');
    setSleep('');
    setTimeout(() => setSaved(false), 2500);
    loadHistory();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader eyebrow="Check in" title="How are you feeling?" subtitle="Pick the closest match — there is no right answer." />

          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                style={[styles.moodButton, mood === m.value && styles.moodButtonActive]}
                onPress={() => setMood(m.value)}>
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <Card style={{ marginTop: Spacing.lg }}>
            <SliderRow label="Energy" value={energy} onChange={setEnergy} scale={SCALE} />
            <View style={styles.divider} />
            <SliderRow label="Calmness" value={calm} onChange={setCalm} scale={SCALE} />
          </Card>

          <Card style={{ marginTop: Spacing.md }}>
            <View style={styles.fieldTitle}><Moon size={16} color={Colors.primary[600]} /><Text style={styles.fieldLabel}>Sleep (hours)</Text></View>
            <TextInput
              style={styles.input}
              value={sleep}
              onChangeText={setSleep}
              placeholder="e.g. 7.5"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="decimal-pad"
            />
            <View style={[styles.fieldTitle, { marginTop: Spacing.md }]}><PenLine size={16} color={Colors.primary[600]} /><Text style={styles.fieldLabel}>Notes</Text></View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Card>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : saved ? (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Saved</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Save Check-in</Text>
            )}
          </Pressable>

          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {loadingHistory ? (
            <ActivityIndicator color={Colors.primary[600]} style={{ marginTop: Spacing.md }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No check-ins yet. Start by logging your mood above.</Text>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {history.map((entry) => {
                const m = MOODS.find((mo) => mo.value === entry.mood);
                return (
                  <Card key={entry.id} style={styles.historyCard}>
                    <Text style={styles.historyEmoji}>{m?.emoji ?? '😐'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyMood}>{m?.label ?? 'Okay'} · Mood {entry.mood}/5</Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' · Energy '}{entry.energy}{' · Calm '}{6 - entry.anxiety}
                      </Text>
                      {entry.note ? <Text style={styles.historyNote}>{entry.note}</Text> : null}
                    </View>
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

function SliderRow({
  label,
  value,
  onChange,
  scale,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  scale: { value: number; label: string }[];
}) {
  return (
    <View>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}/5</Text>
      </View>
      <View style={styles.sliderRow}>
        {scale.map((s) => (
          <Pressable
            key={s.value}
            style={[styles.sliderDot, value >= s.value && styles.sliderDotActive]}
            onPress={() => onChange(s.value)}>
            <Text style={[styles.sliderDotText, value >= s.value && styles.sliderDotTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing.lg },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  } as ViewStyle,
  moodButtonActive: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
  moodEmoji: { fontSize: 28 },
  moodLabel: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 4 },
  moodLabelActive: { color: Colors.primary[700] },
  fieldTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabel: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700] },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  textArea: { minHeight: 72 },
  errorText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.error, marginTop: Spacing.md, textAlign: 'center' },
  saveButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  saveButtonText: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.white },
  sectionTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800], marginTop: Spacing.xl, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[400], textAlign: 'center', marginTop: Spacing.md },
  historyCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' } as ViewStyle,
  historyEmoji: { fontSize: 32 },
  historyMood: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  historyDate: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 2 },
  historyNote: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[600], marginTop: 6, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.md },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700] },
  sliderValue: { ...Typography.bodyMedium, fontFamily: 'Inter-Bold', color: Colors.primary[600] },
  sliderRow: { flexDirection: 'row', gap: 6 },
  sliderDot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
  } as ViewStyle,
  sliderDotActive: { backgroundColor: Colors.primary[500] },
  sliderDotText: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[400] },
  sliderDotTextActive: { color: Colors.white },
});
