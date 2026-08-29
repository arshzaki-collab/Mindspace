import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/lib/theme';

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; icon?: ReactNode; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        {eyebrow ? (
          <View style={styles.eyebrow}>
            <Sparkles size={13} color={Colors.primary[600]} />
            <Text style={styles.eyebrowText}>{eyebrow.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.actionActive]}
          onPress={action.onPress}
          accessibilityRole="button"
        >
          {action.icon}
          <Text style={styles.actionText}>{action.label}</Text>
          <ChevronRight size={15} color={Colors.neutral[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  copy: { flex: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  eyebrowText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1.15, color: Colors.primary[600] },
  title: { ...Typography.display, fontFamily: 'Inter-ExtraBold', color: Colors.neutral[900], fontSize: 30, lineHeight: 36 },
  subtitle: { ...Typography.body, fontFamily: 'Inter-Regular', color: Colors.neutral[500], marginTop: 7, lineHeight: 22, maxWidth: 520 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.white },
  actionActive: { backgroundColor: Colors.neutral[100], transform: [{ translateY: -1 }] },
  actionText: { ...Typography.caption, fontFamily: 'Inter-SemiBold', color: Colors.neutral[700] },
});
