import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORY_CONFIG, getRandomQuestion } from '../utils/questions';
import { saveSession, generateId, getSettings } from '../utils/storage';
import { transcribeAudio, evaluateTranscript } from '../services/api';
import type { PracticeSession, SpeakingQuestion, QuestionCategory, EvaluationFeedback } from '../types';
import QuestionSelector from '../components/QuestionSelector';
import RecordingStudio from '../components/RecordingStudio';
import ProcessingView from '../components/ProcessingView';
import ArticulationReport from '../components/ArticulationReport';

type Stage = 'question' | 'recording' | 'processing' | 'report' | 'retry' | 'comparison';

interface AttemptData {
  transcript: string;
  duration: number;
  feedback: EvaluationFeedback;
}

export default function Practice() {
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<Stage>('question');
  const [selectedQuestion, setSelectedQuestion] = useState<SpeakingQuestion | null>(null);
  const [firstAttempt, setFirstAttempt] = useState<AttemptData | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptData | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(generateId());
  const settings = getSettings();

  // Handle category from URL param
  useEffect(() => {
    const categoryParam = searchParams.get('category') as QuestionCategory | null;
    if (categoryParam && CATEGORY_CONFIG[categoryParam]) {
      const q = getRandomQuestion(categoryParam);
      setSelectedQuestion(q);
      setStage('recording');
    }
  }, []);

  const handleQuestionSelected = (question: SpeakingQuestion) => {
    setSelectedQuestion(question);
    setStage('recording');
  };

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!selectedQuestion) return;
    setStage('processing');
    setError(null);

    try {
      // Step 1: Transcribe
      setProcessingStatus('Transcribing with Gnani Prisma...');
      const transcribeResult = await transcribeAudio(audioBlob, duration);
      const transcript = transcribeResult.transcript;

      if (!transcript || transcript.trim().length < 3) {
        throw new Error('Could not transcribe your response. Please ensure you spoke clearly and try again.');
      }

      // Step 2: Evaluate
      setProcessingStatus('Analysing your communication...');
      const feedback = await evaluateTranscript(
        transcript,
        selectedQuestion.text,
        duration,
        selectedQuestion.category
      );

      const attemptData: AttemptData = { transcript, duration, feedback };
      setCurrentAttempt(attemptData);

      if (attemptNumber === 1) {
        setFirstAttempt(attemptData);
        // Save session
        const session: PracticeSession = {
          id: sessionId,
          question: selectedQuestion.text,
          category: selectedQuestion.category,
          transcript,
          duration,
          feedback,
          ttsGenerated: false,
          attempts: [{
            attemptNumber: 1,
            transcript,
            duration,
            feedback,
            createdAt: new Date().toISOString(),
          }],
          createdAt: new Date().toISOString(),
        };
        saveSession(session);
      } else {
        // Update session with second attempt
        const savedSession = {
          id: sessionId,
          question: selectedQuestion.text,
          category: selectedQuestion.category,
          transcript: firstAttempt!.transcript,
          duration: firstAttempt!.duration,
          feedback: firstAttempt!.feedback,
          ttsGenerated: false,
          attempts: [
            {
              attemptNumber: 1,
              transcript: firstAttempt!.transcript,
              duration: firstAttempt!.duration,
              feedback: firstAttempt!.feedback,
              createdAt: new Date().toISOString(),
            },
            {
              attemptNumber: 2,
              transcript,
              duration,
              feedback,
              createdAt: new Date().toISOString(),
            }
          ],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        saveSession(savedSession);
        setStage('comparison');
        return;
      }

      setStage('report');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setStage('recording');
    }
  }, [selectedQuestion, attemptNumber, firstAttempt, sessionId]);

  const handleSpeakAgain = () => {
    setAttemptNumber(2);
    setStage('retry');
  };

  const handleNewQuestion = () => {
    setStage('question');
    setSelectedQuestion(null);
    setAttemptNumber(1);
    setFirstAttempt(null);
    setCurrentAttempt(null);
    setError(null);
  };

  if (stage === 'question') {
    return (
      <QuestionSelector onSelect={handleQuestionSelected} />
    );
  }

  if (stage === 'recording' || stage === 'retry') {
    return (
      <RecordingStudio
        question={selectedQuestion!}
        onComplete={handleRecordingComplete}
        error={error}
        onClearError={() => setError(null)}
        isRetry={stage === 'retry'}
        firstAttemptScore={firstAttempt?.feedback.overallScore}
      />
    );
  }

  if (stage === 'processing') {
    return <ProcessingView status={processingStatus} />;
  }

  if (stage === 'report' && currentAttempt) {
    return (
      <ArticulationReport
        question={selectedQuestion!}
        attempt={currentAttempt}
        attemptNumber={1}
        onSpeakAgain={handleSpeakAgain}
        onNewQuestion={handleNewQuestion}
        selectedVoice={settings.selectedVoice}
      />
    );
  }

  if (stage === 'comparison' && firstAttempt && currentAttempt) {
    return (
      <ArticulationReport
        question={selectedQuestion!}
        attempt={currentAttempt}
        attemptNumber={2}
        firstAttempt={firstAttempt}
        onNewQuestion={handleNewQuestion}
        selectedVoice={settings.selectedVoice}
      />
    );
  }

  return null;
}
