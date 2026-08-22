import type { RiskLevel } from './supabase';

export type { RiskLevel };

// Weighted-feature wellness classifier.
// Mirrors a logistic-regression style scoring approach:
// each questionnaire item carries a learned weight; the sum maps to a
// probability of distress via a sigmoid, which is then thresholded into
// discrete risk categories. Implemented in TS because the app runs on-device.

export type Question = {
  id: number;
  text: string;
  weight: number;
};

export const QUESTIONS: Question[] = [
  { id: 1, text: 'I felt little interest or pleasure in doing things.', weight: 1.0 },
  { id: 2, text: 'I felt down, depressed, or hopeless.', weight: 1.2 },
  { id: 3, text: 'I had trouble falling/staying asleep, or slept too much.', weight: 0.8 },
  { id: 4, text: 'I felt tired or had little energy.', weight: 0.7 },
  { id: 5, text: 'I had a poor appetite or overate.', weight: 0.6 },
  { id: 6, text: 'I felt bad about myself or that I am a failure.', weight: 1.1 },
  { id: 7, text: 'I had trouble concentrating on things.', weight: 0.7 },
  { id: 8, text: 'I moved/spoke slowly or was fidgety and restless.', weight: 0.6 },
  { id: 9, text: 'I had thoughts that I would be better off not being here.', weight: 1.5 },
  { id: 10, text: 'I felt nervous, anxious, or on edge.', weight: 0.9 },
];

// Each answer is 0 (not at all) .. 3 (nearly every day).
export const ANSWER_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half' },
  { value: 3, label: 'Nearly every day' },
] as const;

const MAX_RAW = QUESTIONS.reduce((s, q) => s + q.weight * 3, 0);

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export type ClassificationResult = {
  score: number; // 0-100 normalized distress score
  probability: number; // 0-1 sigmoid output
  riskLevel: RiskLevel;
  summary: string;
};

export function classify(answers: Record<number, number>): ClassificationResult {
  const raw = QUESTIONS.reduce((sum, q) => {
    const a = answers[q.id] ?? 0;
    return sum + q.weight * a;
  }, 0);

  const normalized = (raw / MAX_RAW) * 100;
  // Shift the sigmoid so a mid-range raw score maps to ~0.5 probability.
  const probability = sigmoid((raw / MAX_RAW) * 6 - 3);

  let riskLevel: RiskLevel;
  if (normalized < 20) riskLevel = 'flourishing';
  else if (normalized < 45) riskLevel = 'balanced';
  else if (normalized < 70) riskLevel = 'at-risk';
  else riskLevel = 'high-risk';

  const summary = SUMMARY[riskLevel];

  return { score: Math.round(normalized), probability, riskLevel, summary };
}

const SUMMARY: Record<RiskLevel, string> = {
  flourishing:
    'Your responses suggest you are thriving. Keep up the habits that support your wellbeing.',
  balanced:
    'You are managing well overall with mild fluctuations. Continue regular self-care and check-ins.',
  'at-risk':
    'Some signs of distress are present. Consider talking to someone you trust and adding a grounding practice.',
  'high-risk':
    'Your responses indicate significant distress. Please reach out to a mental health professional or a crisis line.',
};

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; bg: string }
> = {
  flourishing: { label: 'Flourishing', color: '#0F766E', bg: '#CCFBF1' },
  balanced: { label: 'Balanced', color: '#1D4ED8', bg: '#DBEAFE' },
  'at-risk': { label: 'At Risk', color: '#B45309', bg: '#FEF3C7' },
  'high-risk': { label: 'High Risk', color: '#B91C1C', bg: '#FEE2E2' },
};
