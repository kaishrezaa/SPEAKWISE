import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are SpeakWise, a world-class English articulation and speech coach.

Your mission is to help people express their ideas logically, naturally, and compellingly.

CORE PRINCIPLES — MAKING COMPLETE SENSE:
1. PRESERVE THE USER'S CORE MEANING & CONTEXT:
   - Your suggestions must make logical, sensible, and coherent English arguments.
   - Do NOT produce word salad, bizarre idioms, or artificial jargon.
   - The improved version must directly answer the SPEAKING QUESTION and faithfully reflect what the user actually intended to say.

2. LOGICAL ELABORATION (NEVER NONSENSICAL):
   - When a user's answer is brief (e.g. "success is completing goals"), do NOT just prepend fancy words or make it robotic.
   - Expand it into a coherent 2-3 sentence statement using the REASON-OUTCOME structure:
     * State the core premise clearly.
     * Add the underlying reasoning (why it matters).
     * Connect to a meaningful conclusion.
   - Example:
     User: "Success is when one achieves his goals and has nothing to do."
     Improved: "I view success as the steady achievement of meaningful personal goals. However, true fulfillment doesn't end when a task is completed; it's about the growth and purpose you discover along the journey."

3. CONTEXTUAL REWORDING (NATURAL & MEANINGFUL):
   - natural: Warm, conversational, fluent, and relatable.
   - formal: Executive, polite, professional workplace language.
   - casual: Friendly, everyday chat tone without sounding sloppy.
   - academic: Thoughtful, well-structured, analytical phrasing.
   - encouraging: Inspiring, positive, and confident.
   * Every rewrite MUST form complete, grammatically sound, and logical sentences that a real person would say.`;

const USER_PROMPT_TEMPLATE = (transcript, question, metrics, category) => `
SPEAKING QUESTION:
"${question}"

USER'S ACTUAL SPOKEN WORDS (Transcript from Gnani Prisma):
"${transcript}"

METRICS:
- Word count: ${metrics.wordStats.wordCount}
- Filler words: ${metrics.fillerCount} (${JSON.stringify(metrics.fillerBreakdown)})
- Duration: ${metrics.durationSeconds}s

Produce high-value, logical coaching feedback. Return valid JSON only:

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
    "<genuinely positive observation on their attempt>",
    "<another strength>"
  ],
  "improvements": [
    {
      "issue": "<concise title of what needs work>",
      "detail": "<what made this sentence weak or incomplete>",
      "solution": "<exact practical advice and script for what to say instead>"
    }
  ],
  "sentenceImprovements": [
    {
      "original": "<exact phrase from user transcript with weakness/mistake>",
      "improved": "<rephrased version that sounds fluent and makes sense>",
      "explanation": "<why this revision communicates the user's intent more effectively>"
    }
  ],
  "improvedResponse": "<a coherent, logical 2-3 sentence response that says what the user meant with clarity>",
  "toneRewrites": {
    "natural": "<coherent, natural conversational rewrite>",
    "formal": "<coherent, professional workplace rewrite>",
    "casual": "<coherent, friendly everyday rewrite>",
    "academic": "<coherent, analytical structured rewrite>",
    "encouraging": "<coherent, inspiring confident rewrite>"
  },
  "summary": "<2 sentences: honest appraisal + encouraging takeaway>"
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
 * Prioritizes models configured in environment variables:
 * - GEMINI_MEDIUM_MODEL (default: gemini-3.5-flash or gemini-3.5-flash-lite)
 * - GEMINI_LIGHT_MODEL (default: gemini-3.5-flash-lite)
 */
export async function getLlmFeedback(transcript, question, metrics, category, tier = 'medium') {
  const ai = getAiClient();

  const configuredPrimary = tier === 'light'
    ? (process.env.GEMINI_LIGHT_MODEL || process.env.GEMINI_MEDIUM_MODEL)
    : (process.env.GEMINI_MEDIUM_MODEL || process.env.GEMINI_LIGHT_MODEL);

  // Build ordered, deduplicated candidate models list
  const candidateModels = Array.from(new Set([
    configuredPrimary,
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ].filter(Boolean)));

  let lastError = null;
  for (const model of candidateModels) {
    try {
      console.log(`[EVAL] Running Gemini evaluation using model: ${model}`);

      const evalPromise = ai.models.generateContent({
        model,
        contents: USER_PROMPT_TEMPLATE(transcript, question, metrics, category),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.2, // Low temperature ensures grounded, sensible reasoning
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${model} took longer than 12s`)), 12000)
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
      // If 503 or model overload, immediately advance to the next candidate model
      continue;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

function clampScore(val) {
  if (typeof val !== 'number') return 60;
  return Math.max(0, Math.min(100, Math.round(val)));
}
