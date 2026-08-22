import { View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { Colors, Radius, Shadows } from '@/lib/theme';

export function Card({
  children,
  style,
  accent,
  tone = 'white',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  tone?: 'white' | 'soft' | 'dark';
}) {
  const backgroundColor = tone === 'dark' ? Colors.neutral[900] : tone === 'soft' ? Colors.neutral[100] : Colors.white;
  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: Radius.xl,
          padding: 18,
          borderWidth: 1,
          borderColor: tone === 'dark' ? Colors.neutral[800] : Colors.neutral[200],
          ...Shadows.sm,
        },
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
