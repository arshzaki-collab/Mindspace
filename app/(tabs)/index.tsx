import { useCallback, useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowUpRight, Brain, HeartPulse, Wind, BookOpen, Lightbulb, MessageCircle, Mic, TrendingUp, AlertCircle, Sparkles, LogIn, ShieldCheck, Check, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { DotGrid } from '@/components/DotGrid';
import { RainbowAccent } from '@/components/RainbowAccent';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, type MoodEntry, type Assessment } from '@/lib/supabase';
import { RISK_META, type RiskLevel } from '@/lib/classifier';

const MOOD_EMOJI: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [checkIns, setCheckIns] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [moodRes, assessRes, moodsAll] = await Promise.all([
      supabase.from('mood_entries').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('assessments').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('mood_entries').select('created_at').order('created_at', { ascending: false }).limit(60),
    ]);
    if (moodRes.data) setLatestMood(moodRes.data);
    if (assessRes.data) setLatestAssessment(assessRes.data);
    if (moodsAll.data) setCheckIns(new Set(moodsAll.data.map((m) => m.created_at.slice(0, 10))).size);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const actions = [
    { title: 'Log mood', helper: '2 min check-in', icon: HeartPulse, color: Colors.accent[700], bg: Colors.pastel.mint, route: '/mood' },
    { title: 'Talk it out', helper: 'Open companion', icon: MessageCircle, color: Colors.primary[700], bg: Colors.pastel.lavender, route: '/chat' },
    { title: 'Assess', helper: 'See patterns', icon: Brain, color: Colors.primary[700], bg: Colors.pastel.blue, route: '/assessment' },
    { title: 'Breathe', helper: 'Reset your pace', icon: Wind, color: Colors.accent[700], bg: Colors.pastel.mint, route: '/breathe' },
    { title: 'Journal', helper: 'Put it into words', icon: BookOpen, color: '#B54E88', bg: Colors.pastel.pink, route: '/journal' },
    { title: 'Tips', helper: 'Practical support', icon: Lightbulb, color: Colors.warning, bg: Colors.pastel.butter, route: '/tips' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.orbPurple} />
          <View pointerEvents="none" style={styles.orbPink} />
          <DotGrid style={styles.heroDots} />
          <View style={styles.heroTop}>
            <View style={styles.brandLine}>
              <View style={styles.brandMark}><Sparkles size={15} color={Colors.white} /></View>
              <Text style={styles.brandText}>MINDSPACE</Text>
            </View>
            <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [styles.signIn, pressed && styles.signInActive]}>
              <LogIn size={15} color={Colors.neutral[800]} />
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR DAILY RESET</Text>
            <Text style={styles.greeting}>{greeting}.</Text>
            <Text style={styles.heroSubtitle}>A calm place to notice how you're doing, choose one useful step, and keep going.</Text>
            <RainbowAccent />
          </View>
          <BlurView intensity={30} tint="light" style={styles.heroPrompt}>
            <View style={styles.heroPromptIcon}><Sparkles size={16} color={Colors.primary[700]} /></View>
            <View style={styles.heroPromptCopy}><Text style={styles.heroPromptTitle}>What would help most right now?</Text><Text style={styles.heroPromptHint}>Pick one. Small is enough.</Text></View>
            <ChevronRight size={18} color={Colors.primary[700]} />
          </BlurView>
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={Colors.primary[600]} /><Text style={styles.loadingText}>Loading your space</Text></View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Check-ins" value={String(checkIns)} accent={Colors.primary[600]} />
              <StatCard label="Last mood" value={latestMood ? MOOD_EMOJI[latestMood.mood] : '—'} accent={Colors.accent[600]} />
              <StatCard label="Risk" value={latestAssessment ? RISK_META[latestAssessment.risk_level as RiskLevel].label.split(' ')[0] : '—'} accent={Colors.neon.purple} />
            </View>

            <View style={styles.sectionRow}><View><Text style={styles.sectionKicker}>ONE NEXT STEP</Text><Text style={styles.sectionTitle}>Choose what fits.</Text></View><Text style={styles.sectionMeta}>No streaks. No pressure.</Text></View>
            <View style={styles.actionsGrid}>
              {actions.map((action) => (
                <ActionTile key={action.title} {...action} compact={compact} onPress={() => router.push(action.route as any)} />
              ))}
            </View>

            {latestMood ? (
              <Card accent={Colors.accent[500]} style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <View><Text style={styles.cardEyebrow}>LATEST CHECK-IN</Text><Text style={styles.cardTitle}>You're noticing, and that counts.</Text></View>
                  <View style={styles.emojiOrb}><Text style={styles.emoji}>{MOOD_EMOJI[latestMood.mood]}</Text></View>
                </View>
                <Text style={styles.cardDate}>{new Date(latestMood.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                <View style={styles.metricsRow}>
                  <Metric label="Mood" value={latestMood.mood} />
                  <Metric label="Energy" value={latestMood.energy} />
                  <Metric label="Calm" value={6 - latestMood.anxiety} />
                  {latestMood.sleep_hours != null ? <Metric label="Sleep" value={latestMood.sleep_hours} suffix="h" /> : null}
                </View>
              </Card>
            ) : (
              <Card tone="soft" style={styles.sectionCard}>
                <View style={styles.emptyRow}><View style={styles.emptyIcon}><HeartPulse size={19} color={Colors.primary[700]} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Start your first check-in.</Text><Text style={styles.cardBody}>A two-minute mood log gives the rest of the app something useful to work with.</Text></View></View>
                <Pressable onPress={() => router.push('/mood')} style={styles.outlineCta}><Text style={styles.outlineCtaText}>Log mood</Text><ArrowUpRight size={16} color={Colors.primary[700]} /></Pressable>
              </Card>
            )}

            {latestAssessment ? (
              <Card accent={latestAssessment.score >= 65 ? Colors.error : Colors.primary[500]} style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}><View style={{ flex: 1 }}><Text style={styles.cardEyebrow}>LATEST ASSESSMENT</Text><Text style={styles.cardTitle}>{RISK_META[latestAssessment.risk_level as RiskLevel].label}</Text><Text style={styles.cardBody}>{new Date(latestAssessment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text></View><View style={styles.scoreBadge}><Text style={styles.scoreText}>{latestAssessment.score}</Text><Text style={styles.scoreUnit}>/100</Text></View></View>
                {latestAssessment.score >= 65 ? <View style={styles.alertRow}><AlertCircle size={16} color={Colors.error} /><Text style={styles.alertText}>Consider reaching out for extra support beyond the app.</Text></View> : <View style={styles.checkRow}><Check size={16} color={Colors.success} /><Text style={styles.checkText}>Keep using the app as a reflection tool, not a diagnosis.</Text></View>}
              </Card>
            ) : null}

            <Card tone="dark" style={styles.gentleCard}>
              <View style={styles.gentleIcon}><ShieldCheck size={17} color={Colors.white} /></View>
              <View style={{ flex: 1 }}><Text style={styles.gentleTitle}>Designed to feel quieter.</Text><Text style={styles.gentleText}>It's not a productivity dashboard — it's a small space for your next useful choice.</Text></View>
            </Card>
          </>
        )}
        <View style={{ height: 34 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <View style={[styles.statCard, { borderTopColor: accent }]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ActionTile({ icon: Icon, title, helper, color, bg, onPress, compact }: { icon: ElementType; title: string; helper: string; color: string; bg: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionTile, { backgroundColor: bg, borderLeftColor: color }, pressed && styles.actionActive]}>
      <View style={[styles.actionIcon, { backgroundColor: Colors.white }]}><Icon size={compact ? 19 : 21} color={color} strokeWidth={2.25} /></View>
      <Text style={styles.actionTitle}>{title}</Text>
      <View style={styles.actionBottom}><Text style={styles.actionHelper}>{helper}</Text><ArrowUpRight size={15} color={color} /></View>
    </Pressable>
  );
}

function Metric({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}{suffix}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  scrollCompact: { paddingHorizontal: 16 },
  hero: { overflow: 'hidden', backgroundColor: Colors.neutral[900], borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, position: 'relative', ...Shadows.lg },
  orbPurple: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#352064', right: -90, top: -90, opacity: 0.95 },
  orbPink: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#6A3053', right: 30, bottom: -55, opacity: 0.8 },
  heroDots: { position: 'absolute', right: 16, top: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: Colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 1.7, color: '#D6CCEA' },
  signIn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white },
  signInActive: { transform: [{ translateY: -1 }], opacity: 0.92 },
  signInText: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800] },
  heroCopy: { marginTop: 38 },
  eyebrow: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1.35, color: '#D7C9FF' },
  greeting: { ...Typography.display, fontFamily: 'Inter-ExtraBold', color: Colors.white, marginTop: 6, fontSize: 33, lineHeight: 38 },
  heroSubtitle: { ...Typography.body, fontFamily: 'Inter-Regular', color: '#C5C7D2', marginTop: 8, maxWidth: 360, lineHeight: 22 },
  heroPrompt: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: Spacing.lg, padding: 11, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroPromptIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  heroPromptCopy: { flex: 1 },
  heroPromptTitle: { ...Typography.small, fontFamily: 'Inter-SemiBold', color: Colors.white },
  heroPromptHint: { ...Typography.caption, fontFamily: 'Inter-Regular', color: '#C5C7D2', marginTop: 2 },
  loadingBox: { paddingVertical: Spacing.xxl, alignItems: 'center', gap: 10 },
  loadingText: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[400] },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: Spacing.xl },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.neutral[200], borderTopWidth: 3, paddingVertical: 13, paddingHorizontal: 11, ...Shadows.sm },
  statValue: { fontSize: 22, lineHeight: 26, fontFamily: 'Inter-ExtraBold', color: Colors.neutral[900] },
  statLabel: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 3 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 11 },
  sectionKicker: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1.15, color: Colors.primary[600] },
  sectionTitle: { ...Typography.h2, fontFamily: 'Inter-Bold', color: Colors.neutral[900], marginTop: 2 },
  sectionMeta: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[400], paddingBottom: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: { width: '31.8%', minWidth: 95, borderRadius: Radius.lg, borderLeftWidth: 3, padding: 12, borderWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', borderRightColor: 'rgba(0,0,0,0.04)', borderBottomColor: 'rgba(0,0,0,0.04)', ...Shadows.sm },
  actionActive: { transform: [{ translateY: -2 }], shadowOpacity: 0.09 },
  actionIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  actionTitle: { fontSize: 14, lineHeight: 18, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  actionBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 3 },
  actionHelper: { fontSize: 10.5, lineHeight: 14, fontFamily: 'Inter-Medium', color: Colors.neutral[500], flex: 1 },
  sectionCard: { marginTop: Spacing.lg },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardEyebrow: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1.05, color: Colors.neutral[400] },
  cardTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900], marginTop: 3 },
  cardBody: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 4, lineHeight: 20 },
  cardDate: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 5 },
  emojiOrb: { width: 47, height: 47, borderRadius: 16, backgroundColor: Colors.pastel.lavender, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 25 },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  metric: { flex: 1, padding: 10, borderRadius: Radius.md, backgroundColor: Colors.neutral[100] },
  metricValue: { fontSize: 17, fontFamily: 'Inter-Bold', color: Colors.neutral[900] },
  metricLabel: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 1 },
  emptyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  emptyIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: Colors.pastel.lavender, alignItems: 'center', justifyContent: 'center' },
  outlineCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.primary[200], paddingHorizontal: 11, paddingVertical: 9, borderRadius: Radius.full, marginTop: Spacing.md },
  outlineCtaText: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.primary[700] },
  scoreBadge: { minWidth: 66, paddingVertical: 9, paddingHorizontal: 9, borderRadius: 15, backgroundColor: Colors.primary[50], alignItems: 'center' },
  scoreText: { fontSize: 22, fontFamily: 'Inter-ExtraBold', color: Colors.primary[700] },
  scoreUnit: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.primary[500] },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: Spacing.md, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutral[200] },
  alertText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.error, flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: Spacing.md, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.neutral[200] },
  checkText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.success, flex: 1 },
  gentleCard: { marginTop: Spacing.lg, flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  gentleIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: Colors.primary[700], alignItems: 'center', justifyContent: 'center' },
  gentleTitle: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.white },
  gentleText: { ...Typography.small, fontFamily: 'Inter-Regular', color: '#C8C8D0', marginTop: 4, lineHeight: 20 },
});
