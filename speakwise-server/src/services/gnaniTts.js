import axios from 'axios';

const GNANI_TTS_BASE_URL = process.env.GNANI_TTS_BASE_URL || 'https://api.vachana.ai';
const GNANI_TTS_MODEL = process.env.GNANI_TTS_MODEL || 'timbre-v3.0';
const GNANI_TTS_LANGUAGE = process.env.GNANI_TTS_LANGUAGE || 'en-IN';
const GNANI_TTS_DEFAULT_VOICE = process.env.GNANI_TTS_DEFAULT_VOICE || 'Shivani';

/**
 * Generates speech audio from text using Gnani Timbre TTS API
 * @param {string} text - Text to synthesize
 * @param {string} voice - Voice name (e.g., 'Shivani', 'Avinash')
 * @param {string} language - Language code (defaults to en-IN)
 * @param {string} emotion - Emotion/style: 'natural' | 'formal' | 'casual' | 'academic' | 'encouraging'
 * @returns {Promise<Buffer>} - WAV audio buffer
 */
export async function generateSpeech(text, voice, language, emotion = 'natural') {
  if (!process.env.GNANI_API_KEY) {
    throw createApiError('GNANI_API_KEY is not configured. Please add it to your .env file.', 'GNANI_NOT_CONFIGURED', 503);
  }

  const selectedVoice = voice || GNANI_TTS_DEFAULT_VOICE;
  const selectedLanguage = language || GNANI_TTS_LANGUAGE;

  // Apply Timbre v3.0 inline performance tags according to emotion/tone style
  const styledText = applyEmotionTags(text, emotion);

  const requestBody = {
    text: styledText,
    model: GNANI_TTS_MODEL,
    voice: selectedVoice,
    language: selectedLanguage,
    speed: emotion === 'formal' || emotion === 'academic' ? 0.95 : 1.0,
    audio_config: {
      sample_rate: 22050,
      encoding: 'linear_pcm',
      container: 'wav',
    },
  };

  console.log(`[TTS] Calling Gnani Timbre: voice=${selectedVoice}, emotion=${emotion}, lang=${selectedLanguage}`);

  try {
    const response = await axios.post(
      `${GNANI_TTS_BASE_URL}/api/v1/tts/inference`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': process.env.GNANI_API_KEY,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    const audioBuffer = Buffer.from(response.data);
    console.log(`[TTS] Generated ${audioBuffer.length} bytes of audio`);

    return audioBuffer;
  } catch (error) {
    if (error.isApiError) throw error;

    if (error.response) {
      const status = error.response.status;

      // Try to parse error body
      let errorBody = '';
      try {
        errorBody = Buffer.from(error.response.data).toString('utf-8');
        errorBody = JSON.parse(errorBody);
      } catch {}

      if (status === 401) {
        throw createApiError('Invalid Gnani API key. Please check your GNANI_API_KEY.', 'GNANI_AUTH_FAILED', 401);
      }
      if (status === 429) {
        throw createApiError('Gnani rate limit reached. Please wait and try again.', 'RATE_LIMITED', 429);
      }

      throw createApiError(
        `Gnani TTS API error (${status}): ${JSON.stringify(errorBody)}`,
        'GNANI_TTS_ERROR',
        status
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw createApiError('Gnani TTS request timed out.', 'TIMEOUT', 504);
    }

    throw createApiError(`Failed to generate speech: ${error.message}`, 'TTS_FAILED', 500);
  }
}

function applyEmotionTags(text, emotion) {
  const clean = text.replace(/<[^>]+>/g, '').trim();

  switch (emotion) {
    case 'formal':
      // Measured pacing with thoughtful pause
      return `<slow> ${clean} <pauses>`;
    case 'academic':
      // Clear, deliberate enunciation with pauses between key arguments
      return `<slow> ${clean}`;
    case 'casual':
      // Conversational flow
      return clean;
    case 'encouraging':
      // Warm, energized delivery
      return `<excited> ${clean}`;
    case 'natural':
    default:
      return clean;
  }
}

function createApiError(message, code, status) {
  const error = new Error(message);
  error.isApiError = true;
  error.code = code;
  error.status = status;
  return error;
}
