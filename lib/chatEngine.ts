// Context-aware, on-device wellness conversation engine.
// This engine is designed to feel more thoughtful than a keyword bot while
// remaining private and deterministic on the device. It is not a diagnosis
// tool or a replacement for professional care.

export type ChatSuggestion = {
  label: string;
  route?: string;
};

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatContext = {
  history?: ConversationMessage[];
  mood?: number | null;
  energy?: number | null;
  anxiety?: number | null;
  sleepHours?: number | null;
  journalSentiment?: 'positive' | 'neutral' | 'negative' | null;
};

export type ChatResponse = {
  text: string;
  suggestions?: ChatSuggestion[];
  isCrisis?: boolean;
  intent?: string;
};

type IntentId =
  | 'anxiety'
  | 'sad'
  | 'sleep'
  | 'anger'
  | 'lonely'
  | 'work'
  | 'relationships'
  | 'motivation'
  | 'overthinking'
  | 'gratitude'
  | 'help'
  | 'greeting';

type Intent = {
  id: IntentId;
  keywords: string[];
  priority?: number;
  suggestions?: ChatSuggestion[];
};

const CRISIS_PATTERNS = [
  /\bkill\s*my\s*self\b/i,
  /\bwant\s*to\s*die\b/i,
  /\bdon['’]?t\s*want\s*to\s*live\b/i,
  /\bend\s*(my|it|everything)\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bhurt\s*my\s*self\b/i,
  /\bself\s*harm\b/i,
  /\bno\s*reason\s*to\s*live\b/i,
  /\bbetter\s*off\s*dead\b/i,
  /\bending\s*it\s*all\b/i,
  /\bcan['’]?t\s*go\s*on\b/i,
  /\bnot\s*safe\s*(with|by)?\s*my\s*self\b/i,
];

const INTENTS: Intent[] = [
  { id: 'anxiety', keywords: ['anxious', 'anxiety', 'panic', 'worried', 'worry', 'nervous', 'stressed', 'overwhelmed', 'tense', 'on edge', 'heart racing'], priority: 8, suggestions: [{ label: 'Try a 60-second breathing reset', route: '/breathe' }, { label: 'See anxiety tips', route: '/tips' }] },
  { id: 'sad', keywords: ['sad', 'down', 'depressed', 'depression', 'low', 'hopeless', 'empty', 'numb', 'blue', 'unhappy', 'miserable', 'crying', 'heavy'], priority: 8, suggestions: [{ label: 'Take a gentle wellness check', route: '/assessment' }, { label: 'Write it out', route: '/journal' }] },
  { id: 'sleep', keywords: ['sleep', 'insomnia', 'can\'t sleep', 'cant sleep', 'tired', 'exhausted', 'restless', 'awake', 'nightmare', 'sleepy'], priority: 7, suggestions: [{ label: 'Do a wind-down breathing exercise', route: '/breathe' }, { label: 'See sleep tips', route: '/tips' }] },
  { id: 'anger', keywords: ['angry', 'anger', 'frustrated', 'frustration', 'mad', 'furious', 'irritated', 'rage', 'annoyed'], priority: 7, suggestions: [{ label: 'Reset with breathing', route: '/breathe' }, { label: 'Journal what happened', route: '/journal' }] },
  { id: 'lonely', keywords: ['lonely', 'loneliness', 'alone', 'isolated', 'no friends', 'disconnected', 'left out', 'ignored'], priority: 7, suggestions: [{ label: 'Read connection tips', route: '/tips' }, { label: 'Journal what you wish you could say', route: '/journal' }] },
  { id: 'work', keywords: ['work', 'job', 'office', 'boss', 'deadline', 'assignment', 'exam', 'college', 'class', 'study', 'studying', 'project'], priority: 5, suggestions: [{ label: 'Break it into one next step', route: '/tips' }, { label: 'Write a quick plan', route: '/journal' }] },
  { id: 'relationships', keywords: ['relationship', 'boyfriend', 'girlfriend', 'partner', 'friend', 'family', 'parents', 'fight', 'argument', 'breakup', 'break up'], priority: 6, suggestions: [{ label: 'Write what you want to say', route: '/journal' }, { label: 'See connection tips', route: '/tips' }] },
  { id: 'motivation', keywords: ['motivation', 'motivated', 'lazy', 'procrastinating', 'procrastinate', 'stuck', 'discipline', 'focus', 'productive'], priority: 5, suggestions: [{ label: 'Pick one tiny next action', route: '/tips' }, { label: 'Make a simple plan', route: '/journal' }] },
  { id: 'overthinking', keywords: ['overthink', 'overthinking', 'ruminating', 'ruminate', 'thoughts won\'t stop', 'mind won\'t stop', 'thinking too much', 'what if'], priority: 7, suggestions: [{ label: 'Try a grounding exercise', route: '/breathe' }, { label: 'Brain-dump in your journal', route: '/journal' }] },
  { id: 'gratitude', keywords: ['grateful', 'thankful', 'good day', 'happy', 'great', 'wonderful', 'joy', 'excited', 'proud', 'accomplished', 'better today'], priority: 3, suggestions: [{ label: 'Log your mood', route: '/mood' }, { label: 'Journal the good part', route: '/journal' }] },
  { id: 'help', keywords: ['help', 'what can you do', 'who are you', 'what do you do', 'options', 'features'], priority: 1 },
  { id: 'greeting', keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo'], priority: 1 },
];

const CRISIS_RESPONSE: ChatResponse = {
  text: "I'm really glad you told me. I want to take this seriously. Please move toward another person right now if you can — a trusted friend, family member, clinician, or local emergency service — and avoid being alone with anything you could use to hurt yourself. If you may act on these thoughts soon, seek emergency help now. If you'd like, you can stay here and tell me what feels hardest in this exact moment.",
  isCrisis: true,
  suggestions: [{ label: 'Open a grounding breathing exercise', route: '/breathe' }],
  intent: 'crisis',
};

const FALLBACK = [
  "I’m listening. What feels most important about that right now?",
  "That sounds worth unpacking. What happened just before you started feeling this way?",
  "I’m with you. Do you want to vent, make a plan, or try something that might help you feel a little steadier first?",
  "You don’t have to explain everything at once. What’s the one part you’d most like help with?",
];

const intentOpeners: Record<IntentId, string[]> = {
  anxiety: [
    "That sounds like a lot of nervous-system energy to carry.",
    "It sounds like your mind and body are both on high alert.",
    "I can hear how much uncertainty is sitting underneath that.",
  ],
  sad: [
    "That sounds heavy, and you don’t have to make it sound better than it feels.",
    "It makes sense that this would feel hard to carry right now.",
    "I’m hearing a lot of weight in what you’re saying.",
  ],
  sleep: [
    "Lack of sleep can make an already difficult day feel even harder.",
    "When rest is off, mood and focus usually feel it too.",
  ],
  anger: [
    "There’s a lot of intensity in that, and usually the intensity is pointing to something that matters.",
    "It sounds like something crossed a line for you.",
  ],
  lonely: [
    "Feeling disconnected can hurt more than people realize.",
    "That kind of loneliness can make ordinary moments feel much heavier.",
  ],
  work: [
    "It sounds like there’s pressure coming from several directions at once.",
    "When work or study stacks up, the first useful move is usually to shrink the problem.",
  ],
  relationships: [
    "Relationships can hit especially hard because the stakes feel personal.",
    "It sounds like there’s both emotion and uncertainty tied up in this.",
  ],
  motivation: [
    "Getting stuck doesn’t mean you’re incapable — it usually means the next step feels too large or unclear.",
    "Let’s make the target smaller before we judge yourself for not hitting it.",
  ],
  overthinking: [
    "It sounds like your mind is looping instead of giving you a chance to settle.",
    "When thoughts keep circling, the goal isn’t to solve everything at once — it’s to create some distance from the loop.",
  ],
  gratitude: [
    "I’m glad there’s something good in the mix today.",
    "That sounds like a moment worth noticing rather than rushing past.",
  ],
  help: ["I can listen, help you sort out what you’re feeling, and suggest small practical next steps."],
  greeting: ["Hey — I’m here."],
};

const intentActions: Record<IntentId, string[]> = {
  anxiety: [
    "For the next minute, try a slower exhale than inhale — for example, breathe in for 4 and out for 6.",
    "Put both feet on the floor and name three things you can see. It gives your attention something concrete to hold.",
  ],
  sad: [
    "For now, aim for one caring action rather than fixing the whole day — water, a shower, food, sunlight, or texting someone safe.",
    "You don’t need to earn rest. Pick one tiny thing that would make the next hour 1% easier.",
  ],
  sleep: [
    "Tonight, keep the goal simple: lower stimulation, dim the lights, and give yourself a consistent wind-down window.",
    "If your mind is busy, write down the thoughts that need attention tomorrow so you don’t have to keep rehearsing them in bed.",
  ],
  anger: [
    "Before deciding what to say or do, create a little distance — even ten slow breaths or a short walk can help.",
    "Try naming the need underneath the anger: respect, space, fairness, safety, help, or something else.",
  ],
  lonely: [
    "Choose one low-pressure connection today — a short message, sitting near someone, or joining a space where people are around.",
    "You don’t have to find your people all at once. One real interaction is enough for today.",
  ],
  work: [
    "Pick the smallest visible next action — open the file, write the first sentence, or list the three tasks. Don’t solve the whole project yet.",
    "Try a 10-minute focus block. The goal is starting, not finishing.",
  ],
  relationships: [
    "Before the next conversation, write down what you felt, what you need, and what you’re actually asking for.",
    "If emotions are hot, a short pause can protect the conversation better than forcing an immediate answer.",
  ],
  motivation: [
    "Make the next action so small that starting feels almost silly — two minutes counts.",
    "Instead of waiting to feel motivated, create a tiny cue: one song, one timer, one task.",
  ],
  overthinking: [
    "Try separating facts from predictions. Write one column for what you know and one for what your mind is guessing.",
    "Give yourself ten minutes to think, then switch to a physical task that uses your attention.",
  ],
  gratitude: [
    "Stay with the good part for a moment — what exactly made today feel better?",
    "If it matters to you, save this moment in your journal so you can come back to it later.",
  ],
  help: [
    "You can talk with me, log your mood, journal, take the wellness assessment, use breathing exercises, or browse coping tips.",
  ],
  greeting: [
    "You can vent, ask a question, or tell me what you need from this conversation — listening, ideas, or a plan.",
  ],
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkCrisis(text: string) {
  const lower = normalize(text);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

function countMatches(text: string, keyword: string) {
  if (keyword.includes(' ')) return text.includes(keyword) ? 2 : 0;
  return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(text) ? 1 : 0;
}

function findIntent(text: string): IntentId | null {
  const lower = normalize(text);
  let best: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((sum, kw) => sum + countMatches(lower, normalize(kw)), 0) + (intent.priority ?? 0) * 0.05;
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }
  return best?.intent.id ?? null;
}

function recentUserMessages(history: ConversationMessage[] = []) {
  return history.filter((m) => m.role === 'user').slice(-4);
}

function detectNeed(text: string): 'vent' | 'advice' | 'plan' | 'question' | null {
  const lower = normalize(text);
  if (/[?]$/.test(lower) || /\bshould i\b|\bwhat do i do\b|\bhow can i\b|\bwhy am i\b/.test(lower)) return 'question';
  if (/\bwhat should i do\b|\bmake a plan\b|\bplan for\b|\bhelp me do\b|\bsteps\b/.test(lower)) return 'plan';
  if (/\badvice\b|\bsuggestion\b|\bwhat can help\b|\bhow do i\b/.test(lower)) return 'advice';
  if (/\bjust needed to vent\b|\bjust venting\b|\bneed to vent\b|\blet me vent\b/.test(lower)) return 'vent';
  return null;
}

function choose<T>(items: T[], seedText: string) {
  const seed = Array.from(seedText).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[seed % items.length];
}

function followUp(intent: IntentId, need: ReturnType<typeof detectNeed>, recent: string) {
  if (need === 'vent') return "You don't have to solve it with me right now. What part do you most want me to understand?";
  if (need === 'plan') return 'Want to turn that into one small next step together?';
  if (intent === 'sleep') return 'Is the main problem getting to sleep, staying asleep, or waking up tired?';
  if (intent === 'anxiety') return 'What is your mind predicting might happen?';
  if (intent === 'sad') return 'Has this been mostly today, or has the low feeling been sticking around for a while?';
  if (intent === 'anger') return 'What happened right before you got angry?';
  if (intent === 'lonely') return 'Are you missing a specific person, or more generally missing connection?';
  if (intent === 'work') return 'Is the pressure mostly about time, difficulty, or not knowing where to start?';
  if (intent === 'relationships') return 'Do you want help understanding what happened, or deciding what to say next?';
  if (intent === 'motivation') return 'What is the one thing you most want to get moving on?';
  if (intent === 'overthinking') return 'What thought keeps coming back the most?';
  if (intent === 'gratitude') return 'What made that moment feel especially good?';
  if (recent.split(/\s+/).length < 7) return 'Tell me a little more so I can respond to the actual situation, not just the topic.';
  return 'What would feel most useful from me right now — listening, ideas, or a simple plan?';
}

function contextNote(context?: ChatContext) {
  if (!context) return '';
  const parts: string[] = [];
  if (typeof context.mood === 'number' && context.mood <= 2) parts.push('your recent mood sounds low');
  if (typeof context.anxiety === 'number' && context.anxiety >= 4) parts.push('your recent anxiety rating is elevated');
  if (typeof context.sleepHours === 'number' && context.sleepHours < 6) parts.push('you have been getting limited sleep');
  return parts.length ? ` I also remember that ${parts.join(' and ')}.` : '';
}

export function generateResponse(userMessage: string, context: ChatContext = {}): ChatResponse {
  const recent = recentUserMessages(context.history);
  const recentText = recent.map((m) => m.content).join(' ');
  const combined = `${recentText} ${userMessage}`.trim();

  if (checkCrisis(userMessage) || checkCrisis(recentText)) return CRISIS_RESPONSE;

  const intent = findIntent(userMessage) ?? findIntent(recentText) ?? 'help';
  const need = detectNeed(userMessage);
  const opener = choose(intentOpeners[intent], userMessage);
  const action = choose(intentActions[intent], userMessage);
  const question = followUp(intent, need, userMessage);
  const prior = recent.length > 1 ? ` I’m keeping the thread from what you shared earlier in mind.` : '';

  // Avoid repeating the same answer back-to-back if the user repeats a message.
  const priorAssistant = [...(context.history ?? [])].reverse().find((m) => m.role === 'assistant')?.content;
  const note = contextNote(context);
  const body = need === 'vent'
    ? `${opener} I’m not going to rush you into fixing it. ${question}`
    : `${opener}${note}${prior} ${action} ${question}`;

  if (priorAssistant && priorAssistant.includes(action)) {
    return {
      text: `${opener}${note} Let’s come at it from a different angle. ${question}`,
      suggestions: INTENTS.find((item) => item.id === intent)?.suggestions,
      intent,
    };
  }

  return {
    text: body.replace(/\s+/g, ' ').trim(),
    suggestions: INTENTS.find((item) => item.id === intent)?.suggestions,
    intent,
  };
}

export const QUICK_PROMPTS = [
  'I feel anxious',
  "I'm having a hard day",
  "I can't sleep",
  'I feel lonely',
  'I keep overthinking',
  'I need a simple plan',
];
