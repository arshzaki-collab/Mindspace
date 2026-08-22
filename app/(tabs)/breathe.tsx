import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

type Technique = {
  id: string;
  name: string;
  description: string;
  pattern: { phase: string; seconds: number }[];
  color: string;
  bg: string;
};

const TECHNIQUES: Technique[] = [
  {
    id: '478',
    name: '4-7-8 Calming',
    description: 'Inhale 4s, hold 7s, exhale 8s. Reduces anxiety and aids sleep.',
    pattern: [
      { phase: 'Inhale', seconds: 4 },
      { phase: 'Hold', seconds: 7 },
      { phase: 'Exhale', seconds: 8 },
    ],
    color: Colors.primary[700],
    bg: Colors.primary[100],
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal 4-count inhale, hold, exhale, hold. Used by Navy SEALs to stay calm.',
    pattern: [
      { phase: 'Inhale', seconds: 4 },
      { phase: 'Hold', seconds: 4 },
      { phase: 'Exhale', seconds: 4 },
      { phase: 'Hold', seconds: 4 },
    ],
    color: Colors.accent[600],
    bg: Colors.accent[100],
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Slow 5-second inhale and exhale. Balances the nervous system.',
    pattern: [
      { phase: 'Inhale', seconds: 5 },
      { phase: 'Exhale', seconds: 5 },
    ],
    color: Colors.success,
    bg: '#DCFCE7',
  },
];

export default function BreatheScreen() {
  const [selected, setSelected] = useState<Technique>(TECHNIQUES[0]);
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = selected.pattern[phaseIdx];
  const totalCycleSeconds = selected.pattern.reduce((s, p) => s + p.seconds, 0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const animatePhase = (p: { phase: string; seconds: number }) => {
    const target = p.phase === 'Inhale' ? 1.4 : p.phase === 'Exhale' ? 0.65 : 1.0;
    Animated.timing(scaleAnim, {
      toValue: target,
      duration: p.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const startSession = () => {
    setActive(true);
    setPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
    animatePhase(selected.pattern[0]);
    let sec = 0;
    let currentPhase = 0;
    let cycle = 0;

    timerRef.current = setInterval(() => {
      sec += 1;
      setElapsed(sec);
      const currentP = selected.pattern[currentPhase];
      if (sec >= currentP.seconds) {
        sec = 0;
        currentPhase = (currentPhase + 1) % selected.pattern.length;
        if (currentPhase === 0) {
          cycle += 1;
          setCycleCount(cycle);
        }
        setPhaseIdx(currentPhase);
        animatePhase(selected.pattern[currentPhase]);
      }
    }, 1000);
  };

  const stopSession = async () => {
    clearTimer();
    setActive(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    if (elapsed > 0) {
      await supabase.from('breathing_sessions').insert({
        technique: selected.name,
        duration_seconds: elapsed,
      });
    }
  };

  const resetSession = () => {
    clearTimer();
    setActive(false);
    setPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
    scaleAnim.setValue(1);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const selectTechnique = (t: Technique) => {
    if (active) return;
    setSelected(t);
    setPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader eyebrow="Reset" title="Breathe" subtitle="Follow the pace, not the pressure." />

        <View style={styles.circleArea}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                backgroundColor: selected.bg,
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <Text style={[styles.phaseText, { color: selected.color }]}>
              {active ? phase.phase : 'Ready'}
            </Text>
            {active && (
              <Text style={[styles.phaseCount, { color: selected.color }]}>
                {Math.max(1, phase.seconds - (elapsed % phase.seconds || phase.seconds) + 1)}
              </Text>
            )}
          </Animated.View>
        </View>

        {active && (
          <View style={styles.sessionStats}>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatValue}>{timeStr}</Text>
              <Text style={styles.sessionStatLabel}>Time</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatValue}>{cycleCount}</Text>
              <Text style={styles.sessionStatLabel}>Cycles</Text>
            </View>
          </View>
        )}

        <View style={styles.controls}>
          {!active ? (
            <Pressable style={[styles.mainButton, { backgroundColor: selected.color }]} onPress={startSession}>
              <Play size={24} color={Colors.white} fill={Colors.white} />
              <Text style={styles.mainButtonText}>Start</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.mainButton, { backgroundColor: Colors.neutral[800] }]} onPress={stopSession}>
              <Pause size={24} color={Colors.white} fill={Colors.white} />
              <Text style={styles.mainButtonText}>Finish</Text>
            </Pressable>
          )}
          {elapsed > 0 && !active && (
            <Pressable style={styles.resetButton} onPress={resetSession}>
              <RotateCcw size={18} color={Colors.neutral[500]} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Techniques</Text>
        <View style={{ gap: Spacing.sm }}>
          {TECHNIQUES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => selectTechnique(t)}
              disabled={active}>
              <Card
                style={[
                  styles.techCard,
                  selected.id === t.id ? { borderColor: t.color, borderWidth: 2 } : null,
                ]}>
              <View style={[styles.techIcon, { backgroundColor: t.bg }]}>
                  <View style={[styles.techDot, { backgroundColor: t.color }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.techName}>{t.name}</Text>
                  <Text style={styles.techDesc}>{t.description}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, padding: Spacing.lg },

  circleArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  } as ViewStyle,
  phaseText: { ...Typography.h2, fontFamily: 'Inter-Bold' },
  phaseCount: { ...Typography.h1, fontFamily: 'Inter-ExtraBold', marginTop: 4 },
  sessionStats: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl } as ViewStyle,
  sessionStat: { alignItems: 'center' } as ViewStyle,
  sessionStatValue: { ...Typography.h2, fontFamily: 'Inter-Bold', color: Colors.neutral[900] },
  sessionStatLabel: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.lg } as ViewStyle,
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    ...Shadows.md,
  } as ViewStyle,
  mainButtonText: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.white },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 6 } as ViewStyle,
  resetText: { ...Typography.bodyMedium, fontFamily: 'Inter-Medium', color: Colors.neutral[500] },
  sectionTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800], marginBottom: Spacing.sm },
  techCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderColor: 'transparent' } as ViewStyle,
  techIcon: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  techDot: { width: 16, height: 16, borderRadius: 8 } as ViewStyle,
  techName: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  techDesc: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 3, lineHeight: 18 },
});
