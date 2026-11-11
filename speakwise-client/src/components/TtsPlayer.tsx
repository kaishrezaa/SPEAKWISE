import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, AlertCircle, Sparkles, User } from 'lucide-react';
import { synthesizeSpeech } from '../services/api';
import type { TtsVoice, ToneRewrites } from '../types';

interface TtsPlayerProps {
  text: string;
  toneRewrites?: ToneRewrites;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

const VOICES: (TtsVoice & { badge?: string })[] = [
  // Female voices
  { id: 'Shivani', name: 'Shivani', gender: 'Female', description: 'Warm & empathetic', badge: 'Default' },
  { id: 'Lakshmi', name: 'Lakshmi', gender: 'Female', description: 'Clear & professional' },
  { id: 'Kalpana', name: 'Kalpana', gender: 'Female', description: 'Natural & friendly' },
  { id: 'Riyaa', name: 'Riyaa', gender: 'Female', description: 'Bright & energetic' },
  // Male voices
  { id: 'Avinash', name: 'Avinash', gender: 'Male', description: 'Deep & confident' },
  { id: 'Shubham', name: 'Shubham', gender: 'Male', description: 'Clear & articulate' },
  { id: 'Prakash', name: 'Prakash', gender: 'Male', description: 'Calm & measured' },
  { id: 'Devansh', name: 'Devansh', gender: 'Male', description: 'Youthful & expressive' },
];

export type EmotionTone = 'natural' | 'formal' | 'casual' | 'academic' | 'encouraging';

const EMOTIONS: { id: EmotionTone; label: string; icon: string; hint: string }[] = [
  { id: 'natural', label: 'Natural', icon: '🌿', hint: 'Balanced conversational pacing' },
  { id: 'formal', label: 'Formal', icon: '👔', hint: 'Measured & deliberate for workplace' },
  { id: 'casual', label: 'Casual', icon: '☕', hint: 'Relaxed everyday tone' },
  { id: 'academic', label: 'Academic', icon: '🎓', hint: 'Precise articulation for lectures & interviews' },
  { id: 'encouraging', label: 'Encouraging', icon: '✨', hint: 'Uplifting & confident delivery' },
];

type TtsStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export default function TtsPlayer({ text, toneRewrites, selectedVoice, onVoiceChange }: TtsPlayerProps) {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTone>('natural');
  const [activeGender, setActiveGender] = useState<'All' | 'Female' | 'Male'>('All');
  const [isFallback, setIsFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // Dynamically select the exact reworded script for the active tone
  const activeScript = (toneRewrites && toneRewrites[selectedEmotion])
    ? toneRewrites[selectedEmotion]
    : text;

  useEffect(() => {
    const cache = audioCacheRef.current;
    return () => {
      cache.forEach(url => URL.revokeObjectURL(url));
      cache.clear();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const generate = async () => {
    setStatus('loading');
    setError(null);
    setIsFallback(false);

    try {
      const cacheKey = `${selectedVoice}:${selectedEmotion}:${activeScript}`;
      let url = audioCacheRef.current.get(cacheKey) || null;

      if (!url) {
        url = await synthesizeSpeech(activeScript, selectedVoice, 'en-IN', selectedEmotion);
        audioCacheRef.current.set(cacheKey, url);
      }

      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.onended = () => setStatus('ready');
      audio.onpause = () => setStatus('paused');
      audio.onplay = () => setStatus('playing');
      audioRef.current = audio;
      setStatus('ready');
      audio.play();
      setStatus('playing');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate audio';
      setError(message);

      if ('speechSynthesis' in window) {
        setIsFallback(true);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    }
  };

  const playFallback = () => {
    const utterance = new SpeechSynthesisUtterance(activeScript);
    utterance.lang = 'en-IN';
    utterance.rate = selectedEmotion === 'formal' || selectedEmotion === 'academic' ? 0.9 : 1.0;
    utterance.onend = () => setStatus('ready');
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    setStatus('playing');
  };

  const handlePlayPause = () => {
    if (isFallback) {
      if (status === 'playing') {
        speechSynthesis.pause();
        setStatus('paused');
      } else {
        if (status === 'paused') {
          speechSynthesis.resume();
        } else {
          playFallback();
        }
        setStatus('playing');
      }
      return;
    }

    if (!audioRef.current) return;
    if (status === 'playing') {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleReplay = () => {
    if (isFallback) {
      playFallback();
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    if (audioRef.current) audioRef.current.pause();
    setStatus('idle');
    setAudioUrl(null);
  };

  const handleEmotionSelect = (emotion: EmotionTone) => {
    setSelectedEmotion(emotion);
    if (audioRef.current) audioRef.current.pause();
    setStatus('idle');
    setAudioUrl(null);
  };

  const filteredVoices = activeGender === 'All'
    ? VOICES
    : VOICES.filter(v => v.gender === activeGender);

  const currentVoiceObj = VOICES.find(v => v.id === selectedVoice) || VOICES[0];

  return (
    <div className="bg-gradient-to-br from-[#8B7CFF]/10 via-[#161D2B] to-[#38BDF8]/5 border border-[#8B7CFF]/20 rounded-2xl p-6 mb-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[#38BDF8]" />
          <h3 className="text-sm font-semibold text-[#F8FAFC]">Listen &amp; Learn with Gnani Timbre</h3>
        </div>
        <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded-full border border-[#38BDF8]/20 font-medium">
          timbre-v3.0
        </span>
      </div>

      <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
        Hear how your thoughts sound when communicated with confidence and precision. Select a voice and tone to match your practice style.
      </p>

      {/* Dynamic rewording preview tailored for the active tone */}
      <div className="bg-[#0B0F19] rounded-xl p-4 mb-5 border border-[#1E2D3D]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#38BDF8]">
            {selectedEmotion} Version Script
          </span>
          <span className="text-[10px] text-[#475569]">
            Wording adapts to tone
          </span>
        </div>
        <p className="text-xs text-[#F8FAFC] leading-relaxed italic">"{activeScript}"</p>
      </div>

      {/* Control Section: Voice Selection & Gender Filter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
            <User size={13} className="text-[#8B7CFF]" />
            Select Voice:
            <span className="text-[#F8FAFC] font-semibold">{currentVoiceObj.name} ({currentVoiceObj.gender})</span>
          </span>

          {/* Gender Filter Pills */}
          <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-[#1E2D3D]">
            {(['All', 'Female', 'Male'] as const).map(g => (
              <button
                key={g}
                onClick={() => setActiveGender(g)}
                className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                  activeGender === g
                    ? 'bg-[#8B7CFF] text-white font-medium shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {filteredVoices.map(v => {
            const isSelected = v.id === selectedVoice;
            return (
              <button
                key={v.id}
                onClick={() => handleVoiceSelect(v.id)}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#8B7CFF]/15 border-[#8B7CFF] text-[#F8FAFC] shadow-sm'
                    : 'bg-[#111827] border-[#1E2D3D] text-[#94A3B8] hover:border-[#2D3F55] hover:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold">{v.name}</span>
                  <span className={`text-[9px] px-1 rounded ${v.gender === 'Female' ? 'text-[#F472B6] bg-[#F472B6]/10' : 'text-[#38BDF8] bg-[#38BDF8]/10'}`}>
                    {v.gender === 'Female' ? '♀' : '♂'}
                  </span>
                </div>
                <span className="text-[10px] text-[#475569] truncate w-full">{v.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emotion / Tone Selector */}
      <div className="mb-5">
        <span className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-[#38BDF8]" />
          Expressive Delivery Tone:
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {EMOTIONS.map(e => {
            const isSelected = selectedEmotion === e.id;
            return (
              <button
                key={e.id}
                onClick={() => handleEmotionSelect(e.id)}
                title={e.hint}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#F8FAFC] shadow-sm'
                    : 'bg-[#111827] border-[#1E2D3D] text-[#94A3B8] hover:border-[#2D3F55] hover:text-[#F8FAFC]'
                }`}
              >
                <div className="text-sm mb-0.5">{e.icon}</div>
                <p className="text-[11px] font-medium leading-none mb-1">{e.label}</p>
                <p className="text-[9px] text-[#475569] truncate">{e.hint.split(' ')[0]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error & fallback messages */}
      {error && (
        <div className="bg-[#F87171]/5 border border-[#F87171]/20 rounded-lg p-3 mb-4 text-xs text-[#F87171] flex items-start gap-2">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <div>
            <p>{error}</p>
            {isFallback && <p className="text-[#475569] mt-1">Browser speech fallback active.</p>}
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#1E2D3D]">
        {status === 'idle' && (
          <button
            onClick={generate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-[#38BDF8]/20"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
          >
            <Volume2 size={15} />
            Generate &amp; Play Audio
          </button>
        )}

        {status === 'loading' && (
          <div className="flex items-center gap-2.5 text-sm text-[#94A3B8]">
            <div className="w-4 h-4 border-2 border-[#38BDF8]/30 border-t-[#38BDF8] rounded-full animate-spin" />
            Synthesizing with Gnani Timbre ({currentVoiceObj.name} · {selectedEmotion})...
          </div>
        )}

        {(status === 'ready' || status === 'playing' || status === 'paused') && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md shadow-[#38BDF8]/20"
              style={{ background: '#38BDF8' }}
              title={status === 'playing' ? 'Pause' : 'Play'}
            >
              {status === 'playing'
                ? <Pause size={16} className="text-white" fill="white" />
                : <Play size={16} className="text-white" fill="white" />
              }
            </button>
            <button
              onClick={handleReplay}
              className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827] border border-[#1E2D3D] transition-all"
              title="Replay from start"
            >
              <RotateCcw size={15} />
            </button>
            <span className="text-xs text-[#34D399] font-medium flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              {currentVoiceObj.name} ({currentVoiceObj.gender}) · {selectedEmotion}
            </span>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => setStatus('idle')}
            className="px-4 py-2 rounded-lg bg-[#F87171]/10 text-xs font-medium text-[#F87171] border border-[#F87171]/20 hover:bg-[#F87171]/20 transition-all"
          >
            Retry Generation
          </button>
        )}
      </div>
    </div>
  );
}
