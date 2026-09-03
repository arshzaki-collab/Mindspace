import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Feather, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { type JournalEntry } from '@/lib/supabase';
import { fetchJournalEntries, createJournalEntry, deleteJournalEntry } from '@/lib/localStore';
import { AmbientBackground, GlassCard, NeonButton, P, Pill, Reveal } from '@/components/PremiumUI';

const POS = ['happy', 'grateful', 'hope', 'joy', 'calm', 'peace', 'love', 'good', 'great', 'proud', 'excited', 'thankful', 'better', 'progress', 'smile'];
const NEG = ['sad', 'anxious', 'worried', 'angry', 'fear', 'hopeless', 'stressed', 'tired', 'alone', 'pain', 'struggle', 'difficult', 'bad', 'hurt', 'lost'];

function sentiment(t: string): 'positive' | 'neutral' | 'negative' {
  const s = t.toLowerCase();
  let n = 0;
  POS.forEach((w) => s.includes(w) && n++);
  NEG.forEach((w) => s.includes(w) && n--);
  return n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral';
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchJournalEntries();
    if (data) setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!body.trim()) {
      setError('Please write at least a few words in your reflection.');
      return;
    }
    setSaving(true);
    setError(null);

    const sent = sentiment(body);
    const { data: created, error: e } = await createJournalEntry({
      title: title.trim() || 'Untitled reflection',
      body: body.trim(),
      sentiment: sent,
    });

    setSaving(false);

    if (e && !created) {
      setError(e);
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setSavedSuccess(true);
    setTitle('');
    setBody('');
    setWriting(false);
    load();

    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const del = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await deleteJournalEntry(id);
    load();
  };

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
                  <Text style={styles.kicker}>YOUR SAFE SPACE</Text>
                  <Text style={styles.title}>Journal</Text>
                  <Text style={styles.sub}>A place to turn thoughts into patterns.</Text>
                </View>
                <View style={styles.book}>
                  <BookOpen size={23} color={P.pink} />
                </View>
              </View>
            </Reveal>

            {savedSuccess && (
              <Reveal>
                <View style={styles.successBanner}>
                  <CheckCircle2 size={18} color={P.mint} />
                  <Text style={styles.successBannerText}>Reflection saved successfully.</Text>
                </View>
              </Reveal>
            )}

            <Reveal delay={90}>
              <GlassCard glow style={styles.prompt}>
                <View style={styles.promptIcon}>
                  <Feather size={21} color={P.white} />
                </View>
                <Text style={styles.promptKicker}>TODAY'S PROMPT</Text>
                <Text style={styles.promptTitle}>What made you feel a little more like yourself today?</Text>
                <View style={{ marginTop: 12 }}>
                  <Pill
                    active
                    onPress={() => {
                      setWriting(true);
                      setError(null);
                    }}
                  >
                    Start writing
                  </Pill>
                </View>
              </GlassCard>
            </Reveal>

            {!writing ? (
              <Reveal delay={150}>
                <NeonButton
                  onPress={() => {
                    setWriting(true);
                    setError(null);
                  }}
                  icon={<Plus size={20} color={P.white} />}
                >
                  Write a reflection
                </NeonButton>
              </Reveal>
            ) : (
              <Reveal delay={120}>
                <GlassCard style={{ marginTop: 12 }}>
                  <TextInput
                    value={title}
                    onChangeText={(t) => {
                      setTitle(t);
                      if (error) setError(null);
                    }}
                    placeholder="Entry title"
                    placeholderTextColor={P.muted}
                    style={styles.titleInput}
                  />
                  <TextInput
                    value={body}
                    onChangeText={(b) => {
                      setBody(b);
                      if (error) setError(null);
                    }}
                    placeholder="Let it out..."
                    placeholderTextColor={P.muted}
                    multiline
                    autoFocus
                    style={styles.bodyInput}
                  />
                  <View style={styles.writeActions}>
                    <Pressable
                      onPress={() => {
                        setWriting(false);
                        setTitle('');
                        setBody('');
                        setError(null);
                      }}
                    >
                      <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={save}
                      disabled={!body.trim() || saving}
                      style={[styles.save, (!body.trim() || saving) && { opacity: 0.55 }]}
                    >
                      <Sparkles size={15} color={P.white} />
                      <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
                    </Pressable>
                  </View>
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                </GlassCard>
              </Reveal>
            )}

            <Text style={styles.section}>RECENT REFLECTIONS</Text>
            {loading ? (
              <ActivityIndicator color={P.purple} style={{ marginTop: 20 }} />
            ) : entries.length === 0 ? (
              <GlassCard>
                <Text style={styles.emptyTitle}>Your journal is waiting.</Text>
                <Text style={styles.emptyText}>Write one honest paragraph. That's enough to start.</Text>
              </GlassCard>
            ) : (
              entries.map((e, i) => (
                <Reveal key={e.id} delay={180 + i * 35}>
                  <GlassCard style={{ marginTop: 9 }}>
                    <View style={styles.entryHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryTitle}>{e.title}</Text>
                        <Text style={styles.date}>
                          {new Date(e.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {e.sentiment === 'negative'
                            ? 'REFLECTIVE'
                            : (e.sentiment ?? 'neutral').toUpperCase()}
                        </Text>
                      </View>
                      <Pressable onPress={() => del(e.id)} hitSlop={10}>
                        <Trash2 size={15} color={P.muted} />
                      </Pressable>
                    </View>
                    <Text numberOfLines={5} style={styles.entryBody}>
                      {e.body}
                    </Text>
                  </GlassCard>
                </Reveal>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AmbientBackground>
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
  title: { color: P.white, fontSize: 31, fontFamily: 'Inter-ExtraBold', marginTop: 3 },
  sub: { color: P.muted, fontSize: 13, lineHeight: 19, fontFamily: 'Inter-Regular', marginTop: 4 },
  book: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,93,177,.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,93,177,.2)',
  },
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
  prompt: { padding: 20, marginBottom: 12, backgroundColor: 'rgba(80,38,170,.15)' },
  promptIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: P.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  promptKicker: { color: '#D0C1FF', fontSize: 9, letterSpacing: 1.7, fontFamily: 'Inter-Bold' },
  promptTitle: { color: P.white, fontSize: 20, lineHeight: 27, fontFamily: 'Inter-Bold', marginTop: 6 },
  titleInput: {
    color: P.white,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
  },
  bodyInput: {
    color: P.white,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    minHeight: 150,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  writeActions: {
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    alignItems: 'center',
  },
  cancel: { color: P.muted, fontSize: 13, fontFamily: 'Inter-SemiBold' },
  save: {
    backgroundColor: P.violet,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  saveText: { color: P.white, fontSize: 13, fontFamily: 'Inter-Bold' },
  error: { color: P.danger, fontSize: 12, marginTop: 8, fontFamily: 'Inter-Medium' },
  section: {
    color: P.muted,
    fontSize: 10,
    letterSpacing: 1.7,
    fontFamily: 'Inter-Bold',
    marginTop: 25,
    marginBottom: 4,
  },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  entryTitle: { color: P.white, fontSize: 15, fontFamily: 'Inter-Bold' },
  date: { color: P.muted, fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 3 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(139,92,246,.13)',
  },
  badgeText: { color: '#C9B9FF', fontSize: 8, fontFamily: 'Inter-Bold', letterSpacing: 0.8 },
  entryBody: {
    color: '#C6C7D5',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginTop: 11,
  },
  emptyTitle: { color: P.white, fontSize: 16, fontFamily: 'Inter-Bold' },
  emptyText: {
    color: P.muted,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
});
