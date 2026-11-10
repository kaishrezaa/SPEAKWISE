import express from 'express';
import { generateSpeech } from '../services/gnaniTts.js';

const router = express.Router();

/**
 * POST /api/tts/synthesize
 * Converts improved text to speech using Gnani Timbre
 */
router.post('/synthesize', async (req, res, next) => {
  try {
    const { text, voice, language, emotion } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required', code: 'NO_TEXT' });
    }

    if (text.length > 2000) {
      return res.status(400).json({ error: 'Text too long (max 2000 characters)', code: 'TEXT_TOO_LONG' });
    }

    console.log(`[TTS] Synthesizing ${text.length} chars, voice: ${voice || 'default'}, emotion: ${emotion || 'natural'}`);

    const audioBuffer = await generateSpeech(text.trim(), voice, language, emotion);

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('[TTS] Synthesis error:', error.message);
    next(error);
  }
});

/**
 * GET /api/tts/voices
 * Returns available voice options
 */
router.get('/voices', (req, res) => {
  res.json({
    model: process.env.GNANI_TTS_MODEL || 'timbre-v3.0',
    voices: [
      { id: 'Shivani', name: 'Shivani', gender: 'Female', description: 'Warm & empathetic' },
      { id: 'Lakshmi', name: 'Lakshmi', gender: 'Female', description: 'Clear & professional' },
      { id: 'Kalpana', name: 'Kalpana', gender: 'Female', description: 'Natural & friendly' },
      { id: 'Riyaa', name: 'Riyaa', gender: 'Female', description: 'Bright & energetic' },
      { id: 'Avinash', name: 'Avinash', gender: 'Male', description: 'Deep & confident' },
      { id: 'Shubham', name: 'Shubham', gender: 'Male', description: 'Clear & articulate' },
      { id: 'Prakash', name: 'Prakash', gender: 'Male', description: 'Calm & measured' },
      { id: 'Devansh', name: 'Devansh', gender: 'Male', description: 'Youthful & expressive' },
    ],
    defaultVoice: process.env.GNANI_TTS_DEFAULT_VOICE || 'Shivani',
  });
});

export default router;
