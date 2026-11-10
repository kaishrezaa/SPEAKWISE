import { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Send, Play, Pause, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type { SpeakingQuestion } from '../types';
import { CATEGORY_CONFIG } from '../utils/questions';

interface RecordingStudioProps {
  question: SpeakingQuestion;
  onComplete: (audio: Blob, duration: number) => void;
  error: string | null;
  onClearError: () => void;
  isRetry?: boolean;
  firstAttemptScore?: number;
}

export default function RecordingStudio({
  question,
  onComplete,
  error,
  onClearError,
  isRetry = false,
  firstAttemptScore,
}: RecordingStudioProps) {
  const {
    recordingState,
    duration,
    audioBlob,
    audioUrl,
    error: recorderError,
    autoStopped,
    clearAutoStopped,
    startRecording,
    stopRecording,
    resetRecording,
    waveformData,
  } = useAudioRecorder();

  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const categoryConfig = CATEGORY_CONFIG[question.category];

  const isRecording = recordingState === 'recording';
  const hasRecording = !!audioBlob && recordingState === 'idle';
  const combinedError = error || recorderError;

  const handleSubmit = () => {
    if (audioBlob && duration > 0) {
      onComplete(audioBlob, duration);
    }
  };

  const handlePlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingBack) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlayingBack(!isPlayingBack);
  };

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingBack(false);
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [audioUrl]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {isRetry ? (
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8B7CFF] bg-[#8B7CFF]/10 px-3 py-1.5 rounded-full mb-3">
            <span>Attempt 2 — Try again</span>
            {firstAttemptScore !== undefined && (
              <span className="text-[#94A3B8]">· Previous score: {firstAttemptScore}</span>
            )}
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-3"
            style={{ background: `${categoryConfig.color}15`, color: categoryConfig.color }}
          >
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </div>
        )}
        <h1 className="text-xl font-semibold text-[#F8FAFC] leading-relaxed">
          {isRetry ? 'Now express the same idea again.' : question.text}
        </h1>
        {isRetry && (
          <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">"{question.text}"</p>
        )}
        {question.hint && !isRetry && (
          <p className="text-sm text-[#475569] mt-2">💡 {question.hint}</p>
        )}
      </div>

      {/* Error banner */}
      {combinedError && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#F87171] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-[#F87171]">{combinedError}</p>
          </div>
          <button onClick={onClearError} className="text-[#475569] hover:text-[#94A3B8] text-xs">×</button>
        </div>
      )}

      {/* 30-Second Limit Auto-stop Notice */}
      {autoStopped && hasRecording && (
        <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#38BDF8]">Maximum time reached (30 seconds)</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Recording stopped automatically so your answer fits the speech analysis model. You can review your recording or submit it now.</p>
          </div>
          <button onClick={clearAutoStopped} className="text-[#475569] hover:text-[#94A3B8] text-xs">×</button>
        </div>
      )}

      {/* Recording interface */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-8 mb-6">
        {/* Waveform visualiser */}
        <div className="flex items-end justify-center gap-0.5 h-16 mb-6">
          {waveformData.map((val, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(4, val * 56)}px`,
                background: isRecording
                  ? `rgba(139, 124, 255, ${0.4 + val * 0.6})`
                  : hasRecording
                    ? `rgba(56, 189, 248, ${0.3 + val * 0.4})`
                    : '#1E2D3D',
                animationDuration: isRecording ? `${0.4 + (i % 5) * 0.1}s` : undefined,
              }}
            />
          ))}
        </div>

        {/* Timer & 30s progress */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-4xl font-mono font-light tracking-widest ${isRecording ? (duration >= 25 ? 'text-[#F87171] font-medium' : 'text-[#8B7CFF]') : 'text-[#94A3B8]'}`}>
              {formatTime(duration)}
            </span>
            <span className="text-xs font-mono text-[#475569] self-end mb-1">/ 00:30</span>
          </div>

          {/* Progress bar towards 30s */}
          <div className="w-48 h-1 bg-[#1E2D3D] rounded-full mx-auto overflow-hidden mt-1.5 mb-2">
            <div
              className={`h-full transition-all duration-300 ${duration >= 25 ? 'bg-[#F87171]' : 'bg-[#8B7CFF]'}`}
              style={{ width: `${Math.min(100, (duration / 30) * 100)}%` }}
            />
          </div>

          {isRecording && duration < 25 && (
            <p className="text-xs text-[#8B7CFF] mt-1 record-pulse">Recording... (auto-stops at 30s)</p>
          )}
          {isRecording && duration >= 25 && (
            <p className="text-xs text-[#F87171] mt-1 font-medium record-pulse">Approaching 30s limit...</p>
          )}
          {hasRecording && (
            <p className="text-xs text-[#34D399] mt-1">{formatTime(duration)} recorded</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Reset */}
          {hasRecording && (
            <button
              onClick={() => { resetRecording(); onClearError(); }}
              className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-3 py-2 rounded-lg hover:bg-[#1C2535]"
            >
              <RotateCcw size={14} />
              Redo
            </button>
          )}

          {/* Main record/stop button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recordingState === 'requesting' || recordingState === 'stopping'}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 ${
              isRecording
                ? 'bg-[#F87171] hover:bg-[#EF4444] shadow-lg shadow-[#F87171]/30'
                : recordingState === 'requesting'
                  ? 'bg-[#8B7CFF]/50 cursor-wait'
                  : hasRecording
                    ? 'bg-[#8B7CFF]/20 cursor-default'
                    : 'bg-[#8B7CFF] hover:bg-[#7B6CEF] shadow-lg shadow-[#8B7CFF]/30'
            } ${isRecording ? 'record-pulse' : ''}`}
          >
            {isRecording ? (
              <Square size={20} className="text-white" fill="white" />
            ) : (
              <Mic size={20} className="text-white" />
            )}
          </button>

          {/* Playback */}
          {hasRecording && (
            <button
              onClick={handlePlayback}
              className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-3 py-2 rounded-lg hover:bg-[#1C2535]"
            >
              {isPlayingBack ? <Pause size={14} /> : <Play size={14} />}
              {isPlayingBack ? 'Pause' : 'Preview'}
            </button>
          )}
        </div>

        {/* Instruction text */}
        {!isRecording && !hasRecording && (
          <p className="text-center text-xs text-[#475569] mt-4">
            Press the button to start recording. Speak naturally.
          </p>
        )}
        {isRecording && duration === 0 && (
          <p className="text-center text-xs text-[#475569] mt-4">
            Listening… speak your response clearly.
          </p>
        )}
      </div>

      {/* Submit */}
      {hasRecording && (
        <div className="fade-in-up">
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
          >
            <Send size={15} />
            Analyse My Response
          </button>
          <p className="text-center text-xs text-[#475569] mt-3">
            Your response will be transcribed and analysed for communication quality.
          </p>
        </div>
      )}
    </div>
  );
}
