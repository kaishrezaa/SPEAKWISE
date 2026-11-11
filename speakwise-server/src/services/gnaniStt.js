import axios from 'axios';
import FormData from 'form-data';
import { convertAudioToWav } from '../utils/audioConverter.js';

const GNANI_STT_BASE_URL = process.env.GNANI_STT_BASE_URL || 'https://api.vachana.ai';
const GNANI_STT_MODEL = process.env.GNANI_STT_MODEL || 'prisma-v3.0';
const GNANI_STT_LANGUAGE = process.env.GNANI_STT_LANGUAGE || 'en-IN';

/**
 * Transcribes audio buffer using Gnani Prisma STT API
 * Automatically converts browser audio (e.g. webm) to standard 16kHz mono WAV
 * @param {Buffer} audioBuffer - Raw audio bytes
 * @param {string} mimeType - Audio MIME type
 * @param {number} durationSeconds - Recording duration
 * @returns {Promise<{transcript: string, confidence: number, model: string, language: string}>}
 */
export async function transcribeAudio(audioBuffer, mimeType, durationSeconds) {
  if (!process.env.GNANI_API_KEY) {
    throw createApiError('GNANI_API_KEY is not configured. Please add it to your .env file.', 'GNANI_NOT_CONFIGURED', 503);
  }

  // Convert browser recording (webm / ogg / etc) to 16kHz WAV format accepted by Gnani
  let processedBuffer = audioBuffer;
  let finalMimeType = mimeType;
  let filename = 'recording.wav';

  try {
    console.log(`[STT] Converting ${mimeType} (${audioBuffer.length} bytes) to 16kHz mono WAV...`);
    processedBuffer = await convertAudioToWav(audioBuffer);
    finalMimeType = 'audio/wav';
    console.log(`[STT] Conversion complete. Output WAV: ${processedBuffer.length} bytes`);
  } catch (convErr) {
    console.warn(`[STT] Conversion warning: ${convErr.message}. Falling back to original audio.`);
    const extension = mimeTypeToExtension(mimeType);
    filename = `recording.${extension}`;
  }

  const formData = new FormData();
  formData.append('audio_file', processedBuffer, {
    filename,
    contentType: finalMimeType,
  });
  formData.append('model', GNANI_STT_MODEL);
  formData.append('language_code', GNANI_STT_LANGUAGE);

  try {
    const timeoutMs = Math.max(60000, Math.round(durationSeconds * 2000));
    const response = await axios.post(
      `${GNANI_STT_BASE_URL}/stt/v3`,
      formData,
      {
        headers: {
          'X-API-Key-ID': process.env.GNANI_API_KEY,
          ...formData.getHeaders(),
        },
        timeout: timeoutMs,
        maxContentLength: 50 * 1024 * 1024,
      }
    );

    const data = response.data;
    console.log('[STT] Gnani response:', JSON.stringify(data).substring(0, 200));

    // Parse response - Gnani returns data.transcript or transcript at root
    const transcript = extractTranscript(data);
    if (!transcript) {
      throw createApiError('Gnani returned an empty transcription. Please speak more clearly.', 'EMPTY_TRANSCRIPT', 422);
    }

    return {
      transcript,
      confidence: data?.data?.confidence || data?.confidence || null,
      model: data?.model || GNANI_STT_MODEL,
      language: data?.data?.detected_language_code || GNANI_STT_LANGUAGE,
    };
  } catch (error) {
    if (error.isApiError) throw error;

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data;

      if (status === 401) {
        throw createApiError('Invalid Gnani API key. Please check your GNANI_API_KEY.', 'GNANI_AUTH_FAILED', 401);
      }
      if (status === 429) {
        throw createApiError('Gnani rate limit reached. Please wait a moment and try again.', 'RATE_LIMITED', 429);
      }
      if (status === 402) {
        throw createApiError('Gnani API quota exceeded. Please check your account.', 'QUOTA_EXCEEDED', 402);
      }

      throw createApiError(
        `Gnani STT API error (${status}): ${JSON.stringify(detail)}`,
        'GNANI_API_ERROR',
        status
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw createApiError('Gnani API request timed out. Please try again.', 'TIMEOUT', 504);
    }

    throw createApiError(`Failed to transcribe audio: ${error.message}`, 'TRANSCRIPTION_FAILED', 500);
  }
}

function extractTranscript(data) {
  // Handle various possible response formats
  if (data?.data?.transcript) return data.data.transcript;
  if (data?.transcript) return data.transcript;
  if (data?.text) return data.text;
  if (data?.result?.transcript) return data.result.transcript;
  if (typeof data === 'string') return data;
  return null;
}

function mimeTypeToExtension(mimeType) {
  const map = {
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
  };
  return map[mimeType] || 'webm';
}

function createApiError(message, code, status) {
  const error = new Error(message);
  error.isApiError = true;
  error.code = code;
  error.status = status;
  return error;
}
