import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';
import { getSession, formatDuration } from '../utils/storage';
import { CATEGORY_CONFIG } from '../utils/questions';
import ScoreMeter from '../components/ScoreMeter';
import TtsPlayer from '../components/TtsPlayer';
import { getSettings, saveSettings } from '../utils/storage';
import { useState } from 'react';

export default function SessionReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = id ? getSession(id) : null;
  const settings = getSettings();
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoice);

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#94A3B8] mb-4">Session not found.</p>
        <button onClick={() => navigate('/progress')} className="text-[#8B7CFF] hover:underline text-sm">
          Back to progress
        </button>
      </div>
    );
  }

  const { feedback } = session;
  const categoryConfig = CATEGORY_CONFIG[session.category];
  const scoreColor = (s: number) => s >= 75 ? '#34D399' : s >= 55 ? '#FBBF24' : '#F87171';
  const hasMultipleAttempts = session.attempts && session.attempts.length > 1;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${categoryConfig.color}15`, color: categoryConfig.color }}>
            {categoryConfig.icon} {categoryConfig.label}
          </span>
          <span className="text-xs text-[#475569]">
            {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-xs text-[#475569]">· {formatDuration(session.duration)}</span>
        </div>
        <h1 className="text-xl font-semibold text-[#F8FAFC] leading-relaxed">"{session.question}"</h1>
      </div>

      {/* Score overview */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1E2D3D" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={scoreColor(feedback.overallScore)}
                strokeWidth="6"
                strokeDasharray="213.6"
                strokeDashoffset={213.6 - (213.6 * feedback.overallScore) / 100}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" fill={scoreColor(feedback.overallScore)} fontSize="18" fontWeight="700">{feedback.overallScore}</text>
              <text x="40" y="55" textAnchor="middle" fill="#475569" fontSize="8">/100</text>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[#F8FAFC] mb-2">Communication Score</h2>
            <p className="text-sm text-[#94A3B8] mb-3">{feedback.summary}</p>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(feedback.scores).map(([key, val]) => (
                <ScoreMeter key={key} label={SCORE_LABELS[key as keyof typeof SCORE_LABELS]} value={val} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-5">
        <h3 className="text-xs text-[#475569] uppercase tracking-widest mb-2">Your Response</h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">"{session.transcript}"</p>
        {feedback.fillerWords.total > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(feedback.fillerWords.breakdown).map(([word, count]) => (
              <span key={word} className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                "{word}" ×{count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Multi-attempt comparison */}
      {hasMultipleAttempts && (
        <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Attempt Comparison</h3>
          <div className="space-y-3">
            {session.attempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-lg">
                <div>
                  <p className="text-xs font-medium text-[#F8FAFC]">Attempt {attempt.attemptNumber}</p>
                  <p className="text-[10px] text-[#475569] mt-0.5">{formatDuration(attempt.duration)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: scoreColor(attempt.feedback.overallScore) }}>
                    {attempt.feedback.overallScore}
                  </p>
                  {i > 0 && (
                    <p className={`text-[10px] font-medium ${attempt.feedback.overallScore > session.attempts[0].feedback.overallScore ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                      {attempt.feedback.overallScore > session.attempts[0].feedback.overallScore ? '↑' : '↓'}
                      {Math.abs(attempt.feedback.overallScore - session.attempts[0].feedback.overallScore)} pts
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TTS */}
      {feedback.improvedResponse && (
        <TtsPlayer
          text={feedback.improvedResponse}
          selectedVoice={selectedVoice}
          onVoiceChange={(v) => { setSelectedVoice(v); saveSettings({ selectedVoice: v }); }}
        />
      )}

      <button
        onClick={() => navigate('/practice')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
      >
        <Mic size={15} />
        Practice Again
      </button>
    </div>
  );
}

const SCORE_LABELS = {
  grammar: 'Grammar',
  vocabulary: 'Vocab',
  fluency: 'Fluency',
  clarity: 'Clarity',
  articulation: 'Articulate',
};
