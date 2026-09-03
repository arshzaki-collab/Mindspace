import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUp, Bot, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react-native';
import { supabase, type ChatMessageRow } from '@/lib/supabase';
import { fetchChatMessages, recordChatMessage, saveLocalChatMessages } from '@/lib/localStore';
import { generateResponse, QUICK_PROMPTS, type ChatSuggestion, type ConversationMessage } from '@/lib/chatEngine';
import { AmbientBackground, GlassCard, GlowOrb, P, Pill } from '@/components/PremiumUI';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ChatSuggestion[];
  isCrisis?: boolean;
  created_at: string;
};

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "I'm here with you. Vent, ask a question, or let me help you make one small plan.",
  suggestions: [{ label: 'I feel anxious' }, { label: 'I keep overthinking' }, { label: 'Help me make a plan' }],
  created_at: new Date().toISOString(),
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    const { data } = await fetchChatMessages(100);
    if (data?.length) {
      setMessages(
        data.map((r: ChatMessageRow) => ({
          id: r.id,
          role: r.role as 'user' | 'assistant',
          content: r.content,
          created_at: r.created_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bottom = () => setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 80);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    const u: Message = {
      id: `u${Date.now()}`,
      role: 'user',
      content: t,
      created_at: new Date().toISOString(),
    };
    setMessages((x) => [...x, u]);
    setInput('');
    setTyping(true);
    bottom();

    await recordChatMessage({ role: 'user', content: t });

    const history: ConversationMessage[] = [...messages, u].slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const [{ data: mood }, { data: journal }] = await Promise.all([
      supabase.from('mood_entries').select('mood,energy,anxiety,sleep_hours').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('journal_entries').select('sentiment').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const r = generateResponse(t, {
      history,
      mood: mood?.mood ?? null,
      energy: mood?.energy ?? null,
      anxiety: mood?.anxiety ?? null,
      sleepHours: mood?.sleep_hours ?? null,
      journalSentiment: journal?.sentiment ?? null,
    });

    setTimeout(async () => {
      const a: Message = {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: r.text,
        suggestions: r.suggestions,
        isCrisis: r.isCrisis,
        created_at: new Date().toISOString(),
      };
      setMessages((x) => [...x, a]);
      setTyping(false);
      bottom();
      await recordChatMessage({ role: 'assistant', content: r.text });
    }, 650);
  };

  const clear = async () => {
    try {
      await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {}
    await saveLocalChatMessages([]);
    setMessages([WELCOME]);
  };

  return (
    <AmbientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headLeft}>
            <View style={styles.avatar}>
              <Sparkles size={20} color={P.white} />
            </View>
            <View>
              <Text style={styles.title}>AI Companion</Text>
              <Text style={styles.sub}>Private space · always here</Text>
            </View>
          </View>
          <Pressable onPress={clear} style={styles.iconBtn}>
            <RotateCcw size={16} color={P.muted} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <GlowOrb size={88} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroTitle}>Talk it out.</Text>
            <Text style={styles.heroText}>You don't need the perfect words. Start wherever you are.</Text>
          </View>
        </View>

        <FlatList
          ref={ref}
          data={messages}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={[styles.msgRow, item.role === 'user' && { justifyContent: 'flex-end' }]}>
              {item.role === 'assistant' ? (
                <View style={styles.botMini}>
                  <Bot size={14} color={P.white} />
                </View>
              ) : null}
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={styles.msgText}>{item.content}</Text>
              </View>
            </View>
          )}
          keyExtractor={(x) => x.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={bottom}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            loading ? (
              <ActivityIndicator color={P.purple} />
            ) : (
              <View style={styles.notice}>
                <ShieldCheck size={13} color={P.mint} />
                <Text style={styles.noticeText}>Supportive guidance, not a diagnosis.</Text>
              </View>
            )
          }
          ListFooterComponent={
            <View>
              {typing ? (
                <View style={styles.typing}>
                  <View style={styles.botMini}>
                    <Bot size={14} color={P.white} />
                  </View>
                  <View style={styles.dots}>
                    <View />
                    <View />
                    <View />
                  </View>
                </View>
              ) : null}
            </View>
          }
        />

        <View style={styles.quick}>
          {QUICK_PROMPTS.slice(0, 3).map((x, i) => (
            <Pill key={i} onPress={() => send(x)}>
              {x}
            </Pill>
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <GlassCard style={styles.inputCard}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Share what's on your mind..."
              placeholderTextColor={P.muted}
              multiline
              style={styles.input}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || typing}
              style={[styles.send, !input.trim() && { opacity: 0.35 }]}
            >
              <ArrowUp size={20} color={P.white} />
            </Pressable>
          </GlassCard>
          <Text style={styles.disclaimer}>One sentence is enough.</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headLeft: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.violet,
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  title: { color: P.white, fontSize: 17, fontFamily: 'Inter-Bold' },
  sub: { color: P.muted, fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: P.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(126,75,255,.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: { color: P.white, fontSize: 18, fontFamily: 'Inter-Bold' },
  heroText: { color: P.muted, fontSize: 11.5, lineHeight: 17, fontFamily: 'Inter-Regular', marginTop: 3 },
  list: { padding: 14, paddingBottom: 8 },
  notice: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(255,255,255,.03)',
    marginBottom: 12,
  },
  noticeText: { color: P.muted, fontSize: 10, fontFamily: 'Inter-Medium' },
  msgRow: { flexDirection: 'row', gap: 7, marginBottom: 10, alignItems: 'flex-end' },
  botMini: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 19, borderWidth: 1, borderColor: P.line },
  botBubble: { backgroundColor: 'rgba(255,255,255,.05)', borderBottomLeftRadius: 5 },
  userBubble: { backgroundColor: P.violet, borderBottomRightRadius: 5, borderColor: 'rgba(255,255,255,.15)' },
  msgText: { color: P.white, fontSize: 14, lineHeight: 21, fontFamily: 'Inter-Regular' },
  typing: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dots: {
    height: 38,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,.05)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quick: { paddingHorizontal: 14, paddingBottom: 7, flexDirection: 'row', gap: 6 },
  inputCard: { marginHorizontal: 14, padding: 7, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 21 },
  input: {
    flex: 1,
    maxHeight: 90,
    color: P.white,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  send: { width: 44, height: 44, borderRadius: 15, backgroundColor: P.violet, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { color: P.muted, textAlign: 'center', fontSize: 10, paddingVertical: 6, fontFamily: 'Inter-Regular' },
});
