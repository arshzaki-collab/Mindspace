import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/lib/theme';

export function RainbowAccent() {
  const colors = [Colors.neon.pink, Colors.neon.yellow, Colors.neon.lime, Colors.neon.cyan, Colors.neon.purple];
  return (
    <View style={styles.bar}>
      {colors.map((color) => <View key={color} style={[styles.segment, { backgroundColor: color }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 4, width: 86, overflow: 'hidden', borderRadius: Radius.full, gap: 2 },
  segment: { flex: 1, borderRadius: Radius.full },
});
