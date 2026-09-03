# Mindspace frontend redesign

These files replace the current prototype presentation with the pastel-bento visual system requested:
- warm linen canvas
- lavender / mint / peach / sky bento surfaces
- soft diffuse shadows and 28px radii
- no terminal/status box
- no standard mood emojis
- floating glass navigation dock
- haptic mood selection
- softer wellness language

## Apply
From the Mindspace project root, copy this folder's contents over the existing files.

Then run:

```bash
npx tsc --noEmit
npx expo-doctor
npx expo start -c
```

For Android native testing:

```bash
npx expo run:android
```

The redesign intentionally keeps the existing Supabase tables and chat engine interfaces used by the project.
