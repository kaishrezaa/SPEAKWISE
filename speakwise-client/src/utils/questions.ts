import type { SpeakingQuestion, QuestionCategory } from '../types';

export const SPEAKING_QUESTIONS: SpeakingQuestion[] = [
  // Everyday Conversation
  { id: 'ev1', text: 'What does success mean to you?', category: 'everyday', difficulty: 'beginner' },
  { id: 'ev2', text: 'Describe a movie or book that changed your perspective.', category: 'everyday', difficulty: 'beginner' },
  { id: 'ev3', text: 'What is one thing you would change about your city or town?', category: 'everyday', difficulty: 'beginner' },
  { id: 'ev4', text: 'Talk about a hobby you enjoy and why it matters to you.', category: 'everyday', difficulty: 'beginner' },
  
  // Opinion & Critical Thinking
  { id: 'op1', text: 'Do you think social media has a positive or negative impact on young people?', category: 'opinion', difficulty: 'intermediate', hint: 'Consider both sides before choosing your position.' },
  { id: 'op2', text: 'Should college education be mandatory for everyone? Why or why not?', category: 'opinion', difficulty: 'intermediate' },
  { id: 'op3', text: 'Is artificial intelligence a threat to employment, or does it create more opportunities?', category: 'opinion', difficulty: 'intermediate' },
  { id: 'op4', text: 'What do you think about the Indian education system? What would you change?', category: 'opinion', difficulty: 'intermediate' },
  { id: 'op5', text: 'Do you believe remote work is better than working from an office?', category: 'opinion', difficulty: 'beginner' },

  // Personal Expression
  { id: 'pe1', text: 'Describe a challenge you have overcome and what you learned from it.', category: 'personal', difficulty: 'intermediate' },
  { id: 'pe2', text: 'What motivates you to keep going when things get difficult?', category: 'personal', difficulty: 'beginner' },
  { id: 'pe3', text: 'Talk about something you are genuinely passionate about.', category: 'personal', difficulty: 'beginner' },
  { id: 'pe4', text: 'Describe a person who has had a significant influence on your life.', category: 'personal', difficulty: 'beginner' },

  // Professional Communication
  { id: 'pr1', text: 'Tell me about yourself — your background, strengths and what you are looking for.', category: 'professional', difficulty: 'intermediate', hint: 'Structure: past → present → future.' },
  { id: 'pr2', text: 'Why should someone hire you over other candidates?', category: 'professional', difficulty: 'intermediate' },
  { id: 'pr3', text: 'Describe a situation where you demonstrated leadership or took initiative.', category: 'professional', difficulty: 'advanced' },
  { id: 'pr4', text: 'How do you handle disagreements with colleagues or teammates?', category: 'professional', difficulty: 'intermediate' },
  { id: 'pr5', text: 'What are your career goals for the next three to five years?', category: 'professional', difficulty: 'beginner' },
];

export const CATEGORY_CONFIG: Record<QuestionCategory, { label: string; description: string; icon: string; color: string }> = {
  everyday: {
    label: 'Everyday Conversation',
    description: 'Practise expressing your thoughts and opinions on everyday topics.',
    icon: '💬',
    color: '#38BDF8',
  },
  opinion: {
    label: 'Opinion & Critical Thinking',
    description: 'Develop the ability to argue a point clearly and logically.',
    icon: '🧠',
    color: '#8B7CFF',
  },
  personal: {
    label: 'Personal Expression',
    description: 'Share your experiences and feelings with clarity and confidence.',
    icon: '✨',
    color: '#34D399',
  },
  professional: {
    label: 'Professional Communication',
    description: 'Sharpen your interview and workplace communication skills.',
    icon: '💼',
    color: '#FBBF24',
  },
};

export function getQuestionsByCategory(category: QuestionCategory): SpeakingQuestion[] {
  return SPEAKING_QUESTIONS.filter(q => q.category === category);
}

export function getRandomQuestion(category?: QuestionCategory): SpeakingQuestion {
  const pool = category ? getQuestionsByCategory(category) : SPEAKING_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}
