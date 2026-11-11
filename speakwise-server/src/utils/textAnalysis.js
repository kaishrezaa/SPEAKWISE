/**
 * Text analysis utilities for deterministic speech evaluation
 * These run without any external API dependencies
 */

// Language-specific filler word dictionaries
const FILLER_WORD_CONFIGS = {
  'en-IN': {
    definiteFillers: ['um', 'uh', 'er', 'hmm', 'hm'],
    contextualFillers: {
      // These are fillers only in certain contexts
      'like': { penalty: 0.7, exemptAfter: ['would', 'sounds', 'feel', 'seems', 'looks'] },
      'basically': { penalty: 0.8 },
      'actually': { penalty: 0.5, exemptIfStartsClause: true },
      'you know': { penalty: 0.9 },
      'i mean': { penalty: 0.9 },
      'kind of': { penalty: 0.7 },
      'sort of': { penalty: 0.7 },
      'right': { penalty: 0.6 },
      'okay so': { penalty: 0.8 },
      'so basically': { penalty: 0.9 },
    },
  },
};

/**
 * Detect filler words in transcript text
 * @param {string} transcript
 * @param {string} languageCode
 * @returns {{ total: number, breakdown: Object, positions: Array }}
 */
export function detectFillerWords(transcript, languageCode = 'en-IN') {
  const config = FILLER_WORD_CONFIGS[languageCode] || FILLER_WORD_CONFIGS['en-IN'];
  const text = transcript.toLowerCase();

  const breakdown = {};
  let total = 0;
  const positions = [];

  // Detect definite fillers
  for (const filler of config.definiteFillers) {
    let count = 0;
    let searchText = text;
    let offset = 0;

    while (true) {
      const idx = searchText.indexOf(filler);
      if (idx === -1) break;

      // Make sure it's a whole word
      const before = idx === 0 ? ' ' : searchText[idx - 1];
      const after = idx + filler.length >= searchText.length ? ' ' : searchText[idx + filler.length];

      if (/\s|^/.test(before) && /\s|$|[,.]/.test(after)) {
        count++;
        positions.push({ word: filler, position: offset + idx, type: 'definite' });
      }

      offset += idx + 1;
      searchText = searchText.slice(idx + 1);
    }

    if (count > 0) {
      breakdown[filler] = count;
      total += count;
    }
  }

  // Detect contextual fillers with exemption rules applied
  for (const [filler, fillerConfig] of Object.entries(config.contextualFillers)) {
    const regex = new RegExp(`\\b${filler.replace(/\\s+/g, '\\s+')}\\b`, 'gi');
    const matches = [...transcript.matchAll(regex)];

    let fillerCount = 0;
    for (const m of matches) {
      const before = transcript.slice(0, m.index).trimEnd().toLowerCase();

      // Check exemptAfter: skip if immediately preceded by an exempt word/phrase (e.g. "would like")
      if (fillerConfig.exemptAfter) {
        const isExempt = fillerConfig.exemptAfter.some(exempt => before.endsWith(exempt));
        if (isExempt) continue;
      }

      // Check exemptIfStartsClause: skip if at sentence/clause start
      if (fillerConfig.exemptIfStartsClause) {
        const trimBefore = before.trimEnd();
        if (trimBefore.length === 0 || /[.!?,]$/.test(trimBefore)) continue;
      }

      fillerCount++;
      positions.push({ word: filler, position: m.index, type: 'contextual' });
    }

    if (fillerCount > 0) {
      breakdown[filler] = fillerCount;
      total += fillerCount;
    }
  }

  return { total, breakdown, positions };
}

/**
 * Calculate word-level statistics from transcript
 */
export function calculateWordStats(transcript) {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { wordCount: 0, sentenceCount: 0, uniqueWords: 0, vocabularyRichness: 0, averageWordsPerSentence: 0 };
  }

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Count sentences (approximate)
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Unique words (case-insensitive, ignore punctuation)
  const cleanWords = words.map(w => w.toLowerCase().replace(/[^a-z']/g, '')).filter(w => w.length > 1);
  const uniqueWordSet = new Set(cleanWords);
  const uniqueWords = uniqueWordSet.size;

  // Vocabulary richness: type-token ratio (unique / total)
  const vocabularyRichness = wordCount > 0 ? uniqueWords / cleanWords.length : 0;

  const averageWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  return { wordCount, sentenceCount, uniqueWords, vocabularyRichness, averageWordsPerSentence };
}

/**
 * Estimate speaking rate from word count and duration
 */
export function estimateSpeakingRate(wordCount, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0 || !wordCount) {
    return { wpm: 0, assessment: 'unknown' };
  }

  const wpm = Math.round((wordCount / durationSeconds) * 60);

  let assessment;
  if (wpm < 90) assessment = 'slow';
  else if (wpm < 120) assessment = 'measured';
  else if (wpm < 160) assessment = 'natural';
  else if (wpm < 200) assessment = 'fast';
  else assessment = 'very fast';

  return { wpm, assessment };
}
