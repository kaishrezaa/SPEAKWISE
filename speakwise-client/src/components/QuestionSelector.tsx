import { useState } from 'react';
import { ChevronRight, Shuffle } from 'lucide-react';
import { SPEAKING_QUESTIONS, CATEGORY_CONFIG, getRandomQuestion } from '../utils/questions';
import type { SpeakingQuestion, QuestionCategory } from '../types';

interface QuestionSelectorProps {
  onSelect: (question: SpeakingQuestion) => void;
}

export default function QuestionSelector({ onSelect }: QuestionSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('everyday');

  const filteredQuestions = SPEAKING_QUESTIONS.filter(q => q.category === activeCategory);

  const handleRandom = () => {
    onSelect(getRandomQuestion(activeCategory));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Choose a speaking challenge</h1>
        <p className="text-[#94A3B8]">Select a question to practise. Each response is recorded, transcribed and analysed.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.entries(CATEGORY_CONFIG) as [QuestionCategory, typeof CATEGORY_CONFIG[QuestionCategory]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeCategory === key
                ? 'text-white'
                : 'bg-[#161D2B] text-[#94A3B8] border border-[#1E2D3D] hover:border-[#2D3F55] hover:text-[#F8FAFC]'
            }`}
            style={activeCategory === key ? { background: config.color + '25', color: config.color, border: `1px solid ${config.color}40` } : {}}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-2 mb-6">
        {filteredQuestions.map(question => (
          <button
            key={question.id}
            onClick={() => onSelect(question)}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
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
        Pick a random question
      </button>
    </div>
  );
}
