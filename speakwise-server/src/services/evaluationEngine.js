import { detectFillerWords, estimateSpeakingRate, calculateWordStats } from '../utils/textAnalysis.js';
import { getLlmFeedback } from './llmEvaluator.js';
import { deterministicEvaluate } from './deterministicEvaluator.js';

/**
 * Main evaluation pipeline: combines deterministic analysis with LLM feedback
 */
export async function evaluateTranscript(transcript, question, durationSeconds, category, tier = 'medium') {
  // Step 1: Deterministic analysis (always runs, never fails)
  const deterministicMetrics = computeDeterministicMetrics(transcript, durationSeconds);

  // Step 2: Gemini LLM-based qualitative evaluation
  let llmFeedback = null;
  let usedFallback = false;

  if (process.env.GEMINI_API_KEY) {
    try {
      llmFeedback = await getLlmFeedback(transcript, question, deterministicMetrics, category, tier);
    } catch (error) {
      console.warn('[EVAL] Gemini evaluation failed, using fallback:', error.message);
      usedFallback = true;
    }
  } else {
    usedFallback = true;
  }

  if (!llmFeedback) {
    llmFeedback = deterministicEvaluate(transcript, question, deterministicMetrics, category);
    usedFallback = true;
  }

  // Step 3: Merge deterministic metrics into final feedback
  const feedback = {
    ...llmFeedback,
    fillerWords: {
      ...llmFeedback.fillerWords,
      // Override with deterministic counts
      total: deterministicMetrics.fillerCount,
      breakdown: deterministicMetrics.fillerBreakdown,
    },
    wordStats: deterministicMetrics.wordStats,
    speakingRate: deterministicMetrics.speakingRate,
    evaluationMethod: usedFallback ? 'deterministic' : 'gemini',
    evaluationNote: usedFallback
      ? 'Evaluation performed by deterministic analysis (Gemini API not configured).'
      : `Evaluation performed by Gemini AI (${llmFeedback?.modelUsed || 'Gemini'}).`,
  };

  return feedback;
}

function computeDeterministicMetrics(transcript, durationSeconds) {
  const fillerResult = detectFillerWords(transcript);
  const wordStats = calculateWordStats(transcript);
  const speakingRate = estimateSpeakingRate(wordStats.wordCount, durationSeconds);

  return {
    fillerCount: fillerResult.total,
    fillerBreakdown: fillerResult.breakdown,
    fillerPositions: fillerResult.positions,
    wordStats,
    speakingRate,
    durationSeconds,
  };
}
