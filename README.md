# Mindspace Wellness

A polished Expo / React Native wellness companion with a calm purple, black, white, pastel, and restrained neon visual system.

## What's included

- Home dashboard with a three-card-per-row action grid
- Mood tracking
- Wellness assessment
- Guided breathing with animated pacing
- Journal with sentiment tagging
- On-device wellness companion chat with crisis-language detection
- Practical tips
- Professional Supabase-powered authentication screen
- Consistent Lucide iconography and Inter typography
- Responsive layouts, press/hover micro-interactions, radial orbs, dot-grid accents, sparkle details, subtle glass surfaces, and a small terminal-style status panel
- No skeleton loaders, fake testimonials, fake pricing claims, or fake product demos

## Run locally

```bash
npm install
npx expo install --fix
npm run start:tunnel
```

Keep your own `.env` beside `package.json` using the variables in `.env.example`.

## Android APK

```bash
npm install
npx expo install --fix
npx eas login
eas build --platform android --profile preview
```

The `preview` profile is configured to produce an APK. An EAS account is required for cloud builds.


## Voice therapy (ElevenLabs)

The app now includes a real-time voice therapy companion using ElevenLabs Agents + LiveKit WebRTC. The configured agent ID is `HKFOb9iktHA85uKXydRT`. ElevenLabs' current React Native SDK requires a native development build; it does not work inside Expo Go.

Install the native voice dependencies:

```bash
npx expo install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc @config-plugins/react-native-webrtc @livekit/react-native-expo-plugin livekit-client
```

Then rebuild the native app:

```bash
npx expo prebuild --clean
npx expo run:android
```

Or build a development APK with EAS:

```bash
npx eas login
eas build --platform android --profile development
```

Add `EXPO_PUBLIC_ELEVENLABS_AGENT_ID=HKFOb9iktHA85uKXydRT` to `.env` if you want to override the built-in agent ID. Do not put an ElevenLabs API key in the mobile app.
