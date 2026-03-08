# SpeakUp – English Pronunciation App for Spanish Speakers

## Project Overview
A mobile-first PWA that helps Spanish speakers practice English pronunciation.
The AI tutor speaks and gives feedback in Spanish, while the practice content is in English.

## Tech Stack
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **STT + Pronunciation**: Azure AI Speech (`microsoft-cognitiveservices-speech-sdk`)
- **LLM Feedback**: Google Gemini 2.0 Flash (`@google/generative-ai`)
- **TTS**: Google Cloud Text-to-Speech (REST API)
- **PWA**: manifest.json + apple-web-app meta tags

## API Keys Needed (in .env.local)
| Variable | Where to get it |
|---|---|
| `AZURE_SPEECH_KEY` | portal.azure.com → Azure AI Speech resource |
| `AZURE_SPEECH_REGION` | Same resource (e.g. `eastus`) |
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey |
| `GOOGLE_TTS_API_KEY` | console.cloud.google.com → Cloud Text-to-Speech API |

## Key Files
```
app/
  page.tsx                  # Main app UI (all screens in one file)
  layout.tsx                # PWA metadata, viewport config
  api/
    pronunciation/route.ts  # Azure pronunciation assessment
    feedback/route.ts       # Gemini AI feedback in Spanish
    tts/route.ts            # Google Cloud TTS (en + es voices)
components/
  DifficultySelector.tsx    # Easy/Medium/Hard buttons
  WordScoreDisplay.tsx      # Color-coded word scores
  ScoreRing.tsx             # Circular score indicator
lib/
  sentences.ts              # 30 practice sentences (10 per difficulty)
public/
  manifest.json             # PWA manifest
.env.local                  # API keys (never commit this)
```

## App Flow
```
Home (select difficulty)
  → Practice (AI speaks sentence automatically)
    → Recording (user taps mic)
      → Processing (Azure scores + Gemini feedback)
        → Results (score ring + colored words + Spanish feedback)
          → Try Again OR Next Sentence (+ option to change difficulty)
```

## Sentence Difficulties
- **Easy (🟢)**: Short sentences, common words, basic sounds
- **Medium (🟡)**: Tricky sounds for Spanish speakers: th, v/b, w, silent letters
- **Hard (🔴)**: Long sentences, multiple challenging sounds, rhythm & stress

## Scoring System
- Azure returns scores per **word** and **phoneme** (0–100)
- 🟢 Green = ≥80%, 🟡 Yellow = 50–79%, 🔴 Red = <50%
- UI shows: overall score ring + fluency % + completeness % + word-by-word colors

## Estimated Cost Per User Per Hour
| Service | Cost |
|---|---|
| Azure STT + Pronunciation | ~$0.51 |
| Google TTS | ~$0.23 |
| Gemini 2.0 Flash | ~$0.02 |
| **Total** | **~$0.76/hr** |

## Running Locally
```bash
npm run dev
# Open http://localhost:3000
```

## Status
- [x] Project scaffolded
- [x] All API routes created
- [x] Full UI implemented (home, practice, recording, results)
- [x] 30 practice sentences written
- [x] PWA manifest
- [ ] API keys configured (user needs to add to .env.local)
- [ ] Tested end-to-end with real API keys
- [ ] PWA icons added (icon-192.png, icon-512.png)
