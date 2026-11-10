import { detectFillerWords, calculateWordStats, estimateSpeakingRate } from '../src/utils/textAnalysis.js';
import assert from 'node:assert';

console.log('--- Running Tests for SpeakWise Text Analysis Utilities ---');

// Test 1: Filler word detection
{
  const text = "Um, I think like basically this is, you know, a very important topic.";
  const result = detectFillerWords(text);
  assert(result.total >= 3, `Expected at least 3 filler words, got ${result.total}`);
  assert(result.breakdown['um'] >= 1, 'Expected "um" to be detected');
  assert(result.breakdown['basically'] >= 1, 'Expected "basically" to be detected');
  console.log('✔ Test 1 Passed: Filler word detection works accurately');
}

// Test 2: Word stats calculation
{
  const text = "Technology is changing how we communicate. We should adapt quickly.";
  const stats = calculateWordStats(text);
  assert.strictEqual(stats.wordCount, 10, `Expected 10 words, got ${stats.wordCount}`);
  assert.strictEqual(stats.sentenceCount, 2, `Expected 2 sentences, got ${stats.sentenceCount}`);
  assert(stats.vocabularyRichness > 0.5, 'Expected high vocabulary richness');
  console.log('✔ Test 2 Passed: Word stats calculation works properly');
}

// Test 3: Speaking rate estimation
{
  // 120 words spoken in 60 seconds = 120 WPM (measured)
  const rate = estimateSpeakingRate(120, 60);
  assert.strictEqual(rate.wpm, 120, `Expected 120 WPM, got ${rate.wpm}`);
  assert.strictEqual(rate.assessment, 'natural', `Expected "natural", got ${rate.assessment}`);
  console.log('✔ Test 3 Passed: Speaking rate calculation and assessment accurate');
}

console.log('All utility tests passed successfully!\n');
