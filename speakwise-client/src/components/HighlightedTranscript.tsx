import React, { useMemo } from 'react';
import type { SentenceImprovement } from '../types';

interface HighlightedTranscriptProps {
  transcript: string;
  fillerBreakdown?: Record<string, number>;
  sentenceImprovements?: SentenceImprovement[];
}

interface SpanMatch {
  start: number;
  end: number;
  type: 'filler' | 'mistake';
  text: string;
  meta?: {
    word?: string;
    count?: number;
    improved?: string;
    explanation?: string;
  };
}

export default function HighlightedTranscript({
  transcript,
  fillerBreakdown = {},
  sentenceImprovements = [],
}: HighlightedTranscriptProps) {
  const renderedElements = useMemo(() => {
    if (!transcript) return null;

    const matches: SpanMatch[] = [];

    // 1. Find sentence improvement mistake phrases
    for (const si of sentenceImprovements) {
      if (!si.original || si.original.length < 3) continue;
      const cleanOriginal = si.original.trim();
      const escaped = cleanOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(transcript)) !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            type: 'mistake',
            text: m[0],
            meta: {
              improved: si.improved,
              explanation: si.explanation,
            },
          });
        }
      } catch {
        // In case regex parsing fails for exotic punctuation
      }
    }

    // 2. Find filler words
    for (const [filler] of Object.entries(fillerBreakdown)) {
      if (!filler) continue;
      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(transcript)) !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            type: 'filler',
            text: m[0],
            meta: {
              word: filler,
              count: fillerBreakdown[filler],
            },
          });
        }
      } catch {
        // Skip invalid regex
      }
    }

    // Sort matches by start index, then longer matches first
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Deduplicate overlapping matches
    const nonOverlapping: SpanMatch[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    if (nonOverlapping.length === 0) {
      return <span>"{transcript}"</span>;
    }

    // Construct fragments
    const parts: React.ReactNode[] = [];
    let curIdx = 0;

    for (let i = 0; i < nonOverlapping.length; i++) {
      const match = nonOverlapping[i];
      if (match.start > curIdx) {
        parts.push(transcript.slice(curIdx, match.start));
      }

      if (match.type === 'filler') {
        parts.push(
          <span
            key={`match-${i}`}
            title={`Filler word: "${match.text}"`}
            className="text-[#FBBF24] font-medium bg-[#FBBF24]/15 px-1 py-0.5 rounded border border-[#FBBF24]/30 underline decoration-[#FBBF24]/50 underline-offset-2 inline-block mx-0.5"
          >
            {match.text}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`match-${i}`}
            title={`Suggested Fix: "${match.meta?.improved || ''}"`}
            className="text-[#F87171] font-medium bg-[#F87171]/15 px-1 py-0.5 rounded border border-[#F87171]/30 underline decoration-[#F87171]/50 underline-offset-2 inline-block mx-0.5"
          >
            {match.text}
          </span>
        );
      }

      curIdx = match.end;
    }

    if (curIdx < transcript.length) {
      parts.push(transcript.slice(curIdx));
    }

    return (
      <span>
        "{parts}"
      </span>
    );
  }, [transcript, fillerBreakdown, sentenceImprovements]);

  const hasHighlights =
    Object.keys(fillerBreakdown).length > 0 || sentenceImprovements.length > 0;

  return (
    <div>
      <div className="text-sm text-[#F8FAFC] leading-relaxed italic mb-3">
        {renderedElements}
      </div>

      {/* Visual Legend */}
      {hasHighlights && (
        <div className="flex items-center gap-4 pt-2 border-t border-[#1E2D3D] text-[11px] text-[#94A3B8]">
          {Object.keys(fillerBreakdown).length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#FBBF24]/40 border border-[#FBBF24]" />
              <span>Filler words</span>
            </div>
          )}
          {sentenceImprovements.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#F87171]/40 border border-[#F87171]" />
              <span>Phrases with improvements</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
