import { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Send, Play, Pause, AlertCircle, Clock, Sliders } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type { SpeakingQuestion } from '../types';
import { CATEGORY_CONFIG } from '../utils/questions';
import { getSettings, saveSettings } from '../utils/storage';

interface RecordingStudioProps {
  question: SpeakingQuestion;
  onComplete: (audio: Blob, duration: number) => void;
  error: string | null;
  onClearError: () => void;
  isRetry?: boolean;
  firstAttemptScore?: number;
}

const DURATION_PRESETS = [
  { seconds: 15, label: '15s' },
  { seconds: 30, label: '30s' },
  { seconds: 60, label: '1 min' },
  { seconds: 90, label: '1.5 min' },
  { seconds: 120, label: '2 min' },
  { seconds: 180, label: '3 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' },
];

export default function RecordingStudio({
  question,
  onComplete,
  error,
  onClearError,
  isRetry = false,
  firstAttemptScore,
}: RecordingStudioProps) {
  const initialLimit = getSettings().recordingLimitSeconds || 30;
  const [maxDuration, setMaxDuration] = useState<number>(initialLimit);
  const [showCustomSlider, setShowCustomSlider] = useState<boolean>(false);

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
  } = useAudioRecorder(maxDuration);

  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const categoryConfig = CATEGORY_CONFIG[question.category];

  const isRecording = recordingState === 'recording';
  const hasRecording = !!audioBlob && recordingState === 'idle';
  const combinedError = error || recorderError;

  const handleDurationSelect = (seconds: number) => {
    if (isRecording) return;
    setMaxDuration(seconds);
    saveSettings({ recordingLimitSeconds: seconds });
  };

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
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDurationLabel = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = secs / 60;
    return mins % 1 === 0 ? `${mins} min` : `${mins} min`;
  };

  const warnThreshold = Math.max(5, Math.min(15, Math.round(maxDuration * 0.1)));
  const isApproachingLimit = isRecording && duration >= maxDuration - warnThreshold;

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

      {/* Speaking Time Limit Selector */}
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
            <Clock size={13} className="text-[#8B7CFF]" />
            <span>Time Limit:</span>
            <span className="text-[#F8FAFC] font-semibold">{formatDurationLabel(maxDuration)}</span>
          </div>
          <button
            onClick={() => setShowCustomSlider(v => !v)}
            disabled={isRecording}
            className="text-[11px] text-[#8B7CFF] hover:text-[#A99DFF] flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <Sliders size={11} />
            {showCustomSlider ? 'Hide Slider' : 'Custom Slider (up to 10m)'}
          </button>
        </div>

        {/* Preset Pills */}
        <div className="flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map(preset => {
            const isSelected = maxDuration === preset.seconds;
            return (
              <button
                key={preset.seconds}
                onClick={() => handleDurationSelect(preset.seconds)}
                disabled={isRecording}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#8B7CFF] text-white shadow-sm font-semibold'
                    : 'bg-[#111827] text-[#94A3B8] border border-[#1E2D3D] hover:border-[#2D3F55] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Slider (15s up to 600s / 10 min) */}
        {showCustomSlider && (
          <div className="mt-3 pt-3 border-t border-[#1E2D3D] flex items-center gap-3">
            <span className="text-[10px] text-[#475569] font-mono">15s</span>
            <input
              type="range"
              min={15}
              max={600}
              step={15}
              value={maxDuration}
              disabled={isRecording}
              onChange={e => handleDurationSelect(Number(e.target.value))}
              className="flex-1 accent-[#8B7CFF] cursor-pointer disabled:opacity-40"
            />
            <span className="text-[10px] text-[#475569] font-mono">10m</span>
            <span className="text-xs font-mono font-medium text-[#8B7CFF] min-w-12 text-right">
              {formatDurationLabel(maxDuration)}
            </span>
          </div>
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

      {/* Dynamic Limit Auto-stop Notice */}
      {autoStopped && hasRecording && (
        <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#38BDF8]">
              Maximum time reached ({formatDurationLabel(maxDuration)})
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Recording stopped automatically according to your selected {formatDurationLabel(maxDuration)} limit. You can review your recording or submit it now.
            </p>
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

        {/* Timer & progress */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className={`text-4xl font-mono font-light tracking-widest ${
                isRecording
                  ? isApproachingLimit
                    ? 'text-[#F87171] font-medium'
                    : 'text-[#8B7CFF]'
                  : 'text-[#94A3B8]'
              }`}
            >
              {formatTime(duration)}
            </span>
            <span className="text-xs font-mono text-[#475569] self-end mb-1">
              / {formatTime(maxDuration)}
            </span>
          </div>

          {/* Progress bar towards maxDuration */}
          <div className="w-56 h-1.5 bg-[#1E2D3D] rounded-full mx-auto overflow-hidden mt-1.5 mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isApproachingLimit ? 'bg-[#F87171]' : 'bg-[#8B7CFF]'
              }`}
              style={{ width: `${Math.min(100, (duration / maxDuration) * 100)}%` }}
            />
          </div>

          {isRecording && !isApproachingLimit && (
            <p className="text-xs text-[#8B7CFF] mt-1 record-pulse">
              Recording... (auto-stops at {formatDurationLabel(maxDuration)})
            </p>
          )}
          {isRecording && isApproachingLimit && (
            <p className="text-xs text-[#F87171] mt-1 font-medium record-pulse">
              Approaching limit ({formatTime(Math.max(0, maxDuration - duration))} remaining)...
            </p>
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
              onClick={() => {
                resetRecording();
                onClearError();
              }}
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
