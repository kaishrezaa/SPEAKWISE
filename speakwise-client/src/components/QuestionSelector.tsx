import { useState, useCallback } from 'react';
import { ChevronRight, Shuffle, Sparkles, ChevronLeft, Loader2 } from 'lucide-react';
import { SPEAKING_QUESTIONS, CATEGORY_CONFIG, getRandomQuestion } from '../utils/questions';
import { generateQuestion } from '../services/api';
import type { SpeakingQuestion, QuestionCategory } from '../types';

interface QuestionSelectorProps {
  onSelect: (question: SpeakingQuestion) => void;
}

export default function QuestionSelector({ onSelect }: QuestionSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('everyday');
  const [generatedHistory, setGeneratedHistory] = useState<SpeakingQuestion[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 = not viewing history
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const filteredQuestions = SPEAKING_QUESTIONS.filter(q => q.category === activeCategory);

  const handleRandom = () => {
    onSelect(getRandomQuestion(activeCategory));
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const previousTexts = generatedHistory.map(q => q.text);
      const result = await generateQuestion(activeCategory, previousTexts);
      const question: SpeakingQuestion = {
        id: result.id,
        text: result.text,
        hint: result.hint,
        difficulty: result.difficulty,
        category: result.category as QuestionCategory,
      };
      setGeneratedHistory(prev => [question, ...prev]);
      setHistoryIndex(0);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate question');
    } finally {
      setIsGenerating(false);
    }
  }, [activeCategory, generatedHistory]);

  const currentGenQuestion =
    historyIndex >= 0 && historyIndex < generatedHistory.length
      ? generatedHistory[historyIndex]
      : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Choose a speaking challenge</h1>
        <p className="text-[#94A3B8]">
          Select a question to practise. Each response is recorded, transcribed and analysed.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          Object.entries(CATEGORY_CONFIG) as [QuestionCategory, (typeof CATEGORY_CONFIG)[QuestionCategory]][]
        ).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeCategory === key
                ? 'text-white'
                : 'bg-[#161D2B] text-[#94A3B8] border border-[#1E2D3D] hover:border-[#2D3F55] hover:text-[#F8FAFC]'
            }`}
            style={
              activeCategory === key
                ? { background: config.color + '25', color: config.color, border: `1px solid ${config.color}40` }
                : {}
            }
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        ))}
      </div>

      {/* ── AI Question Generator ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#8B7CFF]/10 via-[#161D2B] to-[#38BDF8]/5 border border-[#8B7CFF]/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#8B7CFF]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">AI Question Generator</h3>
            <span className="text-[10px] text-[#8B7CFF] bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 px-2 py-0.5 rounded-full">
              Powered by Gemini
            </span>
          </div>
          {generatedHistory.length > 0 && (
            <span className="text-[10px] text-[#475569]">{generatedHistory.length} generated</span>
          )}
        </div>

        {/* Current AI Question Display */}
        {currentGenQuestion && (
          <div className="bg-[#0B0F19] rounded-xl p-4 mb-4 border border-[#8B7CFF]/20">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B7CFF]">
                    ✨ AI Generated
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded text-[#94A3B8] bg-[#161D2B] border border-[#1E2D3D]">
                    {currentGenQuestion.difficulty}
                  </span>
                </div>
                <p className="text-sm text-[#F8FAFC] font-medium leading-relaxed">
                  {currentGenQuestion.text}
                </p>
                {currentGenQuestion.hint && (
                  <p className="text-xs text-[#475569] mt-2">💡 {currentGenQuestion.hint}</p>
                )}
              </div>
              <button
                onClick={() => onSelect(currentGenQuestion)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
              >
                Start
                <ChevronRight size={12} />
              </button>
            </div>

            {/* History navigation */}
            {generatedHistory.length > 1 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1E2D3D]">
                <button
                  onClick={() => setHistoryIndex(i => Math.min(i + 1, generatedHistory.length - 1))}
                  disabled={historyIndex >= generatedHistory.length - 1}
                  className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={12} />
                  Older
                </button>
                <span className="text-[10px] text-[#475569] flex-1 text-center">
                  {historyIndex + 1} / {generatedHistory.length}
                </span>
                <button
                  onClick={() => setHistoryIndex(i => Math.max(i - 1, 0))}
                  disabled={historyIndex <= 0}
                  className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Newer
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {genError && (
          <div className="bg-[#F87171]/5 border border-[#F87171]/20 rounded-lg p-3 mb-4 text-xs text-[#F87171]">
            ⚠ {genError}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#8B7CFF]/20"
          style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating unique question…
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate AI Question
            </>
          )}
        </button>
      </div>

      {/* ── Curated questions ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <span className="text-[11px] uppercase tracking-widest text-[#475569] font-medium">
          Or choose from curated questions
        </span>
      </div>

      <div className="space-y-2 mb-6">
        {filteredQuestions.map(question => (
          <button
            key={question.id}
            onClick={() => onSelect(question)}
            className="w-full bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 text-left transition-all duration-150 hover:border-[#8B7CFF]/40 hover:bg-[#1C2535] group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-[#F8FAFC] text-sm font-medium leading-relaxed">{question.text}</p>
                {question.hint && (
                  <p className="text-xs text-[#475569] mt-1.5">💡 {question.hint}</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded text-[#94A3B8] bg-[#0B0F19] border border-[#1E2D3D]">
                  {question.difficulty}
                </span>
                <ChevronRight
                  size={15}
                  className="text-[#475569] group-hover:text-[#8B7CFF] transition-colors flex-shrink-0"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Random button */}
      <button
        onClick={handleRandom}
        className="flex items-center gap-2 text-sm text-[#8B7CFF] hover:text-[#A99DFF] transition-colors"
      >
        <Shuffle size={14} />
        Pick a random question from curated list
      </button>
    </div>
  );
}
