import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, Check, UserRoundPlus } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { DotGrid } from '@/components/DotGrid';
import { RainbowAccent } from '@/components/RainbowAccent';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || password.length < 6) {
      setMessage('Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setBusy(true); setMessage(null);
    const result = mode === 'signIn'
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({ email: cleanEmail, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === 'signUp') setMessage('Account created. Check your email if confirmation is enabled.');
    else router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View pointerEvents="none" style={styles.orbOne} /><View pointerEvents="none" style={styles.orbTwo} /><DotGrid style={styles.dots} />
          <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft size={17} color={Colors.neutral[700]} /><Text style={styles.backText}>Back</Text></Pressable>

          <View style={styles.brandRow}><View style={styles.brandMark}><Sparkles size={18} color={Colors.white} /></View><Text style={styles.brandName}>MINDSPACE</Text></View>
          <Text style={styles.kicker}>A QUIETER WAY IN</Text>
          <Text style={styles.title}>{mode === 'signIn' ? 'Welcome back.' : 'Create your space.'}</Text>
          <Text style={styles.subtitle}>Keep your check-ins, journal entries, and conversation history together.</Text>
          <RainbowAccent />

          <View style={styles.benefits}>
            {['Save progress across sessions', 'Keep your reflections in one place', 'Use the companion with context'].map((item) => <View key={item} style={styles.benefit}><Check size={14} color={Colors.success} /><Text style={styles.benefitText}>{item}</Text></View>)}
          </View>

          <View style={styles.switcher}>
            <Pressable onPress={() => { setMode('signIn'); setMessage(null); }} style={[styles.switchButton, mode === 'signIn' && styles.switchActive]}><Text style={[styles.switchText, mode === 'signIn' && styles.switchActiveText]}>Sign in</Text></Pressable>
            <Pressable onPress={() => { setMode('signUp'); setMessage(null); }} style={[styles.switchButton, mode === 'signUp' && styles.switchActive]}><Text style={[styles.switchText, mode === 'signUp' && styles.switchActiveText]}>Create account</Text></Pressable>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}><Mail size={18} color={Colors.neutral[400]} /><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={Colors.neutral[400]} /></View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}><LockKeyhole size={18} color={Colors.neutral[400]} /><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="At least 6 characters" placeholderTextColor={Colors.neutral[400]} /><Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>{showPassword ? <EyeOff size={18} color={Colors.neutral[500]} /> : <Eye size={18} color={Colors.neutral[500]} />}</Pressable></View>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.submit, pressed && { transform: [{ translateY: 1 }] }, busy && { opacity: 0.65 }]}>
              {busy ? <ActivityIndicator color={Colors.white} /> : <><Text style={styles.submitText}>{mode === 'signIn' ? 'Continue' : 'Create account'}</Text><ArrowRight size={18} color={Colors.white} /></>}
            </Pressable>
            <View style={styles.cardFoot}><ShieldCheck size={14} color={Colors.primary[600]} /><Text style={styles.cardFootText}>Authentication is handled by your connected Supabase project.</Text></View>
          </View>

          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skip}><UserRoundPlus size={15} color={Colors.neutral[500]} /><Text style={styles.skipText}>Continue without an account</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 12, paddingBottom: 44, minHeight: '100%', justifyContent: 'center' },
  orbOne: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.pastel.lavender, top: -110, right: -105 },
  orbTwo: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.pastel.pink, bottom: -90, left: -60 },
  dots: { position: 'absolute', top: 54, right: 22 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 8, marginBottom: Spacing.lg },
  backText: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700] },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: Colors.neutral[900], alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  brandName: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 1.55, color: Colors.neutral[600] },
  kicker: { marginTop: Spacing.lg, fontSize: 10, letterSpacing: 1.2, fontFamily: 'Inter-Bold', color: Colors.primary[600] },
  title: { ...Typography.display, fontFamily: 'Inter-ExtraBold', color: Colors.neutral[900], marginTop: 4, fontSize: 34 },
  subtitle: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 8, maxWidth: 430, lineHeight: 22 },
  benefits: { marginTop: Spacing.lg, gap: 7 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  benefitText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[600] },
  switcher: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.md, padding: 4, marginTop: Spacing.lg },
  switchButton: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  switchActive: { backgroundColor: Colors.white, ...Shadows.sm },
  switchText: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[500] },
  switchActiveText: { color: Colors.neutral[900], fontFamily: 'Inter-SemiBold' },
  formCard: { marginTop: Spacing.md, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: Radius.xl, padding: 18, ...Shadows.md },
  label: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700], marginBottom: 6, marginTop: 3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: Radius.md, paddingHorizontal: 13, backgroundColor: Colors.white, marginBottom: 10 },
  input: { flex: 1, minHeight: 50, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900] },
  message: { ...Typography.small, fontFamily: 'Inter-Medium', color: Colors.neutral[600], marginVertical: 4 },
  submit: { marginTop: 8, borderRadius: Radius.md, minHeight: 54, backgroundColor: Colors.primary[700], alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...Shadows.md },
  submitText: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold', color: Colors.white },
  cardFoot: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: Spacing.md },
  cardFootText: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.neutral[400], flex: 1, lineHeight: 17 },
  skip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, padding: 8 },
  skipText: { ...Typography.small, fontFamily: 'Inter-SemiBold', color: Colors.neutral[500] },
});
