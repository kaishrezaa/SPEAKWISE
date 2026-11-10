import express from 'express';
import { evaluateTranscript } from '../services/evaluationEngine.js';

const router = express.Router();

/**
 * POST /api/evaluate/transcript
 * Evaluates a transcript and returns structured communication feedback
 */
router.post('/transcript', async (req, res, next) => {
  try {
    const { transcript, question, duration, category, tier } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required', code: 'NO_TRANSCRIPT' });
    }

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question context is required', code: 'NO_QUESTION' });
    }

    const durationSeconds = parseFloat(duration) || 0;

    console.log(`[EVAL] Evaluating ${transcript.length} chars, duration: ${durationSeconds}s, tier: ${tier || 'medium'}`);

    const feedback = await evaluateTranscript(transcript.trim(), question.trim(), durationSeconds, category, tier);

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('[EVAL] Evaluation error:', error.message);
    next(error);
  }
});

export default router;
