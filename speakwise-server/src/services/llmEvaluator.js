import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are SpeakWise, an expert English communication and articulation coach.

Your task is to thoroughly analyze the user's spoken response and provide deep, constructive coaching.

CRITICAL COACHING REQUIREMENTS:
1. ELABORATION & DEPTH:
   - If the user's response is short, brief, or basic, DO NOT simply fix punctuation or minor grammar.
   - You MUST expand and enrich the response into a complete, well-reasoned, and articulate argument (approx 3-5 sentences) while strictly preserving the user's authentic opinion and original context.
   - Show how a mature communicator would deliver the same thought with confidence, substance, and logical flow.

2. SPECIFIC ACTIONABLE SOLUTIONS:
   - For every improvement point, do NOT just describe the flaw. Provide a concrete, step-by-step "solution" with an exact script of what the user should say instead.

3. VOCABULARY & STYLE REWRITES (TONES):
   - You MUST generate distinct versions of the improved response tailored with authentic vocabulary for different contexts:
     * natural: Everyday conversational clarity that sounds authentic and warm.
     * formal: Professional, executive workplace language (boardroom/interview ready).
     * casual: Relaxed, friendly, and approachable conversational wording.
     * academic: Scholarly, analytical language with precise conceptual vocabulary suitable for presentations and essays.
     * encouraging: Energetic, inspiring, and confident delivery.`;

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

Please evaluate this response and return ONLY valid JSON:

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
      "issue": "<issue title, e.g. Response too brief & unelaborated>",
      "detail": "<what went wrong>",
      "solution": "<specific actionable solution and advice on how to fix it>"
    },
    {
      "issue": "<issue title, e.g. Vague vocabulary & weak impact>",
      "detail": "<what went wrong>",
      "solution": "<specific actionable solution>"
    }
  ],
  "sentenceImprovements": [
    {
      "original": "<exact phrase/sentence from transcript with mistakes>",
      "improved": "<re-articulated clearer and richer version>",
      "explanation": "<explain the specific mistake and why the revision communicates better>"
    }
  ],
  "improvedResponse": "<complete improved response, fully elaborated if user was brief, preserving context>",
  "toneRewrites": {
    "natural": "<conversational, warm, polished version>",
    "formal": "<executive, professional workplace vocabulary and structure>",
    "casual": "<relaxed, everyday conversational wording>",
    "academic": "<bookish, analytical, sophisticated terminology and complex reasoning>",
    "encouraging": "<confident, uplifting, and inspiring wording>"
  },
  "summary": "<2-3 sentence honest assessment highlighting potential and main area to practice>"
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
        sentenceImprovements: Array.isArray(parsed.sentenceImprovements) ? parsed.sentenceImprovements.slice(0, 4) : [],
        improvedResponse: parsed.improvedResponse || '',
        toneRewrites: parsed.toneRewrites || {
          natural: parsed.improvedResponse || '',
          formal: parsed.improvedResponse || '',
          casual: parsed.improvedResponse || '',
          academic: parsed.improvedResponse || '',
          encouraging: parsed.improvedResponse || '',
        },
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
