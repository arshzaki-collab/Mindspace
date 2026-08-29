import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Send, Sparkles, AlertTriangle, Bot, RotateCcw, ArrowUpRight, ShieldCheck, Mic } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, type ChatMessageRow } from '@/lib/supabase';
import { generateResponse, QUICK_PROMPTS, type ChatSuggestion, type ConversationMessage } from '@/lib/chatEngine';


type Message = { id: string; role: 'user' | 'assistant'; content: string; suggestions?: ChatSuggestion[]; isCrisis?: boolean; created_at: string };
const WELCOME_MESSAGE: Message = { id: 'welcome', role: 'assistant', content: "Hi. I'm here with you. You can vent, ask a question, or ask me to help make a small plan. I’ll keep the thread of the conversation in mind instead of treating every message like a brand-new chat.", suggestions: [{ label: 'I feel anxious' }, { label: 'I keep overthinking' }, { label: 'Help me make a plan' }], created_at: new Date().toISOString() };

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList<Message>>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(100);
    if (data?.length) setMessages(data.map((row: ChatMessageRow) => ({ id: row.id, role: row.role as 'user' | 'assistant', content: row.content, created_at: row.created_at })));
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const scrollToBottom = useCallback(() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80), []);

  const loadWellnessContext = useCallback(async () => {
    const [{ data: moodData }, { data: journalData }] = await Promise.all([
      supabase.from('mood_entries').select('mood, energy, anxiety, sleep_hours').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('journal_entries').select('sentiment').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    return {
      mood: moodData?.mood ?? null,
      energy: moodData?.energy ?? null,
      anxiety: moodData?.anxiety ?? null,
      sleepHours: moodData?.sleep_hours ?? null,
      journalSentiment: journalData?.sentiment ?? null,
    };
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: trimmed, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    scrollToBottom();
    await supabase.from('chat_messages').insert({ role: 'user', content: trimmed });
    const recentHistory: ConversationMessage[] = [...messages, userMsg]
      .slice(-8)
      .map((message) => ({ role: message.role, content: message.content }));

    const wellnessContext = await loadWellnessContext();
    const response = generateResponse(trimmed, { history: recentHistory, ...wellnessContext });
    setTimeout(async () => {
      const assistantMsg: Message = { id: `temp-${Date.now()}-ai`, role: 'assistant', content: response.text, suggestions: response.suggestions, isCrisis: response.isCrisis, created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMsg]);
      setTyping(false);
      scrollToBottom();
      await supabase.from('chat_messages').insert({ role: 'assistant', content: response.text });
    }, 600 + Math.random() * 500);
  };

  const clearChat = async () => {
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setMessages([WELCOME_MESSAGE]);
  };

  const handleSuggestion = (s: ChatSuggestion) => s.route ? router.push(s.route as any) : sendMessage(s.label);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && <View style={styles.botAvatar}><Bot size={16} color={Colors.white} /></View>}
        <View style={[styles.bubble, isUser ? styles.userBubble : item.isCrisis ? styles.crisisBubble : styles.botBubble]}>
          {item.isCrisis && <View style={styles.crisisHeader}><AlertTriangle size={15} color={Colors.error} /><Text style={styles.crisisLabel}>Immediate support</Text></View>}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const lastBot = [...messages].reverse().find((m) => m.role === 'assistant' && m.suggestions);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}><Sparkles size={18} color={Colors.white} /></View>
          <View><Text style={styles.headerTitle}>Wellness Companion</Text><Text style={styles.headerSubtitle}>Listen • reflect • take one next step</Text></View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={clearChat} hitSlop={12} style={styles.headerAction}><RotateCcw size={17} color={Colors.neutral[600]} /></Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListHeaderComponent={loading ? <ActivityIndicator color={Colors.primary[600]} style={{ marginVertical: Spacing.lg }} /> : <View style={styles.notice}><ShieldCheck size={14} color={Colors.primary[700]} /><Text style={styles.noticeText}>Supportive guidance, not a diagnosis or a replacement for care.</Text></View>}
        ListFooterComponent={
          <View>
            {typing && <View style={[styles.messageRow, styles.botRow]}><View style={styles.botAvatar}><Bot size={16} color={Colors.white} /></View><View style={[styles.bubble, styles.botBubble, styles.typingBubble]}><View style={styles.typingDots}>{[0,1,2].map((i) => <View key={i} style={styles.typingDot} />)}</View></View></View>}
            {lastBot?.suggestions ? <View style={styles.suggestionsRow}>{lastBot.suggestions.map((s, i) => <Pressable key={i} onPress={() => handleSuggestion(s)} style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionPressed]}><Text style={styles.suggestionText}>{s.label}</Text><ArrowUpRight size={14} color={Colors.primary[700]} /></Pressable>)}</View> : null}
          </View>
        }
      />

      <View style={styles.quickWrap}>{QUICK_PROMPTS.slice(0, 3).map((prompt, i) => <Pressable key={i} onPress={() => sendMessage(prompt)} style={({ pressed }) => [styles.quickPrompt, pressed && { backgroundColor: Colors.primary[50] }]}><Text style={styles.quickPromptText}>{prompt}</Text></Pressable>)}</View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <BlurView intensity={38} tint="light" style={styles.inputShell}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Share what's on your mind..." placeholderTextColor={Colors.neutral[400]} multiline maxLength={500} editable={!typing} />
          <Pressable style={({ pressed }) => [styles.sendButton, (!input.trim() || typing) && styles.sendDisabled, pressed && styles.sendPressed]} onPress={() => sendMessage(input)} disabled={!input.trim() || typing}><Send size={18} color={Colors.white} /></Pressable>
        </BlurView>
        <Text style={styles.disclaimer}>You can always keep things small. One sentence is enough.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200], backgroundColor: Colors.white },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.neutral[900], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3, fontFamily: 'Inter-SemiBold', color: Colors.neutral[900] },
  headerSubtitle: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 2 },
  headerAction: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.white },
  chatList: { paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 8 },
  notice: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: Radius.full, backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[100], marginBottom: 12 },
  noticeText: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.primary[800] },
  messageRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '100%' },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  botAvatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.primary[700], alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 3 },
  bubble: { maxWidth: '84%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: { backgroundColor: Colors.neutral[900], borderBottomRightRadius: 6 },
  botBubble: { backgroundColor: Colors.neutral[100], borderWidth: 1, borderColor: Colors.neutral[200], borderBottomLeftRadius: 6 },
  crisisBubble: { backgroundColor: '#FFF5F6', borderWidth: 1, borderColor: '#F4CDD2', borderBottomLeftRadius: 6 },
  messageText: { ...Typography.body, fontFamily: 'Inter-Regular', lineHeight: 23 },
  userText: { color: Colors.white },
  botText: { color: Colors.neutral[800] },
  crisisHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  crisisLabel: { ...Typography.caption, fontFamily: 'Inter-Bold', color: Colors.error },
  typingBubble: { paddingVertical: 14 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.neutral[400] },
  suggestionsRow: { paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: Colors.primary[200], backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 9 },
  suggestionPressed: { backgroundColor: Colors.primary[50], transform: [{ translateY: -1 }] },
  suggestionText: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.primary[800] },
  quickWrap: { flexDirection: 'row', gap: 7, paddingHorizontal: Spacing.md, paddingBottom: 8 },
  quickPrompt: { flex: 1, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.white, borderRadius: Radius.full, paddingVertical: 9, paddingHorizontal: 8, alignItems: 'center' },
  quickPromptText: { fontSize: 10.5, lineHeight: 14, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700], textAlign: 'center' },
  inputShell: { marginHorizontal: Spacing.md, minHeight: 58, paddingLeft: 14, paddingRight: 7, paddingVertical: 7, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: 'rgba(255,255,255,0.86)', ...Shadows.sm },
  input: { flex: 1, maxHeight: 100, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900], paddingTop: 9, paddingBottom: 8 },
  sendButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary[700], alignItems: 'center', justifyContent: 'center' },
  sendPressed: { transform: [{ scale: 0.96 }] },
  sendDisabled: { backgroundColor: Colors.neutral[300] },
  disclaimer: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.neutral[400], textAlign: 'center', paddingVertical: 7 },
});
