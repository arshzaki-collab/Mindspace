import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  Heart,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wind,
} from 'lucide-react-native';
import { AmbientBackground, GlassCard, NeonButton, P } from '@/components/PremiumUI';
import { fetchMoodEntries, createJournalEntry } from '@/lib/localStore';
import {
  detectEmotion,
  ELEVENLABS_DEFAULT_AGENT_ID,
  generateSessionTakeaway,
  generateVoiceTherapistResponse,
  parseVoiceCommand,
  type EmotionType,
  type SessionTakeaway,
  type VoiceState,
  type VoiceTurn,
} from '@/lib/voiceTherapist';

export default function TherapistVoiceScreen() {
  const router = useRouter();

  // Conversation & Agent States
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>(
    "Hi, I'm Dr. Maya. I'm right here with you. What feels heaviest on your mind today?"
  );
  const [isMuted, setIsMuted] = useState(false);
  const [agentId, setAgentId] = useState(ELEVENLABS_DEFAULT_AGENT_ID);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [takeaway, setTakeaway] = useState<SessionTakeaway | null>(null);
  const [savedToJournal, setSavedToJournal] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);

  // Microphone & Audio Stream States
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Grounding Breath State
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | null>(null);

  // Animation Refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;

  // Audio Context & Recognition Refs
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const restartTimerRef = useRef<any>(null);

  // 1. Initial Greeting
  useEffect(() => {
    async function initSession() {
      try {
        const { data } = await fetchMoodEntries(1);
        const last = data?.[0];
        let greeting = "Hi, I'm Dr. Maya. I'm right here with you. What feels heaviest on your mind today?";
        if (last && last.mood <= 2) {
          greeting = "Hi, I'm Dr. Maya. I noticed things have felt heavy today. You don't have to carry it all alone. How are you holding up right now?";
        }
        setCurrentSubtitle(greeting);
        setTurns([
          {
            id: 'greeting',
            role: 'therapist',
            text: greeting,
            timestamp: new Date().toISOString(),
          },
        ]);
        speakText(greeting);
      } catch {
        // Fallback default
      }
    }
    initSession();

    return () => {
      stopAudioMonitoring();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
        try {
          recognitionRef.current?.abort();
        } catch {}
      }
    };
  }, []);

  // 2. Pulse Visualizer Loop
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (voiceState === 'listening') {
      loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.9, duration: 900, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
          ]),
        ])
      );
    } else if (voiceState === 'speaking') {
      loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.98, duration: 500, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.5, duration: 500, useNativeDriver: true }),
          ]),
        ])
      );
    } else if (voiceState === 'thinking') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
        ])
      );
    } else {
      // idle
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        ])
      );
    }
    loop.start();
    return () => loop?.stop();
  }, [voiceState]);

  // 3. Audio Meter Setup via Web Audio AnalyserNode
  const startAudioMonitoring = async (stream: MediaStream) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!isListeningRef.current) {
          setAudioLevel(0);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(Math.round((avg / 128) * 100), 100);
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.warn('Audio monitoring not supported:', err);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  // 4. Initialize Web Speech Recognition
  const initSpeechEngine = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
      return null;
    }

    const recog = new SpeechRec();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onstart = () => {
      setVoiceState('listening');
      setMicErrorMessage(null);
    };

    recog.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim) {
        setCurrentSubtitle(interim);
      }

      if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        setCurrentSubtitle(text);
        handleIncomingUtterance(text);
      }
    };

    recog.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setHasMicPermission(false);
        setMicErrorMessage('Microphone blocked. Please allow mic permission in your browser address bar.');
        isListeningRef.current = false;
        setVoiceState('idle');
      } else if (event.error === 'service-not-allowed') {
        setMicErrorMessage('Speech service unavailable in this browser. You can type or use the quick buttons below.');
      }
    };

    recog.onend = () => {
      // Auto-restart if listening was not explicitly toggled off
      if (isListeningRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recog.start();
            } catch {}
          }
        }, 300);
      } else {
        setVoiceState('idle');
      }
    };

    return recog;
  };

  // 5. Toggle Microphone & Request Media Permission
  const toggleListening = async () => {
    if (isListeningRef.current) {
      // Stop listening
      isListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}
      stopAudioMonitoring();
      setVoiceState('idle');
    } else {
      // Start listening with mic permission check
      setMicErrorMessage(null);

      // Check / request getUserMedia in browser
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          setHasMicPermission(true);
          startAudioMonitoring(stream);
        } catch (err: any) {
          console.error('Microphone access denied:', err);
          setHasMicPermission(false);
          setMicErrorMessage('Microphone blocked: Please click the lock or mic icon in your browser URL bar to allow access.');
          return;
        }
      }

      // Initialize or start speech recognition
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechEngine();
      }

      if (recognitionRef.current) {
        isListeningRef.current = true;
        setVoiceState('listening');
        setCurrentSubtitle('Listening to you... Speak naturally.');
        try {
          recognitionRef.current.start();
        } catch (err) {
          // If already started, ignore
        }
      } else {
        // Fallback for browsers without speech recognition
        isListeningRef.current = true;
        setVoiceState('listening');
        setCurrentSubtitle('Mic active. Please speak or tap a voice prompt below.');
      }
    }
  };

  // 6. Voice Synthesis (TTS)
  const speakText = (text: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93; // Warm, steady, therapeutic cadence
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Samantha') ||
            v.name.includes('Google US English') ||
            v.name.includes('Natural') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria')) &&
          v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setVoiceState('speaking');
      utterance.onend = () => {
        if (isListeningRef.current) {
          setVoiceState('listening');
          setCurrentSubtitle('Listening to you...');
        } else {
          setVoiceState('idle');
        }
      };
      utterance.onerror = () => {
        setVoiceState(isListeningRef.current ? 'listening' : 'idle');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setVoiceState('speaking');
      const delay = Math.min(Math.max(text.length * 45, 2000), 5000);
      setTimeout(() => {
        setVoiceState(isListeningRef.current ? 'listening' : 'idle');
      }, delay);
    }
  };

  // 7. Handle Speech Utterance (Voice Command or Emotional Dialogue)
  const handleIncomingUtterance = (text: string) => {
    if (!text.trim()) return;

    // A. Check for voice commands first
    const cmdCheck = parseVoiceCommand(text);
    if (cmdCheck.isCommand) {
      if (cmdCheck.command === 'breathe') {
        speakText("Let's take a slow grounding breath together right now.");
        startGroundingBreath();
        return;
      }
      if (cmdCheck.command === 'end') {
        speakText("Ending our session. I'm preparing your reflection takeaways.");
        setTimeout(() => endCall(), 1200);
        return;
      }
      if (cmdCheck.command === 'mute') {
        toggleListening();
        return;
      }
      if (cmdCheck.command === 'clear') {
        setTurns([]);
        setCurrentSubtitle("Session reset. What's on your mind?");
        speakText("Session reset. What's on your mind?");
        return;
      }
    }

    // B. Human Clinical Dialogue Turn
    const userTurn: VoiceTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      emotion: detectEmotion(text),
    };

    setTurns((prev) => [...prev, userTurn]);
    setVoiceState('thinking');
    setCurrentSubtitle('Attuning to your feelings...');

    setTimeout(() => {
      const response = generateVoiceTherapistResponse(text, turns.length);

      const therapistTurn: VoiceTurn = {
        id: `t_${Date.now()}`,
        role: 'therapist',
        text: response.speech,
        timestamp: new Date().toISOString(),
        emotion: response.emotion,
      };

      setTurns((prev) => [...prev, therapistTurn]);
      setCurrentSubtitle(response.speech);
      speakText(response.speech);

      if (response.shouldGround) {
        startGroundingBreath();
      }
    }, 600);
  };

  // 8. Somatic Grounding Breath Cycle
  const startGroundingBreath = () => {
    setVoiceState('grounding');
    setBreathPhase('Inhale');

    Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1.35, duration: 4000, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
    ]).start(() => {
      setBreathPhase(null);
      if (isListeningRef.current) {
        setVoiceState('listening');
        setCurrentSubtitle('Listening to you...');
      } else {
        setVoiceState('idle');
      }
    });
  };

  // 9. End Call & Clinical Takeaway Generation
  const endCall = () => {
    isListeningRef.current = false;
    stopAudioMonitoring();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
      try {
        recognitionRef.current?.abort();
      } catch {}
    }
    const computedTakeaway = generateSessionTakeaway(turns);
    setTakeaway(computedTakeaway);
    setShowTakeaways(true);
    setVoiceState('idle');
  };

  // 10. Save to Journal
  const handleSaveToJournal = async () => {
    if (!takeaway || savedToJournal) return;
    setSavingJournal(true);
    try {
      const body = `Voice Therapy Session with Dr. Maya\n\n📌 Emotional Summary:\n${takeaway.summary}\n\n💡 Key CBT/ACT Insight:\n${takeaway.keyInsight}\n\n🎯 Micro-Action for Tomorrow:\n${takeaway.tomorrowAction}`;
      await createJournalEntry({
        title: 'Voice Session Takeaways',
        body,
        sentiment: takeaway.sentiment,
      });
      setSavedToJournal(true);
    } catch (e) {
      console.error('Failed to save journal', e);
    } finally {
      setSavingJournal(false);
    }
  };

  const getOrbColors = (): [string, string, string] => {
    switch (voiceState) {
      case 'listening':
        return [P.mint, P.cyan, '#2563EB'];
      case 'speaking':
        return [P.violet, P.pink, '#F43F5E'];
      case 'thinking':
        return [P.purple, '#6366F1', P.pink];
      case 'grounding':
        return [P.mint, '#059669', P.cyan];
      default:
        return [P.cyan, P.violet, P.pink];
    }
  };

  return (
    <AmbientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={P.white} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.doctorBadge}>
              <View
                style={[
                  styles.statusDot,
                  voiceState !== 'idle' ? styles.statusDotActive : styles.statusDotIdle,
                ]}
              />
              <Text style={styles.doctorName}>Dr. Maya</Text>
            </View>
            <Text style={styles.doctorSubtitle}>
              {voiceState === 'listening'
                ? 'Listening to you...'
                : voiceState === 'speaking'
                ? 'Speaking with warmth...'
                : voiceState === 'grounding'
                ? 'Somatic Grounding Breath...'
                : voiceState === 'thinking'
                ? 'Attuning...'
                : 'Mindspace Voice Companion'}
            </Text>
          </View>

          <Pressable onPress={() => setIsConfigOpen(true)} style={styles.configBtn}>
            <Sparkles size={18} color={P.purple} />
          </Pressable>
        </View>

        {/* Microphone Error / Warning Banner */}
        {micErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={P.gold} />
            <Text style={styles.errorText}>{micErrorMessage}</Text>
          </View>
        )}

        {/* Center Visualizer & Glowing Orb */}
        <View style={styles.centerContainer}>
          <View style={styles.orbWrapper}>
            {/* Ambient Background Blur Rings with Audio Level Scale */}
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glowAnim,
                  transform: [
                    {
                      scale:
                        voiceState === 'grounding'
                          ? breathAnim
                          : Animated.add(
                              pulseAnim,
                              new Animated.Value((audioLevel / 100) * 0.25)
                            ),
                    },
                  ],
                },
              ]}
            />

            {/* Core Interactive Glowing Orb */}
            <Animated.View
              style={[
                styles.orbCore,
                {
                  transform: [
                    {
                      scale:
                        voiceState === 'grounding'
                          ? breathAnim
                          : Animated.add(
                              pulseAnim,
                              new Animated.Value((audioLevel / 100) * 0.15)
                            ),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient colors={getOrbColors()} style={StyleSheet.absoluteFill} />
              <View style={styles.orbInnerSymbol}>
                {voiceState === 'grounding' ? (
                  <Wind size={38} color={P.white} />
                ) : voiceState === 'listening' ? (
                  <Mic size={38} color={P.white} />
                ) : voiceState === 'speaking' ? (
                  <Volume2 size={38} color={P.white} />
                ) : (
                  <Heart size={38} color={P.white} />
                )}
              </View>
            </Animated.View>
          </View>

          {/* Real-time Subtitle & Voice Feedback */}
          <GlassCard style={styles.subtitleCard} glow={voiceState !== 'idle'}>
            <View style={styles.subtitleHeader}>
              <Sparkles size={14} color={P.mint} />
              <Text style={styles.subtitleSpeaker}>
                {voiceState === 'listening' ? 'YOU (SPEAKING)' : 'DR. MAYA'}
              </Text>
              {audioLevel > 5 && voiceState === 'listening' && (
                <View style={styles.liveAudioBadge}>
                  <View style={[styles.audioLevelBar, { height: Math.max(4, (audioLevel / 100) * 16) }]} />
                  <View style={[styles.audioLevelBar, { height: Math.max(6, (audioLevel / 100) * 20) }]} />
                  <View style={[styles.audioLevelBar, { height: Math.max(4, (audioLevel / 100) * 14) }]} />
                </View>
              )}
            </View>
            <Text style={styles.subtitleText}>{currentSubtitle}</Text>
          </GlassCard>

          {/* Voice Command & Expression Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptChips}
          >
            <Pressable
              onPress={() => handleIncomingUtterance("I feel completely exhausted and like giving up.")}
              style={styles.promptChip}
            >
              <Text style={styles.promptChipText}>"I'm completely exhausted"</Text>
            </Pressable>

            <Pressable
              onPress={() => handleIncomingUtterance("My thoughts are spinning and I can't calm down.")}
              style={styles.promptChip}
            >
              <Text style={styles.promptChipText}>"Thoughts are spinning"</Text>
            </Pressable>

            <Pressable
              onPress={() => handleIncomingUtterance("Help me breathe")}
              style={[styles.promptChip, styles.commandChip]}
            >
              <Wind size={13} color={P.mint} />
              <Text style={[styles.promptChipText, { color: P.mint }]}>"Help me breathe"</Text>
            </Pressable>

            <Pressable
              onPress={() => handleIncomingUtterance("I feel so lonely and isolated.")}
              style={styles.promptChip}
            >
              <Text style={styles.promptChipText}>"I feel so lonely"</Text>
            </Pressable>

            <Pressable
              onPress={() => handleIncomingUtterance("End call")}
              style={[styles.promptChip, { borderColor: 'rgba(239,68,68,0.3)' }]}
            >
              <Text style={[styles.promptChipText, { color: P.danger }]}>"End call"</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Text Input Backup for Silent Environments */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a feeling or voice command..."
            placeholderTextColor={P.muted}
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={() => {
              if (customInput.trim()) {
                handleIncomingUtterance(customInput.trim());
                setCustomInput('');
              }
            }}
          />
          <Pressable
            onPress={() => {
              if (customInput.trim()) {
                handleIncomingUtterance(customInput.trim());
                setCustomInput('');
              }
            }}
            style={styles.sendTextBtn}
          >
            <Sparkles size={16} color={P.white} />
          </Pressable>
        </View>

        {/* Bottom Voice Action Bar */}
        <View style={styles.controlsBar}>
          {/* Grounding Breath Button */}
          <Pressable
            onPress={startGroundingBreath}
            style={[styles.controlBtn, voiceState === 'grounding' && styles.controlBtnActive]}
          >
            <Wind size={22} color={voiceState === 'grounding' ? P.mint : P.white} />
            <Text style={styles.controlLabel}>Ground</Text>
          </Pressable>

          {/* Main Mic Toggle */}
          <Pressable
            onPress={toggleListening}
            style={[styles.mainMicBtn, voiceState === 'listening' && styles.mainMicBtnActive]}
          >
            {voiceState === 'listening' ? (
              <Mic size={34} color={P.white} />
            ) : (
              <MicOff size={34} color={P.muted} />
            )}
          </Pressable>

          {/* End Call Button */}
          <Pressable onPress={endCall} style={styles.endCallBtn}>
            <PhoneOff size={22} color={P.danger} />
            <Text style={[styles.controlLabel, { color: P.danger }]}>End</Text>
          </Pressable>
        </View>

        {/* Takeaway Modal (Clinical Summary to Journal) */}
        <Modal visible={showTakeaways} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalContent} glow>
              <View style={styles.modalTop}>
                <View style={styles.modalIconWrap}>
                  <Heart size={24} color={P.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Session Takeaways</Text>
                  <Text style={styles.modalSubtitle}>Clinical reflections from Dr. Maya</Text>
                </View>
              </View>

              {takeaway && (
                <ScrollView style={styles.takeawayScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.takeawaySection}>
                    <Text style={styles.takeawayLabel}>EMOTIONAL REFLECTION</Text>
                    <Text style={styles.takeawayText}>{takeaway.summary}</Text>
                  </View>

                  <View style={styles.takeawaySection}>
                    <Text style={styles.takeawayLabel}>KEY CBT / ACT INSIGHT</Text>
                    <Text style={styles.takeawayText}>{takeaway.keyInsight}</Text>
                  </View>

                  <View style={styles.takeawaySection}>
                    <Text style={styles.takeawayLabel}>TOMORROW'S MICRO-ACTION</Text>
                    <Text style={styles.takeawayActionText}>{takeaway.tomorrowAction}</Text>
                  </View>
                </ScrollView>
              )}

              <View style={styles.modalActions}>
                <NeonButton
                  onPress={handleSaveToJournal}
                  icon={
                    savedToJournal ? (
                      <CheckCircle2 size={18} color={P.white} />
                    ) : (
                      <BookmarkPlus size={18} color={P.white} />
                    )
                  }
                  style={{ flex: 1 }}
                >
                  {savedToJournal
                    ? 'Saved to Journal!'
                    : savingJournal
                    ? 'Saving...'
                    : 'Save to Journal'}
                </NeonButton>

                <Pressable
                  onPress={() => {
                    setShowTakeaways(false);
                    router.replace('/(tabs)');
                  }}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneBtnText}>Close</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </Modal>

        {/* ElevenLabs Configuration Modal */}
        <Modal visible={isConfigOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.configModal}>
              <View style={styles.modalTop}>
                <Sparkles size={20} color={P.purple} />
                <Text style={styles.modalTitle}>ElevenLabs Voice Model</Text>
              </View>
              <Text style={styles.configDesc}>
                Dr. Maya is trained on conversational clinical attunement, somatic grounding, and ACT
                cognitive defusion.
              </Text>

              <View style={styles.configField}>
                <Text style={styles.fieldLabel}>AGENT ID</Text>
                <TextInput
                  style={styles.configInput}
                  value={agentId}
                  onChangeText={setAgentId}
                  placeholder="e.g. HKFOb9iktHA85uKXydRT"
                  placeholderTextColor={P.muted}
                />
              </View>

              <Pressable
                onPress={() => setIsConfigOpen(false)}
                style={styles.configSaveBtn}
              >
                <Text style={styles.configSaveText}>Apply Settings</Text>
              </Pressable>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: P.mint,
    shadowColor: P.mint,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  statusDotIdle: {
    backgroundColor: P.muted,
  },
  doctorName: {
    color: P.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  doctorSubtitle: {
    color: P.muted,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  configBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(126,75,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  errorText: {
    color: P.gold,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  orbWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(126,75,255,0.22)',
  },
  orbCore: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.violet,
    shadowOpacity: 0.8,
    shadowRadius: 35,
    elevation: 20,
  },
  orbInnerSymbol: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(8,8,20,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleCard: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  subtitleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  subtitleSpeaker: {
    color: P.mint,
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'Inter-Bold',
  },
  liveAudioBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginLeft: 8,
    height: 18,
  },
  audioLevelBar: {
    width: 3,
    backgroundColor: P.mint,
    borderRadius: 2,
  },
  subtitleText: {
    color: P.white,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Medium',
  },
  promptChips: {
    gap: 8,
    paddingVertical: 6,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commandChip: {
    backgroundColor: 'rgba(77,224,178,0.12)',
    borderColor: 'rgba(77,224,178,0.35)',
  },
  promptChipText: {
    color: P.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(16,19,34,0.85)',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: P.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: P.line,
  },
  sendTextBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: P.line,
  },
  controlBtnActive: {
    borderColor: P.mint,
    backgroundColor: 'rgba(77,224,178,0.15)',
  },
  controlLabel: {
    color: P.white,
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  mainMicBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: P.line,
  },
  mainMicBtnActive: {
    backgroundColor: P.violet,
    borderColor: P.pink,
    shadowColor: P.violet,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 24,
    maxHeight: '80%',
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,95,150,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: P.white,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  modalSubtitle: {
    color: P.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  takeawayScroll: {
    marginVertical: 12,
  },
  takeawaySection: {
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  takeawayLabel: {
    color: P.purple,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  takeawayText: {
    color: P.white,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter-Regular',
  },
  takeawayActionText: {
    color: P.mint,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter-SemiBold',
  },
  modalActions: {
    marginTop: 14,
    gap: 8,
  },
  doneBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: P.muted,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  configModal: {
    padding: 20,
    borderRadius: 24,
  },
  configDesc: {
    color: P.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  configField: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: P.purple,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  configInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    color: P.white,
    borderWidth: 1,
    borderColor: P.line,
  },
  configSaveBtn: {
    backgroundColor: P.violet,
    borderRadius: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configSaveText: {
    color: P.white,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});
