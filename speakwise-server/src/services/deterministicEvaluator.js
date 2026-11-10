import { detectFillerWords, calculateWordStats } from '../utils/textAnalysis.js';

/**
 * Deterministic fallback evaluator - no LLM required
 * Provides rule-based scoring and improvement suggestions
 */
export function deterministicEvaluate(transcript, question, metrics, category) {
  const { wordStats, fillerCount, fillerBreakdown, speakingRate } = metrics;

  // Calculate scores based on measurable properties
  const grammarScore = scoreGrammar(transcript, wordStats);
  const vocabularyScore = scoreVocabulary(transcript, wordStats, fillerCount);
  const fluencyScore = scoreFluency(transcript, fillerCount, speakingRate, wordStats);
  const clarityScore = scoreClarity(transcript, wordStats);
  const articulationScore = scoreArticulation(transcript, wordStats, fillerCount);

  const overallScore = Math.round(
    grammarScore * 0.2 +
    vocabularyScore * 0.2 +
    fluencyScore * 0.2 +
    clarityScore * 0.2 +
    articulationScore * 0.2
  );

  const strengths = identifyStrengths(transcript, wordStats, fillerCount, speakingRate);
  const improvements = identifyImprovements(transcript, wordStats, fillerCount, speakingRate);
  const sentenceImprovements = generateSentenceImprovements(transcript);
  const improvedResponse = generateImprovedResponse(transcript);
  const summary = generateSummary(overallScore, wordStats, fillerCount);

  return {
    overallScore,
    scores: {
      grammar: grammarScore,
      vocabulary: vocabularyScore,
      fluency: fluencyScore,
      clarity: clarityScore,
      articulation: articulationScore,
    },
    strengths,
    improvements,
    sentenceImprovements,
    improvedResponse,
    summary,
    fillerWords: { total: fillerCount, breakdown: fillerBreakdown },
  };
}

function scoreGrammar(transcript, stats) {
  let score = 70;
  // Sentence fragments (very short "sentences" < 4 words)
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const fragments = sentences.filter(s => s.trim().split(/\s+/).length < 4);
  score -= Math.min(20, fragments.length * 5);
  // Repeated words at sentence start
  const repeatedStarts = sentences.filter((s, i) => i > 0 && sentences[i - 1].trim().split(' ')[0]?.toLowerCase() === s.trim().split(' ')[0]?.toLowerCase());
  score -= Math.min(10, repeatedStarts.length * 3);
  return clamp(score, 30, 90);
}

function scoreVocabulary(transcript, stats, fillerCount) {
  let score = 70;
  // Reward vocabulary richness
  score += Math.round((stats.vocabularyRichness - 0.5) * 30);
  // Penalise excessive fillers relative to word count
  const fillerRatio = stats.wordCount > 0 ? fillerCount / stats.wordCount : 0;
  score -= Math.round(fillerRatio * 40);
  // Penalise very short responses
  if (stats.wordCount < 20) score -= 15;
  return clamp(score, 30, 90);
}

function scoreFluency(transcript, fillerCount, speakingRate, stats) {
  let score = 75;
  const fillerRatio = stats.wordCount > 0 ? fillerCount / stats.wordCount : 0;
  score -= Math.round(fillerRatio * 50);
  // Check for repetitive patterns
  const words = transcript.toLowerCase().split(/\s+/);
  const bigrams = words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`);
  const bigramCounts = {};
  bigrams.forEach(b => { bigramCounts[b] = (bigramCounts[b] || 0) + 1; });
  const repeatedBigrams = Object.values(bigramCounts).filter(c => c > 2).length;
  score -= Math.min(15, repeatedBigrams * 5);
  return clamp(score, 30, 90);
}

function scoreClarity(transcript, stats) {
  let score = 65;
  if (stats.wordCount >= 30 && stats.wordCount <= 150) score += 10;
  if (stats.sentenceCount >= 2) score += 5;
  if (stats.averageWordsPerSentence > 5 && stats.averageWordsPerSentence < 25) score += 10;
  return clamp(score, 30, 90);
}

function scoreArticulation(transcript, stats, fillerCount) {
  let score = 65;
  score += Math.round((stats.vocabularyRichness - 0.4) * 20);
  const fillerRatio = stats.wordCount > 0 ? fillerCount / stats.wordCount : 0;
  score -= Math.round(fillerRatio * 30);
  if (stats.averageWordsPerSentence > 8 && stats.averageWordsPerSentence < 20) score += 10;
  return clamp(score, 30, 90);
}

function identifyStrengths(transcript, stats, fillerCount, speakingRate) {
  const strengths = [];
  const fillerRatio = stats.wordCount > 0 ? fillerCount / stats.wordCount : 0;
  if (fillerRatio < 0.05) strengths.push('Low use of filler words — your response flows naturally.');
  if (stats.vocabularyRichness > 0.7) strengths.push('Good vocabulary variety — you avoided repeating the same words.');
  if (stats.wordCount >= 40 && stats.wordCount <= 120) strengths.push('Good response length — concise but substantive.');
  if (stats.sentenceCount >= 3) strengths.push('You expressed your thoughts in multiple complete sentences.');
  if (strengths.length === 0) strengths.push('You attempted the question and completed your response.');
  return strengths.slice(0, 3);
}

function identifyImprovements(transcript, stats, fillerCount, speakingRate) {
  const improvements = [];
  const fillerRatio = stats.wordCount > 0 ? fillerCount / stats.wordCount : 0;

  if (fillerRatio > 0.08) {
    improvements.push({
      issue: 'Excessive filler words',
      detail: `${fillerCount} filler words detected (${Math.round(fillerRatio * 100)}% of your response). Try pausing silently instead of using "um", "like", or "basically".`
    });
  }
  if (stats.wordCount < 25) {
    improvements.push({
      issue: 'Response too brief',
      detail: 'Your response is very short. Try to elaborate on your main point with an example or supporting reason.'
    });
  }
  if (stats.vocabularyRichness < 0.5) {
    improvements.push({
      issue: 'Repetitive vocabulary',
      detail: 'You repeated many of the same words. Try using synonyms or paraphrasing to express your ideas more precisely.'
    });
  }
  if (stats.averageWordsPerSentence > 25) {
    improvements.push({
      issue: 'Sentences are too long',
      detail: 'Your sentences run on too long. Break complex thoughts into shorter, clearer sentences.'
    });
  }
  if (improvements.length === 0) {
    improvements.push({
      issue: 'Practice pacing',
      detail: 'Continue practising to develop even more natural fluency and sentence variety.'
    });
  }
  return improvements.slice(0, 3);
}

function generateSentenceImprovements(transcript) {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const improvements = [];

  for (const sentence of sentences.slice(0, 3)) {
    const trimmed = sentence.trim();
    const improved = improveSentence(trimmed);
    if (improved && improved !== trimmed) {
      improvements.push({
        original: trimmed,
        improved,
        explanation: 'More precise and direct phrasing that communicates the same idea more effectively.',
      });
    }
  }

  return improvements.slice(0, 2);
}

function improveSentence(sentence) {
  // Apply simple heuristic improvements
  let improved = sentence;
  improved = improved.replace(/\b(I think that|I believe that|I feel like|I guess)\b/gi, 'I believe');
  improved = improved.replace(/\bvery very\b/gi, 'very');
  improved = improved.replace(/\b(a lot of|lots of)\b/gi, 'many');
  improved = improved.replace(/\bkind of|sort of\b/gi, '');
  improved = improved.replace(/\b(um|uh|like|basically|you know|actually)\b/gi, '').replace(/\s+/g, ' ').trim();
  improved = improved.replace(/\b(do something about|deal with the issue of)\b/gi, 'address');
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  return improved !== sentence ? improved : null;
}

function generateImprovedResponse(transcript) {
  // Simple heuristic improvement of full response
  let improved = transcript;
  improved = improved.replace(/\b(um|uh)\b,?\s*/gi, '');
  improved = improved.replace(/\blike,\s*/gi, '');
  improved = improved.replace(/\bbasically,?\s*/gi, '');
  improved = improved.replace(/\byou know,?\s*/gi, '');
  improved = improved.replace(/\bI mean,?\s*/gi, '');
  improved = improved.replace(/\bso like\b/gi, 'so');
  improved = improved.replace(/\bkind of\b/gi, 'somewhat');
  improved = improved.replace(/\bsort of\b/gi, 'somewhat');
  improved = improved.replace(/\ba lot of\b/gi, 'many');
  improved = improved.replace(/\bvery very\b/gi, 'very');
  improved = improved.replace(/\s+/g, ' ').trim();
  return improved || transcript;
}

function generateSummary(score, stats, fillerCount) {
  if (score >= 75) {
    return `Good communication overall. You expressed your ideas with reasonable clarity and structure. With a bit more precision in your word choices, your responses will be even more impactful.`;
  } else if (score >= 55) {
    return `Your response conveyed the basic idea but has room for improvement. Focus on reducing filler words and structuring your sentences more clearly. With regular practice, you will see meaningful progress.`;
  } else {
    return `Your response shows potential, but needs development in clarity and expression. Focus on organising your thoughts before speaking, and practise reducing filler words. Keep practising — improvement comes with consistent effort.`;
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Math.round(val)));
}
