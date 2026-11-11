import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/gnaniStt.js';

const router = express.Router();

// Use memory storage - audio arrives as buffer, not disk file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/speech/transcribe
 * Receives audio file, sends to Gnani Prisma, returns transcript
 */
router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided', code: 'NO_AUDIO' });
    }

    const { duration } = req.body; // duration in seconds, sent from frontend
    const durationSeconds = parseFloat(duration) || 0;

    console.log(`[STT] Received audio: ${req.file.size} bytes, ${req.file.mimetype}, ${durationSeconds}s`);

    const result = await transcribeAudio(req.file.buffer, req.file.mimetype, durationSeconds);

    res.json({
      success: true,
      transcript: result.transcript,
      duration: durationSeconds,
      confidence: result.confidence,
      model: result.model,
      language: result.language,
    });
  } catch (error) {
    console.error('[STT] Transcription error:', error.message);
    next(error);
  }
});

export default router;
