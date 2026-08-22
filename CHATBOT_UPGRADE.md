# Chatbot intelligence upgrade

The wellness companion now uses a context-aware on-device conversation engine instead of simple keyword-to-response matching.

## What improved
- Tracks the recent conversation thread and uses it when the user sends a follow-up.
- Detects multiple intents including anxiety, low mood, sleep, anger, loneliness, work/study pressure, relationships, motivation, and overthinking.
- Distinguishes whether the user is primarily venting, asking for advice, asking a question, or asking for a plan.
- Uses a reflect -> practical next step -> follow-up question structure so replies feel conversational rather than like canned tips.
- Avoids repeating the exact same action immediately.
- Pulls the latest mood check-in and journal sentiment from Supabase to add lightweight personalization.
- Preserves a stronger crisis-language safety check and avoids presenting the assistant as a diagnostic tool.
- Keeps the intelligence on-device; no third-party model key is exposed in the mobile app.

## Optional next stage
A server-side LLM (such as Gemini/OpenAI through a Supabase Edge Function) can be added later for open-ended reasoning while keeping API credentials off the device. The current engine remains the offline/private fallback.
