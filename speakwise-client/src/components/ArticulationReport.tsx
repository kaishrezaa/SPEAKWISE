import { useState } from 'react';
import { RotateCcw, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import type { SpeakingQuestion, EvaluationFeedback } from '../types';
import { saveSettings } from '../utils/storage';
import TtsPlayer from './TtsPlayer';
import ScoreMeter from './ScoreMeter';

interface AttemptData {
  transcript: string;
  duration: number;
  feedback: EvaluationFeedback;
}

interface ArticulationReportProps {
  question: SpeakingQuestion;
  attempt: AttemptData;
  attemptNumber: number;
  firstAttempt?: AttemptData;
  onSpeakAgain?: () => void;
  onNewQuestion: () => void;
  selectedVoice: string;}

export default function ArticulationReport({
  question,
  attempt,
  attemptNumber,
  firstAttempt,
  onSpeakAgain,
  onNewQuestion,
  selectedVoice: initialVoice,
}: ArticulationReportProps) {
  const { feedback, duration } = attempt;
  const isComparison = attemptNumber === 2 && !!firstAttempt;
  const [selectedVoice, setSelectedVoice] = useState(initialVoice || 'Shivani');

  const scoreColor = (s: number) => s >= 75 ? '#34D399' : s >= 55 ? '#FBBF24' : '#F87171';
  const scoreDiff = isComparison && firstAttempt
    ? feedback.overallScore - firstAttempt.feedback.overallScore
    : 0;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {isComparison ? (
            <span className="text-xs font-medium text-[#8B7CFF] bg-[#8B7CFF]/10 px-3 py-1 rounded-full">
              Attempt 2 — Comparison
            </span>
          ) : (
            <span className="text-xs font-medium text-[#94A3B8] bg-[#161D2B] border border-[#1E2D3D] px-3 py-1 rounded-full">
              Articulation Report
            </span>
          )}
          {feedback.evaluationMethod === 'gemini' && (
            <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2 py-1 rounded-full">
              ✨ Gemini AI ({feedback.modelUsed || '3.5 Flash-Lite'})
            </span>
          )}
          {feedback.evaluationMethod === 'deterministic' && (
            <span className="text-[10px] text-[#475569] bg-[#161D2B] border border-[#1E2D3D] px-2 py-1 rounded-full">
              Deterministic analysis
            </span>
          )}
        </div>
        <p className="text-sm text-[#94A3B8] italic mb-3">"{question.text}"</p>

        {/* User's Original Spoken Transcript Card */}
        <div className="bg-[#111827] border border-[#1E2D3D] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]">
              Your Original Spoken Words
            </span>
            <span className="text-[10px] text-[#475569]">
              Gnani Prisma Transcription ({Math.round(duration)}s)
            </span>
          </div>
          <p className="text-sm text-[#F8FAFC] leading-relaxed italic">
            "{attempt.transcript || 'No transcript recorded'}"
          </p>
        </div>
      </div>

      {/* Score overview */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-6">
          {/* Overall score circle */}
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1E2D3D" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={scoreColor(feedback.overallScore)}
                strokeWidth="6"
                strokeDasharray="213.6"
                strokeDashoffset={213.6 - (213.6 * feedback.overallScore) / 100}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
              <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" fill={scoreColor(feedback.overallScore)} fontSize="18" fontWeight="700">
                {feedback.overallScore}
              </text>
              <text x="40" y="55" textAnchor="middle" fill="#475569" fontSize="8">
                /100
              </text>
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">
                {isComparison ? 'Second Attempt Score' : 'Overall Communication Score'}
              </h2>
              {isComparison && scoreDiff !== 0 && (
                <span className={`text-sm font-semibold ${scoreDiff > 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                  {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                </span>
              )}
            </div>
            <p className="text-sm text-[#94A3B8] mb-3">{feedback.summary}</p>

            {/* Category scores */}
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(feedback.scores).map(([key, val]) => (
                <ScoreMeter key={key} label={SCORE_LABELS[key as keyof typeof SCORE_LABELS]} value={val} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison banner */}
      {isComparison && firstAttempt && (
        <div className={`rounded-xl p-4 mb-5 border ${scoreDiff > 0 ? 'bg-[#34D399]/5 border-[#34D399]/20' : scoreDiff < 0 ? 'bg-[#F87171]/5 border-[#F87171]/20' : 'bg-[#161D2B] border-[#1E2D3D]'}`}>
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Comparison: Attempt 1 vs Attempt 2</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(feedback.scores).map(([key, val]) => {
              const prev = firstAttempt.feedback.scores[key as keyof typeof firstAttempt.feedback.scores];
              const diff = val - prev;
              return (
                <div key={key} className="text-center">
                  <p className="text-[10px] text-[#475569] mb-1">{SCORE_LABELS[key as keyof typeof SCORE_LABELS]}</p>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{val}</p>
                  <p className={`text-[10px] font-medium ${diff > 0 ? 'text-[#34D399]' : diff < 0 ? 'text-[#F87171]' : 'text-[#475569]'}`}>
                    {diff > 0 ? `+${diff}` : diff === 0 ? '—' : diff}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Filler word comparison */}
          {firstAttempt.feedback.fillerWords.total !== feedback.fillerWords.total && (
            <p className="text-xs text-[#94A3B8] mt-3">
              Filler words: {firstAttempt.feedback.fillerWords.total} → {feedback.fillerWords.total}
              {feedback.fillerWords.total < firstAttempt.feedback.fillerWords.total
                ? ` (↓ ${firstAttempt.feedback.fillerWords.total - feedback.fillerWords.total} fewer ✓)`
                : feedback.fillerWords.total > firstAttempt.feedback.fillerWords.total
                  ? ` (↑ ${feedback.fillerWords.total - firstAttempt.feedback.fillerWords.total} more)`
                  : ''}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-[#34D399]" />
              <h3 className="text-sm font-semibold text-[#F8FAFC]">What You Did Well</h3>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                  <span className="text-[#34D399] mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements with Concrete Solutions */}
        {feedback.improvements.length > 0 && (
          <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-[#FBBF24]" />
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Identified Mistakes &amp; Actionable Solutions</h3>
            </div>
            <ul className="space-y-3">
              {feedback.improvements.map((item, i) => (
                <li key={i} className="border-b border-[#1E2D3D] pb-2.5 last:border-0 last:pb-0">
                  <p className="text-xs font-semibold text-[#FBBF24] mb-0.5">⚠️ {item.issue}</p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-1.5">{item.detail}</p>
                  {item.solution && (
                    <div className="bg-[#0B0F19] rounded-lg p-2 border border-[#1E2D3D]">
                      <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-wider block mb-0.5">
                        💡 How to fix it:
                      </span>
                      <p className="text-[11px] text-[#F8FAFC] leading-relaxed">
                        {item.solution}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filler words */}
      {feedback.fillerWords.total > 0 && (
        <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">
            Filler Word Analysis
            <span className="ml-2 text-xs font-normal text-[#FBBF24]">{feedback.fillerWords.total} detected</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(feedback.fillerWords.breakdown).map(([word, count]) => (
              <span key={word} className="text-xs px-2.5 py-1 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                "{word}" × {count}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#475569] mt-2">
            Try pausing silently instead of using filler words. Even a brief pause sounds more confident.
          </p>
        </div>
      )}

      {/* Sentence improvements */}
      {feedback.sentenceImprovements.length > 0 && (
        <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Better Ways to Express Yourself</h3>
          <div className="space-y-4">
            {feedback.sentenceImprovements.map((si, i) => (
              <div key={i} className="border-l-2 border-[#1E2D3D] pl-4">
                <div className="mb-1.5">
                  <span className="text-[10px] text-[#475569] uppercase tracking-widest block mb-1">Original</span>
                  <p className="text-xs text-[#94A3B8] italic">"{si.original}"</p>
                </div>
                <div className="mb-1.5">
                  <span className="text-[10px] text-[#8B7CFF] uppercase tracking-widest block mb-1">Improved</span>
                  <p className="text-xs text-[#F8FAFC] font-medium">"{si.improved}"</p>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">{si.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TTS Player - Gnani Timbre */}
      {feedback.improvedResponse && (
        <TtsPlayer
          text={feedback.improvedResponse}
          toneRewrites={feedback.toneRewrites}
          selectedVoice={selectedVoice}
          onVoiceChange={(v) => { setSelectedVoice(v); saveSettings({ selectedVoice: v }); }}
        />
      )}

      {/* Stats */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Response Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <StatItem label="Words" value={feedback.wordStats?.wordCount?.toString() || '—'} />
          <StatItem label="Sentences" value={feedback.wordStats?.sentenceCount?.toString() || '—'} />
          <StatItem label="Speaking Rate" value={feedback.speakingRate?.wpm > 0 ? `${feedback.speakingRate.wpm} WPM` : '—'} />
          <StatItem label="Duration" value={duration > 0 ? `${Math.round(duration)}s` : '—'} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!isComparison && onSpeakAgain && (
          <button
            onClick={onSpeakAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
          >
            <RotateCcw size={15} />
            Speak Again
          </button>
        )}
        <button
          onClick={onNewQuestion}
          className={`${isComparison ? 'flex-1' : ''} flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium text-[#94A3B8] bg-[#161D2B] border border-[#1E2D3D] hover:border-[#2D3F55] hover:text-[#F8FAFC] transition-all`}
        >
          <Plus size={15} />
          New Question
        </button>
      </div>

      {/* Tagline */}
      {isComparison && (
        <p className="text-center text-xs text-[#475569] mt-6">SpeakWise · Think clearly. Speak confidently.</p>
      )}
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-[#F8FAFC]">{value}</p>
      <p className="text-[10px] text-[#475569] mt-0.5">{label}</p>
    </div>
  );
}
