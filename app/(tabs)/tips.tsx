import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Lightbulb,
  Brain,
  Heart,
  Moon,
  Users,
  Activity,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';

type Tip = {
  title: string;
  body: string;
  duration?: string;
};

type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  tips: Tip[];
};

const CATEGORIES: Category[] = [
  {
    id: 'anxiety',
    name: 'Anxiety Relief',
    icon: Brain,
    color: Colors.primary[700],
    bg: Colors.primary[100],
    tips: [
      {
        title: '5-4-3-2-1 Grounding',
        body: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This pulls your mind out of anxious loops and into the present moment.',
        duration: '2 min',
      },
      {
        title: 'Cognitive Reframing',
        body: 'When a worrying thought arises, ask: "What is the evidence for and against this?" Then write a more balanced alternative. Over time this retrains your brain to challenge catastrophizing.',
        duration: '5 min',
      },
      {
        title: 'Progressive Muscle Relaxation',
        body: 'Starting from your toes, tense each muscle group for 5 seconds, then release. Work your way up to your jaw and forehead. This releases stored physical tension.',
        duration: '10 min',
      },
    ],
  },
  {
    id: 'mood',
    name: 'Low Mood',
    icon: Heart,
    color: Colors.accent[600],
    bg: Colors.accent[100],
    tips: [
      {
        title: 'Behavioral Activation',
        body: 'Choose one small, meaningful activity — even if you don\'t feel like it. Action often precedes motivation. Try a 10-minute walk, calling a friend, or making a meal.',
        duration: '10+ min',
      },
      {
        title: 'Gratitude Practice',
        body: 'Write down three specific things you\'re grateful for today. Be specific — "the warmth of my morning coffee" beats "my family." This shifts attention toward positive stimuli.',
        duration: '3 min',
      },
      {
        title: 'Opposite Action',
        body: 'If sadness makes you want to isolate, do the opposite: reach out to someone. If you feel like staying in bed, sit by a window. Acting opposite to the urge weakens the emotion.',
        duration: '5 min',
      },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep & Rest',
    icon: Moon,
    color: '#7C3AED',
    bg: '#EDE9FE',
    tips: [
      {
        title: 'Wind-Down Routine',
        body: 'Dim lights and put away screens 60 minutes before bed. Do a calming activity — reading, stretching, or journaling. Consistency trains your brain to recognize sleep cues.',
        duration: '60 min',
      },
      {
        title: 'The 20-Minute Rule',
        body: 'If you can\'t fall asleep within 20 minutes, get up and do a quiet, low-light activity until you feel drowsy. Tossing in bed associates it with frustration rather than rest.',
        duration: '20 min',
      },
      {
        title: 'Morning Sunlight',
        body: 'Get 10-15 minutes of natural light within an hour of waking. This sets your circadian rhythm, making it easier to fall asleep that night.',
        duration: '15 min',
      },
    ],
  },
  {
    id: 'connection',
    name: 'Connection',
    icon: Users,
    color: Colors.success,
    bg: '#DCFCE7',
    tips: [
      {
        title: 'Reach Out Text',
        body: 'Text one person something specific you appreciate about them. Connection doesn\'t need to be a deep conversation — small moments of warmth build belonging over time.',
        duration: '2 min',
      },
      {
        title: 'Active Listening',
        body: 'In your next conversation, focus entirely on understanding rather than responding. Notice the urge to interrupt or share your own story. Just listen and reflect back what you hear.',
        duration: 'Ongoing',
      },
      {
        title: 'Schedule Social Time',
        body: 'Plan one social activity for the coming week — a walk, coffee, or call. Put it in your calendar. Loneliness thrives in isolation; structure creates accountability.',
        duration: '10 min',
      },
    ],
  },
  {
    id: 'stress',
    name: 'Stress Management',
    icon: Activity,
    color: Colors.warning,
    bg: '#FEF3C7',
    tips: [
      {
        title: 'Time-Blocking',
        body: 'Break your day into focused blocks with built-in breaks. Work 25 minutes, rest 5 (the Pomodoro method). Prevents overwhelm by making tasks feel bounded and manageable.',
        duration: '25 min',
      },
      {
        title: 'Worry Window',
        body: 'Schedule a specific 15-minute "worry window" each day. Outside that time, remind yourself: "I\'ll think about this at 5 PM." Containing worry reduces its intrusion on your day.',
        duration: '15 min',
      },
      {
        title: 'Body Scan Check-In',
        body: 'Three times today, pause and notice: Are my shoulders tense? Is my jaw clenched? Am I holding my breath? Release what you find. Stress lives in the body before the mind.',
        duration: '1 min',
      },
    ],
  },
];

const DAILY_TIPS = [
  'Notice three things around you right now. Naming them brings you back to the present.',
  'Drink a glass of water. Dehydration can amplify feelings of fatigue and irritability.',
  'Send a kind message to someone. Giving support often lifts your own mood.',
  'Step outside for two minutes of fresh air. A brief change of scenery resets your mind.',
  'Write down one thing you accomplished today, no matter how small.',
  'Put your hand on your chest and take three slow breaths. Feel your feet on the ground.',
  'Pick one task you\'ve been avoiding and do it for just five minutes.',
  'Listen to a song that makes you feel calm or happy. Let yourself fully hear it.',
  'Stretch your arms above your head and roll your shoulders. Tension accumulates silently.',
  'Look out a window and find something in nature — a tree, clouds, birds. Pause there.',
];

function getDailyTip(): string {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return DAILY_TIPS[dayIndex % DAILY_TIPS.length];
}

export default function TipsScreen() {
  const [expanded, setExpanded] = useState<string | null>(CATEGORIES[0].id);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Practical support" title="Helpful tools" subtitle="Small, evidence-informed strategies for everyday moments." />

        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <Lightbulb size={20} color={Colors.white} />
            <Text style={styles.dailyLabel}>Tip of the Day</Text>
          </View>
          <Text style={styles.dailyText}>{getDailyTip()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Browse by Category</Text>

        {CATEGORIES.map((cat) => {
          const isOpen = expanded === cat.id;
          return (
            <View key={cat.id} style={{ marginBottom: Spacing.sm }}>
              <Pressable
                style={({ pressed }) => [styles.categoryHeader, pressed && { opacity: 0.9 }]}
                onPress={() => toggle(cat.id)}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                  <cat.icon size={20} color={cat.color} strokeWidth={2} />
                </View>
                <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{cat.tips.length}</Text>
                </View>
                <ChevronDown
                  size={20}
                  color={Colors.neutral[400]}
                  style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                />
              </Pressable>

              {isOpen && (
                <View style={styles.tipsList}>
                  {cat.tips.map((tip, idx) => (
                    <Card key={idx} style={styles.tipCard}>
                      <View style={styles.tipHeader}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        {tip.duration && (
                          <View style={[styles.durationBadge, { backgroundColor: cat.bg }]}>
                            <Text style={[styles.durationText, { color: cat.color }]}>{tip.duration}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tipBody}>{tip.body}</Text>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            These tips are educational tools inspired by cognitive behavioral therapy (CBT),
            acceptance and commitment therapy (ACT), and mindfulness-based approaches. They are not
            a substitute for professional care. If you are struggling, please reach out to a
            licensed therapist or a crisis line.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing.lg },

  dailyCard: {
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 } as ViewStyle,
  dailyLabel: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.primary[100], textTransform: 'uppercase', letterSpacing: 1 },
  dailyText: { ...Typography.bodyMedium, fontFamily: 'Inter-Medium', color: Colors.white, lineHeight: 24 },
  sectionTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800], marginTop: Spacing.xl, marginBottom: Spacing.sm },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  categoryName: { ...Typography.h3, fontFamily: 'Inter-SemiBold', flex: 1 },
  categoryCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  categoryCountText: { fontSize: 12, fontFamily: 'Inter-Bold', color: Colors.neutral[600] },
  tipsList: { marginTop: Spacing.xs, gap: Spacing.xs },
  tipCard: {} as ViewStyle,
  tipHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm } as ViewStyle,
  tipTitle: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900], flex: 1 },
  durationBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full } as ViewStyle,
  durationText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  tipBody: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[600], marginTop: 8, lineHeight: 22 },
  disclaimerCard: {
    backgroundColor: Colors.neutral[200],
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  } as ViewStyle,
  disclaimerText: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[600], lineHeight: 20 },
});
