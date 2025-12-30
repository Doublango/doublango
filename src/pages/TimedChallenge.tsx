import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ParrotMascot from '@/components/ParrotMascot';
import ProgressBar from '@/components/ProgressBar';
import Confetti from '@/components/Confetti';
import { X, Clock, Zap, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeLessonExercises } from '@/lib/exerciseSanitizer';
import { speak } from '@/lib/tts';
import type { Database } from '@/integrations/supabase/types';
import type { ExtendedExerciseType } from '@/lib/content/aiLesson';

type DBExercise = Database['public']['Tables']['exercises']['Row'];

// Extended exercise type for TimedChallenge
interface Exercise extends Omit<DBExercise, 'exercise_type'> {
  exercise_type: ExtendedExerciseType;
}

type ExerciseOption = string | { text: string };

// Helper to normalize options to string array
const normalizeOptions = (options: unknown): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return (options as ExerciseOption[]).map((opt) => (typeof opt === 'string' ? opt : opt.text));
  }
  // { words: string[] }
  if (typeof options === 'object' && options !== null && 'words' in (options as any)) {
    const words = (options as any).words;
    return Array.isArray(words) ? words : [];
  }
  return [];
};

const buildFallbackHints = (correctAnswer: string): string[] => {
  const words = correctAnswer.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  return words.length ? words : [correctAnswer];
};

const CHALLENGE_DURATION = 60; // seconds

const TimedChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, activeCourse, updateProgress } = useUserProgress();
  const { toast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parrotMood, setParrotMood] = useState<'happy' | 'excited' | 'sad' | 'celebrating'>('happy');

  // Load random exercises
  useEffect(() => {
    const loadExercises = async () => {
      if (!activeCourse) return;

      try {
        // Get units for the language
        const { data: units } = await supabase
          .from('units')
          .select('id')
          .eq('language_code', activeCourse.language_code);

        if (!units?.length) {
          toast({ title: 'No content', description: 'No exercises available for this language', variant: 'destructive' });
          navigate('/review');
          return;
        }

        // Get lessons
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('unit_id', units.map(u => u.id));

        if (!lessons?.length) {
          navigate('/review');
          return;
        }

        // Get random exercises (limit 20 for timed challenge)
        const { data: exercisesData } = await supabase
          .from('exercises')
          .select('*')
          .in('lesson_id', lessons.map(l => l.id))
          .in('exercise_type', ['multiple_choice', 'translation', 'fill_blank'])
          .limit(50);

        if (!exercisesData?.length) {
          toast({ title: 'No content', description: 'No exercises available', variant: 'destructive' });
          navigate('/review');
          return;
        }

        // Shuffle and take 20
        const shuffled = [...exercisesData].sort(() => Math.random() - 0.5).slice(0, 20);
        setExercises(
          sanitizeLessonExercises(
            shuffled,
            activeCourse.language_code as Database['public']['Enums']['language_code']
          )
        );
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast({ title: 'Error', description: 'Failed to load exercises', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [activeCourse, navigate, toast]);

  // Timer
  useEffect(() => {
    if (loading || isComplete || exercises.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isComplete, exercises.length]);

  const endChallenge = useCallback(async () => {
    setIsComplete(true);
    setShowConfetti(score > 50);
    setParrotMood(score > 50 ? 'celebrating' : 'happy');

    if (user && progress) {
      try {
        await updateProgress({
          total_xp: (progress.total_xp || 0) + score,
          today_xp: (progress.today_xp || 0) + score,
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  }, [score, user, progress, updateProgress]);

  const currentExercise = exercises[currentIndex];

  const checkAndNext = () => {
    if (!currentExercise) return;

    const correctAnswer = currentExercise.correct_answer.toLowerCase().trim();
    let isCorrect = false;

    if (currentExercise.exercise_type === 'multiple_choice') {
      isCorrect = selectedAnswer?.toLowerCase().trim() === correctAnswer;
    } else {
      isCorrect = typedAnswer.toLowerCase().trim() === correctAnswer;
    }

    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectCount(prev => prev + 1);
      setParrotMood('excited');
      playSound('correct');
    } else {
      setParrotMood('sad');
      playSound('incorrect');
    }

    // Quick transition to next
    setTimeout(() => {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setTypedAnswer('');
        setParrotMood('happy');
      } else {
        endChallenge();
      }
    }, 300);
  };

  const playSound = (type: 'correct' | 'incorrect') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.05);
      } else {
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      }

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      // Audio not supported
    }
  };

  const speakText = (text: string) => {
    if (!activeCourse) return;
    void speak(text, activeCourse.language_code, { rate: 0.75 });
  };

  const handleSkip = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
    } else {
      endChallenge();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ParrotMascot mood="thinking" size="lg" animate />
          <p className="mt-4 text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        {showConfetti && <Confetti trigger={showConfetti} />}
        <ParrotMascot mood={parrotMood} size="xl" animate className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">Challenge Complete!</h1>
        <p className="text-muted-foreground mb-8">
          {score >= 100 ? "Amazing speed! 🚀" : score >= 50 ? "Great job! 💪" : "Keep practicing! 📚"}
        </p>

        <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-xp">{score}</p>
              <p className="text-sm text-muted-foreground">XP Earned</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">{correctCount}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{currentIndex + 1}</p>
              <p className="text-sm text-muted-foreground">Answered</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setCorrectCount(0);
              setTimeLeft(CHALLENGE_DURATION);
              setIsComplete(false);
              setShowConfetti(false);
              setExercises(prev => [...prev].sort(() => Math.random() - 0.5));
            }}
            className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
          >
            <Zap className="w-5 h-5 mr-2" /> Play Again
          </Button>
          <Button
            onClick={() => navigate('/review')}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-2xl"
          >
            Back to Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button onClick={() => navigate('/review')} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
          <ProgressBar
            value={currentIndex + 1}
            max={exercises.length}
            variant="primary"
            size="md"
            className="flex-1"
          />
          <div className={cn(
            'flex items-center gap-1 font-bold px-3 py-1 rounded-full',
            timeLeft <= 10 ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-xp/20 text-xp'
          )}>
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-1 text-xp font-bold">
            <Zap className="w-4 h-4" />
            <span>{score}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
        {currentExercise && (
          <>
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <ParrotMascot mood={parrotMood} size="sm" />
                <div className="bg-card rounded-2xl p-4 shadow-sm flex-1">
                  <p className="text-lg font-semibold">{currentExercise.question}</p>
                </div>
              </div>

              {(currentExercise.exercise_type === 'translation' || currentExercise.exercise_type === 'fill_blank') && (
                <button
                  onClick={() => speakText(currentExercise.correct_answer)}
                  className="mt-3 bg-primary/10 hover:bg-primary/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-colors w-full"
                >
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Listen</span>
                </button>
              )}
            </div>

            {/* Answer Area */}
            <div className="flex-1 space-y-3">
              {currentExercise.exercise_type === 'multiple_choice' && currentExercise.options && (
                <div className="space-y-2">
                  {normalizeOptions(currentExercise.options).map((option: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedAnswer(option);
                        // Auto-submit on selection for speed
                        setTimeout(() => {
                          const correctAnswer = currentExercise.correct_answer.toLowerCase().trim();
                          const isCorrect = option.toLowerCase().trim() === correctAnswer;
                          if (isCorrect) {
                            setScore(prev => prev + 10);
                            setCorrectCount(prev => prev + 1);
                            playSound('correct');
                          } else {
                            playSound('incorrect');
                          }
                          setTimeout(() => {
                            if (currentIndex < exercises.length - 1) {
                              setCurrentIndex(prev => prev + 1);
                              setSelectedAnswer(null);
                            } else {
                              endChallenge();
                            }
                          }, 200);
                        }, 100);
                      }}
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 text-left transition-all',
                        selectedAnswer === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {(currentExercise.exercise_type === 'translation' || currentExercise.exercise_type === 'fill_blank') && (
                <div className="space-y-4">
                  {(() => {
                    const provided = normalizeOptions(currentExercise.options).filter(Boolean);
                    const hints = provided.length ? provided : buildFallbackHints(currentExercise.correct_answer);
                    return (
                      <>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {hints.map((w, i) => (
                            <button
                              key={`${w}-${i}`}
                              type="button"
                              onClick={() => setTypedAnswer(prev => (prev ? `${prev} ${w}` : w))}
                              className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={typedAnswer}
                          onChange={(e) => setTypedAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && typedAnswer.trim() && checkAndNext()}
                          placeholder="Type your answer..."
                          autoFocus
                          className="w-full p-4 rounded-2xl border-2 bg-card text-lg border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </>
                    );
                  })()}
                  <div className="flex gap-2">
                    <Button onClick={handleSkip} variant="outline" className="flex-1 h-12 rounded-xl">
                      Skip
                    </Button>
                    <Button
                      onClick={checkAndNext}
                      disabled={!typedAnswer.trim()}
                      className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground font-bold"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TimedChallenge;