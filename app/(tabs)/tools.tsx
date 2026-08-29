import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Brain, Wind, Lightbulb, ChevronRight, Check, TerminalSquare, Sparkles, Mic } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';

const TOOLS = [
  { title: 'Wellness assessment', body: 'A quick check-in that helps you see patterns without turning them into labels.', icon: Brain, bg: Colors.pastel.lavender, color: Colors.primary[700], route: '/assessment' },
  { title: 'Guided breathing', body: 'Choose a pace and let the screen carry the count for you.', icon: Wind, bg: Colors.pastel.mint, color: Colors.accent[700], route: '/breathe' },
  { title: 'Practical tips', body: 'Small exercises for stress, sleep, low mood, focus, and connection.', icon: Lightbulb, bg: Colors.pastel.butter, color: Colors.warning, route: '/tips' },
];

export default function ToolsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Your toolkit" title="Support tools" subtitle="Use what fits the moment. Nothing here needs to be perfect." />

        <Card tone="soft" style={styles.intentCard} accent={Colors.primary[500]}>
          <View style={styles.intentTop}><Sparkles size={17} color={Colors.primary[700]} /><Text style={styles.intentTitle}>Start small.</Text></View>
          <Text style={styles.intentBody}>It's not about completing every tool — it's about finding one useful next step.</Text>
          <View style={styles.checkList}>{['2–10 minute activities', 'No streaks or pressure', 'Built around reflection, not performance'].map((item) => <View key={item} style={styles.checkItem}><View style={styles.checkIcon}><Check size={12} color={Colors.primary[700]} /></View><Text style={styles.checkText}>{item}</Text></View>)}</View>
        </Card>

        <View style={styles.toolGrid}>
          {TOOLS.map((tool) => (
            <Pressable key={tool.title} onPress={() => router.push(tool.route as any)} style={({ pressed }) => [pressed && styles.tilePressed]}>
              <Card style={styles.toolCard} accent={tool.color}>
                <View style={[styles.iconWrap, { backgroundColor: tool.bg }]}><tool.icon size={22} color={tool.color} strokeWidth={2.15} /></View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolBody}>{tool.body}</Text>
                <View style={styles.toolLink}><Text style={[styles.toolLinkText, { color: tool.color }]}>Open tool</Text><ChevronRight size={15} color={tool.color} /></View>
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={styles.terminal}>
          <View style={styles.terminalTop}><View style={styles.termDots}><View style={[styles.termDot, { backgroundColor: Colors.neon.pink }]} /><View style={[styles.termDot, { backgroundColor: Colors.neon.yellow }]} /><View style={[styles.termDot, { backgroundColor: Colors.neon.lime }]} /></View><Text style={styles.termTitle}>mindspace / status</Text></View>
          <View style={styles.terminalBody}><Text style={styles.termLine}><Text style={styles.termPrompt}>$</Text> local_engine <Text style={styles.termOkay}>ready</Text></Text><Text style={styles.termLine}><Text style={styles.termPrompt}>$</Text> session_state <Text style={styles.termMuted}>private</Text></Text><Text style={styles.termLine}><Text style={styles.termPrompt}>$</Text> next_step <Text style={styles.termAccent}>one useful thing</Text></Text></View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  intentCard: { marginBottom: Spacing.lg },
  intentTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  intentTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  intentBody: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[600], marginTop: 6, lineHeight: 22 },
  checkList: { marginTop: Spacing.md, gap: 7 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { width: 20, height: 20, borderRadius: 7, backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  checkText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[600] },
  toolGrid: { gap: 10 },
  tilePressed: { transform: [{ translateY: -2 }] },
  toolCard: { padding: 16 },
  iconWrap: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  toolTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  toolBody: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 5, lineHeight: 20 },
  toolLink: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 13 },
  toolLinkText: { ...Typography.caption, fontFamily: 'Inter-SemiBold' },
  terminal: { marginTop: Spacing.xl, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.neutral[950], ...Shadows.md },
  terminalTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#101119', borderBottomWidth: 1, borderBottomColor: '#20212B' },
  termDots: { flexDirection: 'row', gap: 6 },
  termDot: { width: 7, height: 7, borderRadius: 4 },
  termTitle: { marginLeft: 10, fontSize: 10, fontFamily: 'Inter-Medium', color: '#8D8F9B' },
  terminalBody: { padding: 15, gap: 8 },
  termLine: { fontSize: 12, fontFamily: 'Courier', color: '#E6E7ED' },
  termPrompt: { color: Colors.neon.purple },
  termOkay: { color: Colors.neon.lime },
  termMuted: { color: '#9A9CA8' },
  termAccent: { color: Colors.neon.cyan },
});
