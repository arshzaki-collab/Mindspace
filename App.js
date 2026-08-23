import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleLogin = () => {
    if (email === 'demo@example.com' && password === 'demo123') {
      setIsLoggedIn(true);
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  const handleSignup = () => {
    if (email && password && name) {
      setIsLoggedIn(true);
    } else {
      Alert.alert('Error', 'Fill all fields');
    }
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Health Engineer</Text>
          <Text style={styles.subText}>Welcome!</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Risk Score</Text>
            <Text style={styles.riskScore}>42%</Text>
            <Text style={styles.cardText}>Moderate Risk - See professional</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            <Text style={styles.cardText}>• Exercise daily</Text>
            <Text style={styles.cardText}>• Sleep 7-9 hours</Text>
            <Text style={styles.cardText}>• Talk to someone</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => setIsLoggedIn(false)}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Health Engineer</Text>
        <Text style={styles.subText}>Mental Wellness App</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{isSignup ? 'Create Account' : 'Login'}</Text>
        {isSignup && (
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={isSignup ? handleSignup : handleLogin}>
          <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={styles.toggle}>{isSignup ? 'Have account?' : 'No account?'}</Text>
        </TouchableOpacity>
        <View style={styles.demoBox}>
          <Text style={styles.demoText}>Demo: demo@example.com</Text>
          <Text style={styles.demoText}>Pass: demo123</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1976d2', padding: 20, paddingTop: 50 },
  headerText: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subText: { fontSize: 14, color: '#e0e0e0' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: 'white' },
  button: { backgroundColor: '#1976d2', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  toggle: { textAlign: 'center', color: '#1976d2', marginTop: 16, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#666', marginBottom: 4 },
  riskScore: { fontSize: 36, fontWeight: 'bold', color: '#ff9800', marginVertical: 8 },
  demoBox: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, marginTop: 20 },
  demoText: { color: '#1976d2', fontWeight: 'bold' }
});
