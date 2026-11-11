import type { EvaluationFeedback, TtsVoice } from '../types';

const API_BASE = '/api';

// ─── Speech Transcription ─────────────────────────────────────────────────

export interface TranscribeResult {
  transcript: string;
  duration: number;
  confidence: number | null;
  model: string;
  language: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  durationSeconds: number
): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('duration', durationSeconds.toString());

  const response = await fetch(`${API_BASE}/speech/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(errorData.error || 'Transcription failed', errorData.code, response.status);
  }

  const data = await response.json();
  return data;
}

// ─── Transcript Evaluation ────────────────────────────────────────────────

export async function evaluateTranscript(
  transcript: string,
  question: string,
  duration: number,
  category: string,
  tier: 'medium' | 'light' = 'medium'
): Promise<EvaluationFeedback> {
  const response = await fetch(`${API_BASE}/evaluate/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, question, duration, category, tier }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Evaluation failed' }));
    throw new ApiError(errorData.error || 'Evaluation failed', errorData.code, response.status);
  }

  const data = await response.json();
  return data.feedback;
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────

export async function synthesizeSpeech(
  text: string,
  voice: string,
  language: string = 'en-IN',
  emotion: string = 'natural'
): Promise<string> {
  const response = await fetch(`${API_BASE}/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, language, emotion }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Speech generation failed' }));
    throw new ApiError(errorData.error || 'TTS failed', errorData.code, response.status);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

export async function getAvailableVoices(): Promise<{ voices: TtsVoice[]; defaultVoice: string }> {
  const response = await fetch(`${API_BASE}/tts/voices`);
  if (!response.ok) throw new Error('Failed to fetch voices');
  return response.json();
}

// ─── Health Check ─────────────────────────────────────────────────────────

export async function checkServerHealth(): Promise<{
  status: string;
  gnaniConfigured: boolean;
  llmConfigured: boolean;
}> {
  const response = await fetch(`/health`);
  if (!response.ok) throw new Error('Server not reachable');
  return response.json();
}

// ─── AI Question Generation ───────────────────────────────────────────────

export async function generateQuestion(
  category: string,
  previousQuestions: string[]
): Promise<{ id: string; text: string; hint: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; category: string; isAiGenerated: boolean }> {
  const response = await fetch(`${API_BASE}/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, previousQuestions }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Generation failed' }));
    throw new ApiError(errorData.error || 'Question generation failed', errorData.code, response.status);
  }

  return response.json();
}

// ─── Error Class ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UNKNOWN', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
