import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { P } from '@/components/PremiumUI';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setDestination('/(tabs)');
          return;
        }
        const hasVisited = await AsyncStorage.getItem('@mindspace_visited');
        if (hasVisited) {
          setDestination('/(tabs)');
          return;
        }
        await AsyncStorage.setItem('@mindspace_visited', 'true');
        setDestination('/signup');
      } catch {
        setDestination('/(tabs)');
      }
    }
    checkAuth();
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={P.purple} size="large" />
      </View>
    );
  }

  return <Redirect href={destination as any} />;
}
