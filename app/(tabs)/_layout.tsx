import { Tabs } from 'expo-router';
import type { ElementType } from 'react';
import { StyleSheet } from 'react-native';
import { House, HeartPulse, MessageCircle, BookOpen, Sparkles } from 'lucide-react-native';
import { Colors } from '@/lib/theme';

const TabIcon = ({ icon: Icon, focused }: { icon: ElementType; focused: boolean }) => (
  <Icon size={22} color={focused ? Colors.primary[600] : Colors.neutral[400]} strokeWidth={focused ? 2.5 : 1.9} />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon icon={House} focused={focused} /> }} />
      <Tabs.Screen name="mood" options={{ title: 'Mood', tabBarIcon: ({ focused }) => <TabIcon icon={HeartPulse} focused={focused} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Companion', tabBarIcon: ({ focused }) => <TabIcon icon={MessageCircle} focused={focused} /> }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: ({ focused }) => <TabIcon icon={BookOpen} focused={focused} /> }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools', tabBarIcon: ({ focused }) => <TabIcon icon={Sparkles} focused={focused} /> }} />
      <Tabs.Screen name="assessment" options={{ href: null }} />
      <Tabs.Screen name="breathe" options={{ href: null }} />
      <Tabs.Screen name="tips" options={{ href: null }} />
</Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.neutral[200],
    borderTopWidth: 1,
    height: 74,
    paddingTop: 7,
    paddingBottom: 9,
    shadowColor: '#0C0C10',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 10,
  },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 10.5, marginTop: 2 },
});
