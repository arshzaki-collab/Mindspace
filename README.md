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


