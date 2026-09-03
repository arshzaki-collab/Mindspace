import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { AmbientBackground, GlassCard, GlowOrb, P } from '@/components/PremiumUI';

export default function SignUpScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signUp = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace('/(tabs)');
      return;
    }

    // If email confirmation is enabled in Supabase,
    // continue to the app after the account is created.
    router.replace('/(tabs)');
  };

  return (
    <AmbientBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.top}>
              <View style={styles.logo}>
                <Sparkles size={20} color={P.white} />
              </View>

              <Text style={styles.brand}>MINDSPACE</Text>

              <View style={styles.orb}>
                <GlowOrb size={90} />
              </View>
            </View>

            <Text style={styles.kicker}>YOUR PRIVATE SPACE</Text>

            <Text style={styles.title}>
              Start taking care of your mind.
            </Text>

            <Text style={styles.subtitle}>
              Create your Mindspace account and make this space yours.
            </Text>

            <GlassCard glow style={styles.card}>
              <Field
                icon={<User size={18} color={P.purple} />}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Field
                icon={<Mail size={18} color={P.cyan} />}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.inputWrap}>
                <Lock size={18} color={P.pink} />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={P.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={P.muted} />
                  ) : (
                    <Eye size={19} color={P.muted} />
                  )}
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={signUp}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={P.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create my Mindspace</Text>
                    <ArrowRight size={20} color={P.white} />
                  </>
                )}
              </Pressable>
            </GlassCard>

            <View style={styles.linksRow}>
              <Pressable onPress={() => router.push('/login')} hitSlop={10}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkHighlight}>Sign in</Text>
                </Text>
              </Pressable>
              <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={10} style={styles.guestButton}>
                <Text style={styles.guestLinkText}>Continue without an account</Text>
              </Pressable>
            </View>

            <Text style={styles.privateText}>
              Your reflections stay in your private space.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AmbientBackground>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}: any) {
  return (
    <View style={styles.inputWrap}>
      {icon}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={P.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  safe: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 28,
    justifyContent: 'center',
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 38,
  },

  logo: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: P.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.violet,
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 12,
  },

  brand: {
    color: P.white,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    letterSpacing: 2.5,
    marginLeft: 11,
  },

  orb: {
    position: 'absolute',
    right: -12,
    top: -25,
    opacity: 0.8,
  },

  kicker: {
    color: '#BFAEFF',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 2,
  },

  title: {
    color: P.white,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 34,
    lineHeight: 40,
    marginTop: 8,
    maxWidth: 340,
  },

  subtitle: {
    color: P.muted,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 25,
    maxWidth: 330,
  },

  card: {
    padding: 17,
  },

  inputWrap: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: 'rgba(255,255,255,.045)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 11,
  },

  input: {
    flex: 1,
    color: P.white,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 11,
    paddingVertical: 4,
  },

  error: {
    color: P.danger,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 10,
  },

  button: {
    minHeight: 57,
    borderRadius: 19,
    backgroundColor: P.violet,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: P.violet,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: P.white,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
  },

  privateText: {
    color: P.muted,
    fontFamily: 'Inter-Regular',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 18,
  },
  linksRow: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  loginLinkText: {
    color: P.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  loginLinkHighlight: {
    color: P.cyan,
    fontFamily: 'Inter-Bold',
  },
  guestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  guestLinkText: {
    color: P.muted,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});
