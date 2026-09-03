import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon, PenLine, Check, HeartPulse, Sparkles, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { type MoodEntry } from '@/lib/supabase';
import { fetchMoodEntries, createMoodEntry } from '@/lib/localStore';
import { AmbientBackground, GlassCard, GlowOrb, NeonButton, P, Pill, Reveal } from '@/components/PremiumUI';

const MOODS = [
  { v: 1, l: 'Low', c: P.pink },
  { v: 2, l: 'Heavy', c: '#FF8A6B' },
  { v: 3, l: 'Okay', c: P.gold },
  { v: 4, l: 'Good', c: P.mint },
  { v: 5, l: 'Great', c: P.cyan },
];
const contexts = ['Work', 'Sleep', 'Social', 'Solo'];

export default function MoodScreen() {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [calm, setCalm] = useState(3);
  const [sleep, setSleep] = useState('');
  const [note, setNote] = useState('');
  const [context, setContext] = useState('Solo');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);

  const load = useCallback(async () => {
    const { data } = await fetchMoodEntries(8);
    if (data) setHistory(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const choose = (v: number) => {
    setMood(v);
    try {
      Haptics.selectionAsync();
    } catch {}
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    let sleepVal: number | null = null;
    if (sleep.trim()) {
      const parsed = parseFloat(sleep.trim().replace(',', '.'));
      if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 24) {
        sleepVal = parsed;
      }
    }

    const fullNote = note.trim() ? `${context}: ${note.trim()}` : context;

    const { data: created, error: e } = await createMoodEntry({
      mood,
      energy,
      anxiety: 6 - calm,
      sleep_hours: sleepVal,
      note: fullNote,
    });

    setSaving(false);

    if (e && !created) {
      setError(e);
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setSaved(true);
    setNote('');
    setSleep('');
    load();

    setTimeout(() => {
      setSaved(false);
    }, 2400);
  };

  const selected = MOODS.find((x) => x.v === mood) || MOODS[2];

  return (
    <AmbientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Reveal>
              <View style={styles.head}>
                <View>
                  <Text style={styles.kicker}>CHECK-IN</Text>
                  <Text style={styles.title}>How are you feeling?</Text>
                  <Text style={styles.sub}>No right answer. Just notice what is true.</Text>
                </View>
                <GlowOrb size={76} />
              </View>
            </Reveal>

            {saved && (
              <Reveal>
                <View style={styles.successBanner}>
                  <CheckCircle2 size={18} color={P.mint} />
                  <Text style={styles.successBannerText}>Check-in saved to your signals.</Text>
                </View>
              </Reveal>
            )}

            <Reveal delay={100}>
              <GlassCard glow style={styles.moodCard}>
                <View style={styles.moodCenter}>
                  <Text style={styles.selectedLabel}>{selected.l.toUpperCase()}</Text>
                  <View style={[styles.moodHalo, { borderColor: selected.c, shadowColor: selected.c }]}>
                    <HeartPulse size={48} color={selected.c} />
                  </View>
                  <Text style={styles.question}>Your current vibe</Text>
                </View>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <Pressable
                      key={m.v}
                      onPress={() => choose(m.v)}
                      style={[
                        styles.moodItem,
                        m.v === mood && { borderColor: m.c, backgroundColor: `${m.c}16` },
                      ]}
                    >
                      <View style={[styles.dot, { backgroundColor: m.c }]} />
                      <Text style={styles.moodText}>{m.l}</Text>
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </Reveal>

            <Reveal delay={160}>
              <GlassCard style={{ marginTop: 12 }}>
                <Metric label="Energy" value={energy} color={P.cyan} setValue={setEnergy} />
                <Metric label="Calmness" value={calm} color={P.mint} setValue={setCalm} />
                <View style={styles.divider} />
                <View style={styles.field}>
                  <Moon size={16} color={P.purple} />
                  <Text style={styles.fieldLabel}>Sleep hours</Text>
                </View>
                <TextInput
                  value={sleep}
                  onChangeText={(val) => {
                    setSleep(val);
                    if (error) setError(null);
                  }}
                  placeholder="7.5"
                  placeholderTextColor={P.muted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </GlassCard>
            </Reveal>

            <Reveal delay={220}>
              <View style={styles.context}>
                <Text style={styles.contextTitle}>What is shaping this feeling?</Text>
                <View style={styles.pills}>
                  {contexts.map((x) => (
                    <Pill key={x} active={x === context} onPress={() => setContext(x)}>
                      {x}
                    </Pill>
                  ))}
                </View>
              </View>
            </Reveal>

            <Reveal delay={270}>
              <GlassCard>
                <View style={styles.field}>
                  <PenLine size={16} color={P.purple} />
                  <Text style={styles.fieldLabel}>A note for yourself</Text>
                </View>
                <TextInput
                  value={note}
                  onChangeText={(val) => {
                    setNote(val);
                    if (error) setError(null);
                  }}
                  placeholder="What's on your mind?"
                  placeholderTextColor={P.muted}
                  multiline
                  style={[styles.input, styles.textarea]}
                />
              </GlassCard>
            </Reveal>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Reveal delay={320}>
              <NeonButton
                onPress={save}
                icon={saved ? <Check size={20} color={P.white} /> : <Sparkles size={19} color={P.white} />}
                style={{ marginTop: 14 }}
              >
                {saving ? 'Saving...' : saved ? 'Saved — nice check-in' : 'Save Check-in'}
              </NeonButton>
            </Reveal>

            <Text style={styles.historyTitle}>RECENT SIGNALS</Text>
            {history.map((e, i) => (
              <Reveal key={e.id} delay={350 + i * 35}>
                <GlassCard style={{ marginTop: 8 }}>
                  <View style={styles.historyRow}>
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: MOODS.find((m) => m.v === e.mood)?.c ?? P.purple },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyMain}>
                        {MOODS.find((m) => m.v === e.mood)?.l ?? 'Okay'} · {e.mood}/5
                      </Text>
                      <Text style={styles.historyMeta}>
                        {new Date(e.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        · Energy {e.energy} · Calm {6 - e.anxiety}
                        {e.note ? ` · ${e.note}` : ''}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Reveal>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AmbientBackground>
  );
}

function Metric({
  label,
  value,
  color,
  setValue,
}: {
  label: string;
  value: number;
  color: string;
  setValue: (v: number) => void;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHead}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}/5</Text>
      </View>
      <View style={styles.track}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              setValue(v);
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
            style={[styles.segment, v <= value && { backgroundColor: color, shadowColor: color }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 100 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kicker: { color: '#BFAEFF', fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter-Bold' },
  title: { color: P.white, fontSize: 30, fontFamily: 'Inter-ExtraBold', marginTop: 4 },
  sub: { color: P.muted, fontSize: 13, lineHeight: 19, fontFamily: 'Inter-Regular', marginTop: 4, maxWidth: 280 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(77,224,178,.15)',
    borderWidth: 1,
    borderColor: 'rgba(77,224,178,.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  successBannerText: { color: P.mint, fontSize: 13, fontFamily: 'Inter-SemiBold' },
  moodCard: { padding: 18 },
  moodCenter: { alignItems: 'center' },
  selectedLabel: { color: P.purple, fontSize: 10, letterSpacing: 2, fontFamily: 'Inter-Bold' },
  moodHalo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  question: { color: P.muted, fontSize: 12, fontFamily: 'Inter-Regular' },
  moodRow: { flexDirection: 'row', gap: 7, marginTop: 18 },
  moodItem: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.035)',
  },
  dot: { width: 9, height: 9, borderRadius: 5, marginBottom: 7 },
  moodText: { color: P.muted, fontSize: 10, fontFamily: 'Inter-SemiBold' },
  metric: { marginBottom: 17 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { color: P.white, fontSize: 13, fontFamily: 'Inter-SemiBold' },
  metricValue: { fontSize: 13, fontFamily: 'Inter-Bold' },
  track: { flexDirection: 'row', gap: 5 },
  segment: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,.08)',
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  divider: { height: 1, backgroundColor: P.line, marginVertical: 2 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: P.white,
    fontFamily: 'Inter-Regular',
    backgroundColor: 'rgba(255,255,255,.035)',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  context: { marginVertical: 14 },
  contextTitle: { color: P.white, fontSize: 14, fontFamily: 'Inter-Bold', marginBottom: 9 },
  pills: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  error: { color: P.danger, fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 10 },
  historyTitle: { color: P.muted, fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter-Bold', marginTop: 24, marginBottom: 2 },
  historyRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  historyDot: { width: 12, height: 12, borderRadius: 6, shadowOpacity: 0.5, shadowRadius: 10 },
  historyMain: { color: P.white, fontSize: 13, fontFamily: 'Inter-SemiBold' },
  historyMeta: { color: P.muted, fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 3 },
});
