import type { PracticeSession, DashboardStats, ScorePoint } from '../types';

const SESSIONS_KEY = 'speakwise_sessions';
const SETTINGS_KEY = 'speakwise_settings';

// ─── Session Storage ───────────────────────────────────────────────────────

export function getAllSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PracticeSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: PracticeSession): void {
  const sessions = getAllSessions();
  const existingIdx = sessions.findIndex(s => s.id === session.id);
  if (existingIdx >= 0) {
    sessions[existingIdx] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSession(id: string): PracticeSession | null {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === id) || null;
}

export function deleteSession(id: string): void {
  const sessions = getAllSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function clearAllSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  const sessions = getAllSessions();
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalSpeakingTime: 0,
      averageScore: 0,
      bestScore: 0,
      recentSessions: [],
      scoreHistory: [],
    };
  }

  const completedSessions = sessions.filter(s => s.feedback);
  const scores = completedSessions.map(s => s.feedback.overallScore);
  const totalTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  const scoreHistory: ScorePoint[] = completedSessions
    .slice(0, 30)
    .reverse()
    .map(s => ({
      date: new Date(s.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: s.feedback.overallScore,
      sessionId: s.id,
    }));

  return {
    totalSessions: sessions.length,
    totalSpeakingTime: totalTime,
    averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    recentSessions: sessions.slice(0, 5),
    scoreHistory,
  };
}

// ─── Settings Storage ─────────────────────────────────────────────────────

export interface UserSettings {
  selectedVoice: string;
  preferredCategory: string;
}

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { selectedVoice: 'Shivani', preferredCategory: 'everyday' };
    return JSON.parse(raw);
  } catch {
    return { selectedVoice: 'Shivani', preferredCategory: 'everyday' };
  }
}

export function saveSettings(settings: Partial<UserSettings>): void {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// ─── ID Generation ────────────────────────────────────────────────────────

export function generateId(): string {
  return `sw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Time Formatting ──────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
