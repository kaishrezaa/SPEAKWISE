import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

let aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const CATEGORY_PROMPTS = {
  everyday: 'everyday conversational topics (daily routines, food, hobbies, weather, travel, local culture)',
  opinion: 'opinion and debate topics (technology, society, culture, trends, ethical dilemmas, current events)',
  personal: 'personal growth and self-reflection (goals, life experiences, challenges overcome, values, identity)',
  professional: 'workplace and career topics (leadership, teamwork, professional skills, work-life balance, career goals)',
};

router.post('/generate', async (req, res) => {
  try {
    const { category = 'everyday', previousQuestions = [] } = req.body;
    const ai = getAiClient();
    const model = process.env.GEMINI_LIGHT_MODEL || 'gemini-3.5-flash-lite';

    const categoryDesc = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.everyday;
    const prevList = previousQuestions.slice(-20).map((q, i) => `${i + 1}. ${q}`).join('\n');

    const prompt = `Generate ONE unique speaking practice question about ${categoryDesc}.

Requirements:
- Must be suitable for a 15-30 second spoken answer
- Must be engaging, specific, and thought-provoking
- Written in natural, conversational English
- Must NOT be a yes/no question (needs elaboration)
- Must be DIFFERENT from these already used questions:
${prevList || '(none yet — generate a fresh one)'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "text": "<the full question text>",
  "hint": "<a short 1-sentence tip on how to best approach answering>",
  "difficulty": "beginner"
}

Use "beginner" for simple questions, "intermediate" for moderately complex ones, "advanced" for nuanced ones.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.95, responseMimeType: 'application/json' },
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed.text || typeof parsed.text !== 'string') throw new Error('Invalid AI response');

    res.json({
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: parsed.text,
      hint: parsed.hint || 'Take a moment to gather your thoughts before you start speaking.',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty)
        ? parsed.difficulty
        : 'intermediate',
      category,
      isAiGenerated: true,
    });
  } catch (err) {
    console.error('[QUESTIONS] Generation failed:', err.message);
    res.status(500).json({ error: 'Failed to generate question', details: err.message });
  }
});

export default router;
