import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Brain, BookOpen, HeartPulse, Lightbulb, MessageCircle, Mic, ShieldCheck, Sparkles, Wind, Moon, Target, TrendingUp } from 'lucide-react-native';
import { type MoodEntry, type Assessment } from '@/lib/supabase';
import { fetchMoodEntries, fetchAssessments } from '@/lib/localStore';
import { RISK_META, type RiskLevel } from '@/lib/classifier';
import { AmbientBackground, GlassCard, GlowOrb, NeonButton, P, Reveal } from '@/components/PremiumUI';

const actions = [
  { title: 'Log Mood', sub: '2 min check-in', icon: HeartPulse, route: '/mood', c: P.mint },
  { title: 'AI Companion', sub: 'Talk it out', icon: MessageCircle, route: '/chat', c: P.pink },
  { title: 'Assess', sub: 'See your patterns', icon: Brain, route: '/assessment', c: P.cyan },
  { title: 'Breathe', sub: 'Reset your pace', icon: Wind, route: '/breathe', c: P.mint },
  { title: 'Journal', sub: 'Put it into words', icon: BookOpen, route: '/journal', c: P.purple },
  { title: 'Tips', sub: 'Daily guidance', icon: Lightbulb, route: '/tips', c: P.gold },
];

export default function HomeScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<MoodEntry | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [moodRes, assessRes] = await Promise.all([
        fetchMoodEntries(60),
        fetchAssessments(1),
      ]);
      const latestMood = moodRes.data?.[0] ?? null;
      const latestAssess = assessRes.data?.[0] ?? null;
      const days = new Set((moodRes.data ?? []).map((x) => x.created_at.slice(0, 10))).size;

      setMood(latestMood);
      setAssessment(latestAssess);
      setCount(days);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AmbientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Reveal>
            <View style={styles.top}>
              <View style={styles.brand}>
                <View style={styles.logo}>
                  <Sparkles size={16} color={P.white} />
                </View>
                <Text style={styles.brandText}>MINDSPACE</Text>
              </View>
              <View style={styles.private}>
                <ShieldCheck size={14} color={P.mint} />
                <Text style={styles.privateText}>PRIVATE</Text>
              </View>
            </View>
          </Reveal>

          <Reveal delay={80}>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>YOUR DAILY RESET</Text>
                <Text style={styles.greeting}>{greeting}.</Text>
                <Text style={styles.heroSub}>
                  A private space to understand your mind, reset your pace, and take the next useful step.
                </Text>
                <NeonButton onPress={() => router.push('/mood')} icon={<ArrowRight size={20} color={P.white} />}>
                  Start your check-in
                </NeonButton>
              </View>
              <View style={styles.orbPosition}>
                <GlowOrb size={145} />
              </View>
            </View>
          </Reveal>

          <Reveal delay={160}>
            <View style={styles.stats}>
              <Stat icon={Target} value={String(count)} label="Check-ins" color={P.purple} />
              <Stat icon={HeartPulse} value={mood ? `${mood.mood}/5` : '—'} label="Last mood" color={P.mint} />
              <Stat
                icon={TrendingUp}
                value={
                  assessment && RISK_META[assessment.risk_level as RiskLevel]
                    ? RISK_META[assessment.risk_level as RiskLevel].label.split(' ')[0]
                    : '—'
                }
                label="Wellness"
                color={P.pink}
              />
            </View>
          </Reveal>

          <Reveal delay={200}>
            <Pressable
              onPress={() => router.push('/therapist')}
              style={({ pressed }) => [styles.voiceBanner, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <View style={styles.voiceBannerLeft}>
                <View style={styles.voiceBadge}>
                  <View style={styles.voiceDot} />
                  <Text style={styles.voiceBadgeText}>REAL-TIME VOICE AI</Text>
                </View>
                <Text style={styles.voiceBannerTitle}>Voice Therapist — Dr. Maya</Text>
                <Text style={styles.voiceBannerSub}>
                  Compassionate, real-time voice guidance to regulate anxiety and find clarity.
                </Text>
              </View>
              <View style={styles.voiceIconWrap}>
                <Mic size={24} color={P.white} />
              </View>
            </Pressable>
          </Reveal>

          <Reveal delay={250}>
            <View style={styles.section}>
              <View>
                <Text style={styles.kicker}>YOUR WELLNESS SPACE</Text>
                <Text style={styles.sectionTitle}>Choose your next move.</Text>
              </View>
              <Text style={styles.viewAll}>View all</Text>
            </View>
          </Reveal>

          <View style={styles.grid}>
            {actions.map((a, i) => {
              const I = a.icon;
              return (
                <Reveal key={a.title} delay={250 + i * 55} style={styles.tileWrap}>
                  <Pressable
                    onPress={() => router.push(a.route as any)}
                    style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}
                  >
                    <View style={[styles.tileIcon, { shadowColor: a.c, backgroundColor: `${a.c}22` }]}>
                      <I size={23} color={a.c} />
                    </View>
                    <Text style={styles.tileTitle}>{a.title}</Text>
                    <Text style={styles.tileSub}>{a.sub}</Text>
                    <ArrowRight size={17} color={a.c} style={styles.tileArrow} />
                  </Pressable>
                </Reveal>
              );
            })}
          </View>

          <Reveal delay={600}>
            <GlassCard glow style={{ marginTop: 16 }}>
              <View style={styles.insightTop}>
                <View style={styles.insightIcon}>
                  <Sparkles size={18} color={P.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardKicker}>TODAY'S INSIGHT</Text>
                  <Text style={styles.insightTitle}>
                    {mood ? 'Your check-in is a useful signal.' : 'Start with one honest check-in.'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardBody}>
                {mood
                  ? 'Small patterns become clearer when you check in consistently. Use the Companion or Journal when you want to explore why.'
                  : 'Mindspace gets more personalized as you log mood, sleep, energy and reflections.'}
              </Text>
            </GlassCard>
          </Reveal>

          <Reveal delay={680}>
            <GlassCard style={{ marginTop: 12 }}>
              <View style={styles.footerRow}>
                <View style={styles.footerIcon}>
                  <ShieldCheck size={18} color={P.mint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.footerTitle}>Built for your private space.</Text>
                  <Text style={styles.cardBody}>Reflection, not diagnosis. Support, not pressure.</Text>
                </View>
              </View>
            </GlassCard>
          </Reveal>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </AmbientBackground>
  );
}

function Stat({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <GlassCard style={styles.stat}>
      <Icon size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 100 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.violet,
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  brandText: { color: P.white, fontFamily: 'Inter-Bold', letterSpacing: 2, fontSize: 12 },
  private: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,.05)',
  },
  privateText: { color: P.mint, fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 1.1 },
  hero: {
    minHeight: 315,
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(151,110,255,.28)',
    backgroundColor: 'rgba(15,13,31,.88)',
    flexDirection: 'row',
    position: 'relative',
  },
  kicker: { color: '#BFAEFF', fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter-Bold' },
  greeting: { color: P.white, fontFamily: 'Inter-ExtraBold', fontSize: 38, lineHeight: 43, marginTop: 6 },
  heroSub: {
    color: P.muted,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    marginVertical: 12,
    maxWidth: 300,
  },
  orbPosition: { position: 'absolute', right: -8, bottom: -8, opacity: 0.92 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stat: { flex: 1, padding: 12, borderRadius: 20, minHeight: 93 },
  statValue: { color: P.white, fontSize: 21, fontFamily: 'Inter-Bold', marginTop: 8 },
  statLabel: { color: P.muted, fontSize: 10, fontFamily: 'Inter-SemiBold', marginTop: 2 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: P.white, fontSize: 23, fontFamily: 'Inter-Bold', marginTop: 3 },
  viewAll: { color: P.purple, fontSize: 12, fontFamily: 'Inter-SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '48%' },
  tile: {
    minHeight: 158,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(16,19,34,.78)',
    overflow: 'hidden',
  },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  tileTitle: { color: P.white, fontSize: 16, fontFamily: 'Inter-Bold', marginTop: 22 },
  tileSub: { color: P.muted, fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 4 },
  tileArrow: { position: 'absolute', right: 14, bottom: 15 },
  insightTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardKicker: { color: P.purple, fontSize: 9.5, letterSpacing: 1.5, fontFamily: 'Inter-Bold' },
  insightTitle: { color: P.white, fontSize: 15, fontFamily: 'Inter-Bold', marginTop: 3 },
  cardBody: { color: P.muted, fontSize: 12.5, lineHeight: 19, fontFamily: 'Inter-Regular', marginTop: 9 },
  footerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  footerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(77,224,178,.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTitle: { color: P.white, fontSize: 14, fontFamily: 'Inter-Bold' },
  voiceBanner: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(126,75,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: P.violet,
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  voiceBannerLeft: { flex: 1, paddingRight: 12 },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  voiceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: P.mint,
  },
  voiceBadgeText: {
    color: P.mint,
    fontSize: 9.5,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.3,
  },
  voiceBannerTitle: {
    color: P.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  voiceBannerSub: {
    color: P.muted,
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'Inter-Regular',
    marginTop: 3,
  },
  voiceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.violet,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});
