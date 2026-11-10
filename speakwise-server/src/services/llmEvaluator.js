import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are SpeakWise, an expert English communication coach. Your role is to evaluate spoken responses and help people communicate more clearly, naturally, and confidently.

Evaluate based on:
1. GRAMMAR: Grammatical correctness, sentence structure, subject-verb agreement, tense consistency
2. VOCABULARY: Word choice, repetition, vague expressions, appropriateness  
3. FLUENCY: Identified filler words, sentence restarts, repetition patterns
4. CLARITY: Central idea clarity, logical organisation, relevance, directness
5. ARTICULATION: Precision of expression, conciseness, effective idea communication

SCORING GUIDELINES:
- 90-100: Exceptional communication
- 75-89: Good with minor issues
- 60-74: Adequate but noticeable weaknesses
- 45-59: Below average, significant issues
- Below 45: Needs substantial work

IMPORTANT RULES:
- Do NOT penalise short responses that communicate clearly
- Do NOT reward complexity for its own sake
- Do NOT introduce facts, arguments or ideas the user didn't mention
- Do NOT be condescending - be encouraging and constructive
- Preserve the user's original meaning in the improved response
- The improved response should sound natural, not overly formal
- Only evaluate what can be determined from the transcript text`;

const USER_PROMPT_TEMPLATE = (transcript, question, metrics, category) => `
SPEAKING QUESTION (${category || 'General'}):
"${question}"

USER'S SPOKEN RESPONSE (transcript):
"${transcript}"

DETERMINISTIC METRICS:
- Word count: ${metrics.wordStats.wordCount}
- Sentence count: ${metrics.wordStats.sentenceCount}
- Unique words: ${metrics.wordStats.uniqueWords}
- Vocabulary richness: ${metrics.wordStats.vocabularyRichness.toFixed(2)}
- Filler words detected: ${metrics.fillerCount} (${JSON.stringify(metrics.fillerBreakdown)})
- Speaking rate: ${metrics.speakingRate.wpm > 0 ? `~${metrics.speakingRate.wpm} WPM` : 'Unknown (no duration data)'}
- Recording duration: ${metrics.durationSeconds > 0 ? `${metrics.durationSeconds.toFixed(1)} seconds` : 'Unknown'}

Please evaluate this response and return ONLY valid JSON (no markdown formatting, no code fences):

{
  "overallScore": <0-100>,
  "scores": {
    "grammar": <0-100>,
    "vocabulary": <0-100>,
    "fluency": <0-100>,
    "clarity": <0-100>,
    "articulation": <0-100>
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>"
  ],
  "improvements": [
    {
      "issue": "<issue title>",
      "detail": "<detailed explanation of the issue>"
    },
    {
      "issue": "<issue title>",
      "detail": "<detailed explanation>"
    }
  ],
  "sentenceImprovements": [
    {
      "original": "<exact phrase from user's response>",
      "improved": "<clearer version>",
      "explanation": "<why this version communicates better>"
    }
  ],
  "improvedResponse": "<complete improved version that preserves the user's meaning, sounds natural>",
  "summary": "<2-3 sentence overall assessment, encouraging but honest>"
}`;

let aiClient = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Evaluates transcript using Google Gemini models:
 * - Medium tier (default): gemini-2.5-flash / gemini-3.8-flash
 * - Light tier: gemini-2.5-flash-lite / gemini-3.5-flash-lite
 */
export async function getLlmFeedback(transcript, question, metrics, category, tier = 'medium') {
  const ai = getAiClient();

  // Prefer fast low-latency models first to keep analysis instant
  const primaryModel = (tier === 'light'
    ? process.env.GEMINI_LIGHT_MODEL
    : process.env.GEMINI_MEDIUM_MODEL) || 'gemini-3.5-flash-lite';

  const cleanPrimary = primaryModel.trim().toLowerCase().replace(/\s+/g, '-');
  
  // Prioritise fast models and eliminate redundant duplicate attempts
  const candidateModels = Array.from(new Set([
    cleanPrimary,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ]));

  let lastError = null;
  for (const model of candidateModels) {
    try {
      console.log(`[EVAL] Running Gemini evaluation using model: ${model}`);

      // Add 8-second timeout so a hanging model doesn't stall the UI
      const evalPromise = ai.models.generateContent({
        model,
        contents: USER_PROMPT_TEMPLATE(transcript, question, metrics, category),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${model} took longer than 8s`)), 8000)
      );

      const response = await Promise.race([evalPromise, timeoutPromise]);

      const content = response.text;
      if (!content) continue;

      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      if (typeof parsed.overallScore !== 'number' || !parsed.scores || !parsed.improvedResponse) {
        continue;
      }

      return {
        overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
        scores: {
          grammar: clampScore(parsed.scores.grammar),
          vocabulary: clampScore(parsed.scores.vocabulary),
          fluency: clampScore(parsed.scores.fluency),
          clarity: clampScore(parsed.scores.clarity),
          articulation: clampScore(parsed.scores.articulation),
        },
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
        sentenceImprovements: Array.isArray(parsed.sentenceImprovements) ? parsed.sentenceImprovements.slice(0, 3) : [],
        improvedResponse: parsed.improvedResponse || '',
        summary: parsed.summary || '',
        fillerWords: { total: 0, breakdown: {} },
        modelUsed: model,
      };
    } catch (err) {
      console.warn(`[EVAL] Gemini model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

function clampScore(val) {
  if (typeof val !== 'number') return 60;
  return Math.max(0, Math.min(100, Math.round(val)));
}
