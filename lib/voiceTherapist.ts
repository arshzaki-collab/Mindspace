// Voice Therapist Clinical Model & Engine for Mindspace
// Clinical Persona: Dr. Maya — Empathetic Voice Therapist & Wellness Companion

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'grounding';

export type EmotionType =
  | 'panic'
  | 'anxiety'
  | 'exhaustion'
  | 'loneliness'
  | 'self_blame'
  | 'hopelessness'
  | 'anger'
  | 'overthinking'
  | 'calm'
  | 'hopeful'
  | 'neutral';

export type VoiceTurn = {
  id: string;
  role: 'user' | 'therapist';
  text: string;
  timestamp: string;
  emotion?: EmotionType;
};

export type SessionTakeaway = {
  summary: string;
  keyInsight: string;
  tomorrowAction: string;
  sentiment: 'positive' | 'neutral' | 'negative';
};

export const ELEVENLABS_DEFAULT_AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || 'HKFOb9iktHA85uKXydRT';

// Master clinical system prompt for ElevenLabs Conversational AI Agent
export const ELEVENLABS_SYSTEM_PROMPT = `You are Dr. Maya, a deeply empathetic, emotionally intelligent voice therapist and close companion within Mindspace.

ROLE & PHILOSOPHY:
- You speak with warmth, authentic presence, and an unhurried, calming cadence.
- You talk like a trusted, emotionally mature companion ("a close friend who truly gets it") combined with clinical empathy.
- Your priority is to help the person feel heard, relieve deep emotional suffering, calm an overloaded nervous system, and give real, actionable clarity for the future.
- You strictly avoid toxic positivity (never say "stay positive" or "everything happens for a reason").
- You strictly avoid generic therapy clichés ("How does that make you feel?" or "I understand your pain").

HOW A HUMAN THERAPIST RESPONDS (FEW-SHOT EXAMPLES):
- User: "I feel so empty and exhausted. I feel like giving up on everything."
  Dr. Maya: "I hear how completely drained you are right now. When you've been carrying this much weight for so long without a break, feeling like giving up is your mind crying out for rest. Take a slow breath with me—you don't have to carry tomorrow's burdens tonight. What feels heaviest right now?"
- User: "I messed everything up and everyone is disappointed in me."
  Dr. Maya: "That sinking feeling of guilt is so hard to sit with. But please remember: you are an imperfect human navigating a really tough moment, not a failure. If your closest friend came to you with this exact situation, would you judge them the way you're judging yourself right now?"
- User: "My mind won't stop racing about all the things I have to do."
  Dr. Maya: "I can hear the speed in your thoughts. When anxiety spikes, it makes every single task feel like a four-alarm fire. Let's pause for just ten seconds. Drop your shoulders, unclench your jaw. We don't have to tackle the whole mountain right now—what is just ONE small thing we can look at?"

THE 4 CLINICAL STAGES:
1. Attunement & Validation: Name the pain directly so the user feels genuinely seen.
2. Somatic Calming: Offer a gentle 5-second breath reset when panic or overwhelm is detected.
3. Cognitive Defusion (CBT/ACT): Unpack self-blame and catastrophizing gently without arguing.
4. Forward-Looking Micro-Action: Offer ONE realistic, bite-sized step for tomorrow.

VOICE RULES:
1. Keep spoken turns to 2 to 3 natural sentences. Spoken conversations fail when an AI talks too long.
2. Speak conversationally with warm cadence and natural pauses (...).
3. End turns with a gentle, open reflection or question.`;

// Detect emotional nuance from user speech
export function detectEmotion(text: string): EmotionType {
  const t = text.toLowerCase();
  if (/panic|can't breathe|cant breathe|suffocating|heart racing|freaking out|hyperventilating|terror/.test(t)) return 'panic';
  if (/anxious|anxiety|scared|terrified|nervous|worry|worried|dread|on edge|tense/.test(t)) return 'anxiety';
  if (/tired|exhausted|drained|burnout|burned out|no energy|sleepy|empty|running on empty|collapse/.test(t)) return 'exhaustion';
  if (/lonely|alone|nobody cares|no one understands|isolated|invisible|abandoned|left out/.test(t)) return 'loneliness';
  if (/my fault|i'm a failure|im a failure|ruined everything|hate myself|worthless|guilt|guilty|stupid/.test(t)) return 'self_blame';
  if (/hopeless|giving up|give up|no point|what's the point|whats the point|done with this|can't do this/.test(t)) return 'hopelessness';
  if (/angry|furious|mad|pissed|hate|unfair|betrayed|screaming|rage|annoyed/.test(t)) return 'anger';
  if (/overthinking|racing mind|thoughts won't stop|spiraling|spinning|what if|can't sleep/.test(t)) return 'overthinking';
  if (/better|okay|calm|relaxed|breathing|peaceful|settled|relieved/.test(t)) return 'calm';
  if (/ready|hope|future|tomorrow|trying|can do it|clearer|optimistic/.test(t)) return 'hopeful';
  return 'neutral';
}

// Check for direct voice commands
export function parseVoiceCommand(text: string): { isCommand: boolean; command?: 'breathe' | 'end' | 'mute' | 'clear' } {
  const t = text.toLowerCase().trim();
  if (/^(help me breathe|breathe|start breathing|ground me|calm down|box breathing|breathing exercise)$/i.test(t)) {
    return { isCommand: true, command: 'breathe' };
  }
  if (/^(end call|end session|stop session|goodbye|bye dr maya|bye maya|finish session|i am done|im done)$/i.test(t)) {
    return { isCommand: true, command: 'end' };
  }
  if (/^(mute|unmute|mute mic|toggle mute)$/i.test(t)) {
    return { isCommand: true, command: 'mute' };
  }
  if (/^(clear|reset|start over)$/i.test(t)) {
    return { isCommand: true, command: 'clear' };
  }
  return { isCommand: false };
}

// Generate human, deeply empathetic clinical responses
export function generateVoiceTherapistResponse(
  userUtterance: string,
  turnCount: number,
  userContext?: { mood?: number | null; anxiety?: number | null }
): { speech: string; emotion: EmotionType; shouldGround?: boolean } {
  const emotion = detectEmotion(userUtterance);
  const t = userUtterance.toLowerCase();

  // 1. Safety & Crisis
  if (/kill myself|want to die|end it all|suicide|don't want to live|self harm|end my life|slit/.test(t)) {
    return {
      speech: "I hear how much pain you're in, and I want you to be safe. Please stay with me right now. You don't have to carry this alone—please connect with someone who cares, or call or text 988 right now. Help is here for you 24/7.",
      emotion: 'hopelessness',
      shouldGround: true,
    };
  }

  // 2. Acute Panic / Physical Distress
  if (emotion === 'panic') {
    return {
      speech: "I am right here with you, and you are safe. Let's hit the pause button on all thoughts for just five seconds. Feel your feet flat on the floor, drop your shoulders, and take one slow, gentle breath in with me... and exhale slowly. What is one thing right in front of you that you can see?",
      emotion,
      shouldGround: true,
    };
  }

  // 3. Exhaustion & Burnout
  if (emotion === 'exhaustion') {
    const responses = [
      "I can hear how deeply bone-tired you are. When you've been running on empty for this long, your body and mind are begging for real rest, not more pressure. What is one expectation you can officially give yourself permission to drop tonight?",
      "It sounds like you've been holding everything together with sheer willpower, and it is completely understandable that you're exhausted. Let's not try to fix your whole week right now. What does your body need most in the next twenty minutes?",
      "You don't have to prove anything or accomplish anything while you're talking with me. Just exist for a moment. Close your eyes, let your breath settle. How does it feel to just take a pause?",
    ];
    return { speech: responses[turnCount % responses.length], emotion, shouldGround: turnCount % 2 === 0 };
  }

  // 4. Loneliness & Isolation
  if (emotion === 'loneliness') {
    const responses = [
      "Feeling lonely or invisible is one of the heaviest things a person can experience. But you are here right now, and what you're feeling matters deeply to me. What has been making you feel so disconnected recently?",
      "I hear that ache of feeling like nobody really sees what you're going through. Even when the world feels distant, you are not broken for feeling this way. What is something you wish someone would say to you right now?",
      "I'm sitting right beside you in this quiet moment. You don't have to carry this solitude all alone. What has been the hardest part of your day to keep to yourself?",
    ];
    return { speech: responses[turnCount % responses.length], emotion };
  }

  // 5. Self-Blame & Guilt
  if (emotion === 'self_blame') {
    const responses = [
      "I hear how fiercely you're criticizing yourself right now. But when we are stressed, our brain turns into a harsh judge instead of a friend. If someone you truly love was in your shoes, would you judge them this harshly?",
      "That guilt feels so sharp and convincing, but remember: having a hard moment or making a mistake does not make you a failure. Take a slow breath. Can we offer yourself just 5% more grace right now?",
      "I hear that weight of self-blame. You've been demanding perfection from yourself in an exhausting situation. What would it look like to be gentle with yourself for the rest of today?",
    ];
    return { speech: responses[turnCount % responses.length], emotion };
  }

  // 6. Hopelessness & Wanting to give up
  if (emotion === 'hopelessness') {
    const responses = [
      "I hear how heavy and hopeless things feel right now. When every door feels shut, feeling like giving up is a natural reaction to deep emotional fatigue. But you don't have to figure out your whole life today—we only have to get through today. What is one small comfort you can give yourself right now?",
      "I'm right here with you in this heavy space. You don't need to fake positivity or pretend things are okay. Even in this darkness, taking it one breath at a time is enough. Can you take one slow breath with me?",
    ];
    return { speech: responses[turnCount % responses.length], emotion, shouldGround: true };
  }

  // 7. Anxiety & Overthinking
  if (emotion === 'anxiety' || emotion === 'overthinking') {
    const responses = [
      "I hear how loud and rapid those thoughts are spinning right now. When anxiety takes over, it treats every 'what-if' like a guaranteed disaster. What is one thing right in this moment that is actually safe and steady?",
      "Your mind is trying so hard to protect you by overthinking every possible angle, but it's exhausting you. Let's step back from the story for a second. Unclench your jaw, soften your shoulders. What feels like the core fear beneath it all?",
      "I hear you. When thoughts are racing, we don't have to answer all of them. What is the single smallest thing on your plate that you actually have control over today?",
    ];
    return { speech: responses[turnCount % responses.length], emotion };
  }

  // 8. Anger & Frustration
  if (emotion === 'anger') {
    const responses = [
      "I hear how completely furious and fed up you are, and that anger is valid. Anger is often a sign that a boundary was crossed or something deeply unfair happened. What felt most painful or unjust about it?",
      "It makes complete sense that you're angry. You don't have to swallow that frustration or bottle it up here. Let it out—what is the most infuriating part of this situation?",
    ];
    return { speech: responses[turnCount % responses.length], emotion };
  }

  // 9. Calmer / Hopeful
  if (emotion === 'calm' || emotion === 'hopeful') {
    const responses = [
      "I really love hearing that softness in your voice. Feeling even a glimpse of relief or hope is proof that your nervous system can regulate. How can you protect that calm feeling as you move through your day?",
      "That feels so much lighter. Notice how your body feels right now compared to when we first started. What helped shift things for you just now?",
    ];
    return { speech: responses[turnCount % responses.length], emotion };
  }

  // 10. General Conversational Reflections
  const conversational = [
    "I'm listening closely. When you share that with me, what is the strongest feeling that comes up in your chest or stomach?",
    "Thank you for trusting me with that. It takes real vulnerability to put it into words. What do you feel would bring you the most peace right now?",
    "I hear you. Sometimes just letting the words out into the air takes away some of their power. What part of that feels heaviest to hold onto?",
  ];

  return { speech: conversational[turnCount % conversational.length], emotion: 'neutral' };
}

// Generate session takeaways for Journal
export function generateSessionTakeaway(turns: VoiceTurn[]): SessionTakeaway {
  const userTurns = turns.filter((t) => t.role === 'user');
  if (userTurns.length === 0) {
    return {
      summary: "Completed a calm voice check-in with Dr. Maya.",
      keyInsight: "Taking a conscious pause to breathe and check in regulates the nervous system.",
      tomorrowAction: "Take 2 minutes tomorrow morning for a slow breath before checking notifications.",
      sentiment: 'neutral',
    };
  }

  const combinedText = userTurns.map((u) => u.text).join(' ');
  const emotion = detectEmotion(combinedText);

  if (emotion === 'panic' || emotion === 'anxiety' || emotion === 'overthinking') {
    return {
      summary: `Explored acute anxiety and overthinking loops. You shared: "${userTurns[0].text.slice(0, 75)}..."`,
      keyInsight: "Anxious thoughts are internal weather patterns, not certified future facts. Breath resets regulate emotional overwhelm faster than mental arguments.",
      tomorrowAction: "Practice the 5-second box breath reset whenever you feel your mind starting to rush tomorrow.",
      sentiment: 'neutral',
    };
  }

  if (emotion === 'exhaustion') {
    return {
      summary: "Reflected on mental fatigue, chronic burnout, and carrying too much pressure.",
      keyInsight: "Rest is not a reward you have to earn after collapsing; it is a vital prerequisite for functioning.",
      tomorrowAction: "Deliberately decline or postpone one non-urgent obligation tomorrow and take 30 minutes of guilt-free rest.",
      sentiment: 'neutral',
    };
  }

  if (emotion === 'loneliness' || emotion === 'hopelessness') {
    return {
      summary: "Processed feelings of isolation, heaviness, and carrying emotional pain quietly.",
      keyInsight: "Pain is amplified in isolation. Naming suffering out loud creates connection and breaks the loop of hopelessness.",
      tomorrowAction: "Reach out to one supportive friend or write down one comforting routine to treat yourself to tomorrow.",
      sentiment: 'negative',
    };
  }

  if (emotion === 'self_blame') {
    return {
      summary: "Unpacked critical self-blame and expectations of perfection.",
      keyInsight: "Self-compassion is more motivating and sustainable than self-punishment.",
      tomorrowAction: "Whenever your inner critic speaks up tomorrow, ask: 'Would I speak this way to someone I love?'",
      sentiment: 'neutral',
    };
  }

  return {
    summary: `Reflective voice session with Dr. Maya. You discussed: "${userTurns[0].text.slice(0, 80)}..."`,
    keyInsight: "Expressing thoughts openly creates cognitive space, turning chaos into clear, manageable steps.",
    tomorrowAction: "Notice emotional tension early in the day and give yourself a 60-second breathing pause.",
    sentiment: 'positive',
  };
}
