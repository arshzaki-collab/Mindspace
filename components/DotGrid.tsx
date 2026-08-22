import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors } from '@/lib/theme';

export function DotGrid({ style, columns = 7, rows = 4 }: { style?: ViewStyle; columns?: number; rows?: number }) {
  return (
    <View pointerEvents="none" style={[styles.grid, style]}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <View key={i} style={styles.dot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: 92, flexDirection: 'row', flexWrap: 'wrap', gap: 8, opacity: 0.45 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.primary[300] },
});
