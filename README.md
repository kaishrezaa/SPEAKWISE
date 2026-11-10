# SpeakWise 🎙️
### AI-Powered English Communication & Articulation Coach

> *"Don't just learn English. Learn to express yourself."*

SpeakWise is an interactive articulation coach designed for individuals who understand written English but struggle to speak clearly, confidently, and naturally. Built with **Gnani AI** speech technologies (**Prisma STT** & **Timbre TTS**).

---

## 🚀 Key Features

1. **Articulation Coach & Speech Analysis**
   - **Grammar & Sentence Structure**: Identifies fragments and subject-verb mismatches.
   - **Vocabulary**: Evaluates lexical richness, avoids redundant phrasing.
   - **Fluency & Filler Word Counter**: Deterministic calculation of filler words (`um`, `uh`, `like`, `basically`, `you know`).
   - **Speaking Rate (WPM)**: Accurately estimates pacing using actual audio duration and word count.
   - **Clarity & Articulation**: Signature metric assessing how concisely and effectively thoughts are conveyed.

2. **Gnani AI Integration**
   - **Gnani Prisma STT (`prisma-v3.0`)**: High-accuracy Indian English speech transcription.
   - **Gnani Timbre TTS (`timbre-v3.0`)**: Expressive, natural-sounding voice synthesis reading back the improved response. Exposes multiple voices (Shivani, Lakshmi, Kalpana, Avinash, etc.).

3. **"Speak Again" Improvement Loop**
   - Record an initial attempt and receive instant diagnostic feedback.
   - Listen to how the improved response sounds via Gnani Timbre.
   - Attempt the same question again and receive a side-by-side comparison of score deltas, filler word reductions, and pace improvements.

4. **Progress Tracking & Analytics**
   - LocalStorage persistence tracking historical articulation scores, speaking time, and session counts.
   - Visual trend line charts using Recharts.

---

## 🛠️ Architecture & Tech Stack

```
speakwise/
├── speakwise-client/        # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/      # UI Components (RecordingStudio, ArticulationReport, etc.)
│   │   ├── pages/           # Dashboard, Practice, Progress, SessionReport
│   │   ├── hooks/           # useAudioRecorder (MediaRecorder API + AnalyserNode)
│   │   ├── services/        # Frontend API client
│   │   └── utils/           # LocalStorage, Question repository, helpers
│   └── package.json
├── speakwise-server/        # Node.js + Express
│   ├── src/
│   │   ├── routes/          # /api/speech, /api/evaluate, /api/tts
│   │   ├── services/        # gnaniStt, gnaniTts, evaluationEngine
│   │   ├── utils/           # textAnalysis (deterministic scoring & filler parsing)
│   │   └── server.js
│   ├── tests/               # Unit tests
│   ├── .env.example
│   └── package.json
└── package.json             # Root script runner (concurrently)
```

---

## ⚙️ Setup & Local Development

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v10+

### 2. Configure Backend Credentials
Create a `.env` file in `speakwise-server/`:
```bash
cd speakwise-server
cp .env.example .env
```

Open `speakwise-server/.env` and supply your credentials:
```env
# Mandatory for Speech features (Gnani AI)
GNANI_API_KEY=your_gnani_api_key_here

# Google Gemini AI Evaluation
GEMINI_API_KEY=your_gemini_api_key_here

# Models:
# Medium usage: gemini-2.5-flash (or gemini-3.8-flash when released in your region)
GEMINI_MEDIUM_MODEL=gemini-2.5-flash

# Light usage: gemini-2.5-flash-lite (or gemini-3.5-flash-lite when released in your region)
GEMINI_LIGHT_MODEL=gemini-2.5-flash-lite
```

### 3. Start Development Servers
From the root repository directory:
```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1 - Backend API (Port 3001)
npm run dev:server

# Terminal 2 - Frontend Client (Port 5173)
npm run dev:client
```

Visit **http://localhost:5173** to launch SpeakWise!

---

## 🧪 Running Tests
To verify the core text analysis and filler word detection engine:
```bash
node speakwise-server/tests/testAnalysis.js
```

---

## 🏆 2-Minute Demo Workflow
1. **0:00 - 0:15 (Intro)**: Present the minimalist dark dashboard with personal articulation metrics.
2. **0:15 - 0:30 (Challenge Selection)**: Pick an opinion challenge (e.g., *"Do you think social media has a positive or negative impact on young people?"*).
3. **0:30 - 0:50 (Live Speech Recording)**: Tap record, respond using natural conversational English (including natural fillers). Notice the dynamic live audio waveform.
4. **0:50 - 1:05 (Gnani Prisma Transcription)**: Audio streams to Gnani Prisma STT, immediately producing the transcript and triggering the communication diagnostics.
5. **1:05 - 1:30 (Articulation Report)**: Review the scores (Overall, Grammar, Vocab, Fluency, Clarity, Articulation) and sentence-by-sentence upgrades.
6. **1:30 - 1:45 (Gnani Timbre Synthesis)**: Click "Generate & Play" to hear Gnani Timbre synthesize the improved articulation with natural Indian English cadence.
7. **1:45 - 2:00 (Speak Again Comparison)**: Click "Speak Again", re-record, and highlight the instant attempt-over-attempt delta comparison!
