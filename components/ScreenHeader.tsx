import type { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography, Shadows } from '@/lib/theme';

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
            <Sparkles size={12} color={Colors.primary[600]} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          {action.icon}
          <Text style={styles.actionText}>{action.label}</Text>
          <ArrowUpRight size={15} color={Colors.primary[700]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 22 },
  copy: { flex: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  eyebrowText: { ...Typography.caption, color: Colors.primary[600], letterSpacing: 1.1 },
  title: { ...Typography.display, color: Colors.ink, fontSize: 31, lineHeight: 37 },
  subtitle: { ...Typography.body, color: Colors.body, marginTop: 8, lineHeight: 22 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.white, ...Shadows.sm },
  actionPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  actionText: { ...Typography.caption, color: Colors.ink },
});
