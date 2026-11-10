// Core data types for SpeakWise

export interface PracticeSession {
  id: string;
  question: string;
  category: QuestionCategory;
  transcript: string;
  duration: number; // seconds
  feedback: EvaluationFeedback;
  ttsGenerated: boolean;
  attempts: SessionAttempt[];
  createdAt: string; // ISO timestamp
  completedAt?: string;
}

export interface SessionAttempt {
  attemptNumber: number;
  transcript: string;
  duration: number;
  feedback: EvaluationFeedback;
  createdAt: string;
}

export type QuestionCategory =
  | 'everyday'
  | 'opinion'
  | 'personal'
  | 'professional';

export interface SpeakingQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hint?: string;
}

export interface EvaluationFeedback {
  overallScore: number;
  scores: CategoryScores;
  strengths: string[];
  improvements: ImprovementItem[];
  fillerWords: FillerWordAnalysis;
  sentenceImprovements: SentenceImprovement[];
  improvedResponse: string;
  summary: string;
  wordStats: WordStats;
  speakingRate: SpeakingRate;
  evaluationMethod: 'gemini' | 'deterministic' | 'llm';
  evaluationNote?: string;
  modelUsed?: string;
}

export interface CategoryScores {
  grammar: number;
  vocabulary: number;
  fluency: number;
  clarity: number;
  articulation: number;
}

export interface ImprovementItem {
  issue: string;
  detail: string;
}

export interface FillerWordAnalysis {
  total: number;
  breakdown: Record<string, number>;
}

export interface SentenceImprovement {
  original: string;
  improved: string;
  explanation: string;
}

export interface WordStats {
  wordCount: number;
  sentenceCount: number;
  uniqueWords: number;
  vocabularyRichness: number;
  averageWordsPerSentence: number;
}

export interface SpeakingRate {
  wpm: number;
  assessment: 'slow' | 'measured' | 'natural' | 'fast' | 'very fast' | 'unknown';
}

export interface DashboardStats {
  totalSessions: number;
  totalSpeakingTime: number; // seconds
  averageScore: number;
  bestScore: number;
  recentSessions: PracticeSession[];
  scoreHistory: ScorePoint[];
}

export interface ScorePoint {
  date: string;
  score: number;
  sessionId: string;
}

export interface TtsVoice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  description: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'processing';
export type PracticeStage =
  | 'question'
  | 'recording'
  | 'processing'
  | 'report'
  | 'tts'
  | 'retry'
  | 'comparison';

export interface LanguageConfig {
  code: string;
  displayName: string;
  available: boolean;
  comingSoon?: boolean;
  sttConfig: { model: string; languageCode: string };
  ttsConfig: { model: string; language: string };
  defaultVoice: string;
}
