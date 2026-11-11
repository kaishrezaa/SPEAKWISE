import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import speechRoutes from './routes/speech.js';
import evaluationRoutes from './routes/evaluation.js';
import ttsRoutes from './routes/tts.js';
import questionsRoutes from './routes/questions.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SpeakWise API',
    version: '1.0.0',
    gnaniConfigured: !!process.env.GNANI_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    mediumModel: process.env.GEMINI_MEDIUM_MODEL || 'gemini-2.5-flash',
    lightModel: process.env.GEMINI_LIGHT_MODEL || 'gemini-2.5-flash-lite',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/speech', speechRoutes);
app.use('/api/evaluate', evaluationRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/questions', questionsRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🎙️  SpeakWise Server running on http://localhost:${PORT}`);
  console.log(`   Gnani API:   ${process.env.GNANI_API_KEY ? '✅ Configured' : '⚠️  Not configured (set GNANI_API_KEY)'}`);
  console.log(`   Gemini Eval: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Using deterministic fallback (set GEMINI_API_KEY)'}`);
  console.log(`   Medium Model: ${process.env.GEMINI_MEDIUM_MODEL || 'gemini-2.5-flash'}`);
  console.log(`   Light Model:  ${process.env.GEMINI_LIGHT_MODEL || 'gemini-2.5-flash-lite'}`);
  console.log(`   CORS:        ${FRONTEND_URL}\n`);
});

export default app;
