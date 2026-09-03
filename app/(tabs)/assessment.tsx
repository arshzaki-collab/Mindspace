import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, ChevronRight, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { type Assessment } from '@/lib/supabase';
import { fetchAssessments, createAssessment } from '@/lib/localStore';
import { QUESTIONS, ANSWER_OPTIONS, classify, RISK_META, type ClassificationResult } from '@/lib/classifier';

export default function AssessmentScreen() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await fetchAssessments(10);
    if (data) setHistory(data);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startQuiz = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setError(null);
    setStep('quiz');
  };

  const selectAnswer = (value: number) => {
    const q = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const res = classify(newAnswers);
      setResult(res);
      setStep('result');
      saveAssessment(newAnswers, res);
    }
  };

  const saveAssessment = async (ans: Record<number, number>, res: ClassificationResult) => {
    setSaving(true);
    const { error: err } = await createAssessment({
      answers: ans,
      score: res.score,
      risk_level: res.riskLevel,
      summary: res.summary,
    });
    setSaving(false);
    if (err) {
      setError('Your result was calculated and saved locally.');
    }
    loadHistory();
  };

  const progress = step === 'quiz' ? ((currentQ + 1) / QUESTIONS.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader eyebrow="Patterns" title="Wellness assessment" subtitle="A quick reflection to help you understand where you are right now." />

        {step === 'intro' && (
          <View style={{ marginTop: Spacing.lg }}>
            <View style={styles.introHero}>
              <Brain size={48} color={Colors.white} strokeWidth={1.8} />
              <Text style={styles.introHeroTitle}>Mental Wellness Check</Text>
              <Text style={styles.introHeroText}>
                Answer 10 quick questions about how you've felt over the past two weeks. Our on-device
                classifier analyzes your responses and provides a personalized wellness score.
              </Text>
            </View>

            <Pressable style={styles.startButton} onPress={startQuiz}>
              <Text style={styles.startButtonText}>Start Assessment</Text>
              <ChevronRight size={20} color={Colors.white} />
            </Pressable>

            <Text style={styles.sectionTitle}>Past Results</Text>
            {loadingHistory ? (
              <ActivityIndicator color={Colors.primary[600]} style={{ marginTop: Spacing.md }} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyText}>No assessments yet. Take your first one above.</Text>
            ) : (
              <View style={{ gap: Spacing.sm }}>
                {history.map((a) => {
                  const meta = RISK_META[a.risk_level];
                  return (
                    <Card key={a.id} style={styles.historyCard}>
                      <View style={[styles.riskBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.riskBadgeText, { color: meta.color }]}>{a.score}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyLabel, { color: meta.color }]}>{meta.label}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(a.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {step === 'quiz' && (
          <View style={{ marginTop: Spacing.lg }}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Question {currentQ + 1} of {QUESTIONS.length}</Text>

            <Card style={{ marginTop: Spacing.md }}>
              <Text style={styles.questionText}>{QUESTIONS[currentQ].text}</Text>
              <Text style={styles.questionSubtext}>Over the past two weeks, how often...</Text>
            </Card>

            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              {ANSWER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [styles.answerButton, pressed && { opacity: 0.85 }]}
                  onPress={() => selectAnswer(opt.value)}>
                  <View style={styles.answerDot} />
                  <Text style={styles.answerText}>{opt.label}</Text>
                  <ChevronRight size={18} color={Colors.neutral[400]} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 'result' && result && (
          <View style={{ marginTop: Spacing.lg }}>
            <View style={[styles.resultHero, { backgroundColor: RISK_META[result.riskLevel].bg }]}>
              <Text style={[styles.resultScore, { color: RISK_META[result.riskLevel].color }]}>
                {result.score}
              </Text>
              <Text style={styles.resultScoreUnit}>/ 100</Text>
              <Text style={[styles.resultLabel, { color: RISK_META[result.riskLevel].color }]}>
                {RISK_META[result.riskLevel].label}
              </Text>
            </View>

            <Card style={{ marginTop: Spacing.md }}>
              <Text style={styles.summaryTitle}>What this means</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>

              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Model confidence</Text>
                <Text style={styles.confidenceValue}>{Math.round(result.probability * 100)}%</Text>
              </View>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${Math.round(result.probability * 100)}%`, backgroundColor: RISK_META[result.riskLevel].color },
                  ]}
                />
              </View>
            </Card>

            {result.riskLevel === 'high-risk' && (
              <View style={styles.alertCard}>
                <AlertTriangle size={20} color={Colors.error} />
                <Text style={styles.alertText}>
                  If you're in crisis, please reach out. In the US, call or text 988. Elsewhere,
                  contact your local emergency services or a trusted healthcare provider.
                </Text>
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
            {saving && <ActivityIndicator color={Colors.primary[600]} style={{ marginTop: Spacing.sm }} />}

            <Pressable style={styles.retakeButton} onPress={startQuiz}>
              <RotateCcw size={18} color={Colors.primary[600]} />
              <Text style={styles.retakeText}>Retake Assessment</Text>
            </Pressable>

            <Pressable style={styles.historyButton} onPress={() => setStep('intro')}>
              <Text style={styles.historyButtonText}>Back to Overview</Text>
            </Pressable>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: Spacing.lg },

  introHero: {
    backgroundColor: Colors.pastel.lavender,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  } as ViewStyle,
  introHeroTitle: { ...Typography.h2, fontFamily: 'Inter-Bold', color: Colors.primary[800], marginTop: Spacing.md, textAlign: 'center' },
  introHeroText: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.primary[50], marginTop: Spacing.sm, textAlign: 'center', lineHeight: 24 },
  startButton: {
    backgroundColor: Colors.neutral[900],
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  startButtonText: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.white },
  sectionTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[800], marginTop: Spacing.xl, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[400], textAlign: 'center', marginTop: Spacing.md },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md } as ViewStyle,
  riskBadge: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  riskBadgeText: { fontSize: 18, fontFamily: 'Inter-ExtraBold' },
  historyLabel: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold' },
  historyDate: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: Colors.neutral[200], borderRadius: Radius.full, overflow: 'hidden' } as ViewStyle,
  progressBar: { height: '100%', backgroundColor: Colors.primary[500], borderRadius: Radius.full } as ViewStyle,
  progressText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[500], marginTop: 6 },
  questionText: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900], lineHeight: 28 },
  questionSubtext: { ...Typography.small, fontFamily: 'Inter-Regular', color: Colors.neutral[400], marginTop: 6 },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  } as ViewStyle,
  answerDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.neutral[300] } as ViewStyle,
  answerText: { ...Typography.bodyMedium, fontFamily: 'Inter-Medium', color: Colors.neutral[800], flex: 1 },
  resultHero: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  } as ViewStyle,
  resultScore: { fontSize: 56, fontFamily: 'Inter-ExtraBold' },
  resultScoreUnit: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[600], marginTop: -4 },
  resultLabel: { ...Typography.h2, fontFamily: 'Inter-Bold', marginTop: Spacing.sm },
  summaryTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  summaryText: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[600], marginTop: 8, lineHeight: 24 },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg, marginBottom: 6 },
  confidenceLabel: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[500] },
  confidenceValue: { ...Typography.small, fontFamily: 'Inter-Bold', color: Colors.neutral[700] },
  confidenceBar: { height: 6, backgroundColor: Colors.neutral[200], borderRadius: Radius.full, overflow: 'hidden' } as ViewStyle,
  confidenceFill: { height: '100%', borderRadius: Radius.full } as ViewStyle,
  alertCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  } as ViewStyle,
  alertText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.error, flex: 1, lineHeight: 20 },
  errorText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.error, marginTop: Spacing.sm, textAlign: 'center' },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary[600],
    ...Shadows.sm,
  } as ViewStyle,
  retakeText: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.primary[600] },
  historyButton: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  historyButtonText: { ...Typography.bodyMedium, fontFamily: 'Inter-Medium', color: Colors.neutral[500] },
});
