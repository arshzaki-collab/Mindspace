# Voice Therapy — ElevenLabs

Mindspace now includes a dedicated real-time voice companion powered by the ElevenLabs Agents React Native SDK.

Agent ID configured: `HKFOb9iktHA85uKXydRT`

## Important

ElevenLabs' React Native voice SDK uses LiveKit/WebRTC native dependencies and **does not run inside Expo Go**. Use an Expo development build or a production APK/IPA instead.

## Install native dependencies

From the project root:

```bash
npm install
npx expo install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc @config-plugins/react-native-webrtc @livekit/react-native-expo-plugin livekit-client
```

## Environment

Add to `.env`:

```env
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=HKFOb9iktHA85uKXydRT
```

The agent ID is not an ElevenLabs API secret. Do **not** put an ElevenLabs API key in the mobile app.

## Development build

After installing dependencies:

```bash
npx expo prebuild --clean
npx expo run:android
```

or use an EAS development build.

## Voice flow

Home / Tools → Voice therapy → Start voice session → microphone permission → live ElevenLabs conversation.

The voice UI reports connection state, listening/speaking mode, mute state, end-call control, and the latest received message.
