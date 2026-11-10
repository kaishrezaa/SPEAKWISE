import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingState } from '../types';

interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  autoStopped: boolean;
  clearAutoStopped: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
  waveformData: number[];
}

const MAX_RECORDING_SECONDS = 30;

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoStopped, setAutoStopped] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0.1));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }

  function startWaveformAnalysis(stream: MediaStream) {
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function draw() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 32 }, (_, i) => {
          const val = dataArray[i] || 0;
          return Math.max(0.05, val / 255);
        });
        setWaveformData(bars);
        animFrameRef.current = requestAnimationFrame(draw);
      }

      draw();
    } catch {
      // Waveform visualisation is non-critical
    }
  }

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordingState('requesting');

    try {
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error('Your browser does not support audio recording. Please use Chrome or Firefox.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Pick best supported format
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState('idle');
      };

      mediaRecorder.start(100); // collect in 100ms chunks
      startTimeRef.current = Date.now();
      setRecordingState('recording');
      setDuration(0);

      // Start duration timer and auto-stop at 30 seconds
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        if (elapsed >= MAX_RECORDING_SECONDS) {
          setAutoStopped(true);
          stopRecording();
        }
      }, 500);

      // Start waveform
      startWaveformAnalysis(stream);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (message.includes('NotFoundError') || message.includes('no devices')) {
        setError('No microphone detected. Please connect a microphone and try again.');
      } else {
        setError(message);
      }
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || recordingState !== 'recording') return;
    setRecordingState('stopping');

    // Stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Set final duration
    const finalDuration = (Date.now() - startTimeRef.current) / 1000;
    setDuration(Math.round(finalDuration));

    // Stop waveform and reset
    setWaveformData(Array(32).fill(0.1));

    // Stop audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    mediaRecorderRef.current.stop();
  }, [recordingState]);

  const resetRecording = useCallback(() => {
    cleanup();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setAutoStopped(false);
    setRecordingState('idle');
    setWaveformData(Array(32).fill(0.1));
    chunksRef.current = [];
  }, [audioUrl]);

  const clearAutoStopped = useCallback(() => {
    setAutoStopped(false);
  }, []);

  return {
    recordingState,
    duration,
    audioBlob,
    audioUrl,
    error,
    autoStopped,
    clearAutoStopped,
    startRecording,
    stopRecording,
    resetRecording,
    waveformData,
  };
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}
