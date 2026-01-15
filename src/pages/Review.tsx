import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import BottomNavigation from '@/components/BottomNavigation';
import AppHeader from '@/components/AppHeader';
import AvatarMascot from '@/components/AvatarMascot';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Target, Zap, Brain, Clock, Volume2, Check, X, ArrowLeft, Turtle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { LANGUAGE_CONTENT } from '@/lib/languageContent';
import { ADULT_PHRASE_LIBRARY, KIDS_PHRASE_LIBRARY, EXTENDED_TRANSLATIONS } from '@/lib/talkPhrases';

const reviewModes = [
  {
    id: 'practice',
    title: 'Practice',
    description: 'Review words you\'ve learned',
    icon: RotateCcw,
    color: 'bg-primary/10 text-primary',
    available: true,
  },
  {
    id: 'mistakes',
    title: 'Mistakes',
    description: 'Practice your weak spots',
    icon: Target,
    color: 'bg-destructive/10 text-destructive',
    available: true,
  },
  {
    id: 'speed',
    title: 'Speed Review',
    description: 'Quick fire questions',
    icon: Zap,
    color: 'bg-xp/10 text-xp',
    available: true,
  },
  {
    id: 'hard',
    title: 'Hard Words',
    description: 'Your most challenging vocabulary',
    icon: Brain,
    color: 'bg-secondary/10 text-secondary',
    available: true,
  },
];

interface ReviewQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  key: string;
}

const HARD_WORDS_KEY_PREFIX = 'dbl_hard_words_v1';
const hardWordsStorageKey = (languageCode: string, kidsMode: boolean) =>
  `${HARD_WORDS_KEY_PREFIX}:${languageCode}:${kidsMode ? 'kids' : 'adult'}`;

const loadHardWordKeys = (languageCode: string, kidsMode: boolean): string[] => {
  try {
    const raw = localStorage.getItem(hardWordsStorageKey(languageCode, kidsMode));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const recordHardWordKey = (languageCode: string, kidsMode: boolean, key: string) => {
  try {
    const existing = loadHardWordKeys(languageCode, kidsMode);
    const next = [key, ...existing.filter((k) => k !== key)].slice(0, 120);
    localStorage.setItem(hardWordsStorageKey(languageCode, kidsMode), JSON.stringify(next));
  } catch {
    // ignore
  }
};

const Review: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode?: string }>();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { progress, activeCourse, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();

  // State for practice/mistakes/speed/hard mode
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<ReviewQuestion[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const languageCode = activeCourse?.language_code || 'es';
  const languageContent = LANGUAGE_CONTENT[languageCode] || LANGUAGE_CONTENT.es;
  const extendedContent = EXTENDED_TRANSLATIONS[languageCode] || {};
  const isKidsMode = settings.kidsMode;

  // Generate questions based on mode
  useEffect(() => {
    if (!mode || !['practice', 'mistakes', 'speed', 'hard'].includes(mode)) return;

    const phraseLibrary = isKidsMode ? KIDS_PHRASE_LIBRARY : ADULT_PHRASE_LIBRARY;
    const allPhrases: { key: string; en: string }[] = [];

    phraseLibrary.forEach((category) => {
      category.phrases.forEach((phrase) => {
        allPhrases.push({ key: phrase.key, en: phrase.en });
      });
    });

    const pickBase = () => {
      if (mode === 'hard') {
        const hardKeys = loadHardWordKeys(languageCode, isKidsMode);
        const hardPool = allPhrases.filter((p) => hardKeys.includes(p.key));
        if (hardPool.length >= 6) return hardPool;
        // fallback: longer phrases tend to be harder
        return [...allPhrases].sort((a, b) => b.en.length - a.en.length).slice(0, Math.min(40, allPhrases.length));
      }
      return allPhrases;
    };

    const base = pickBase();
    const count = mode === 'speed' ? 15 : 10;

    // Shuffle and take questions
    const shuffled = [...base].sort(() => Math.random() - 0.5).slice(0, count);

    const generatedQuestions: ReviewQuestion[] = shuffled
      .map((phrase) => {
        const translation = extendedContent[phrase.key] || languageContent[phrase.key];
        
        // Skip phrases that don't have a proper translation (avoid English-only questions)
        if (!translation || translation === phrase.en) return null;

        // Generate wrong options - only use phrases that have real translations
        const wrongOptions = allPhrases
          .filter((p) => p.key !== phrase.key)
          .map((p) => ({
            key: p.key,
            translation: extendedContent[p.key] || languageContent[p.key],
          }))
          .filter((p) => p.translation && p.translation !== allPhrases.find(ap => ap.key === p.key)?.en)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((p) => p.translation);

        // Need at least 3 wrong options for a proper quiz
        if (wrongOptions.length < 3) return null;

        const options = [translation, ...wrongOptions].sort(() => Math.random() - 0.5);

        return {
          question: phrase.en,
          correctAnswer: translation,
          options,
          key: phrase.key,
        };
      })
      .filter((q): q is ReviewQuestion => q !== null);

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setMistakes([]);
    setIsComplete(false);
    setSelectedAnswer(null);
    setIsChecked(false);
  }, [mode, languageCode, isKidsMode]);

  // Only redirect to auth AFTER loading is complete
  useEffect(() => {
    if (!authLoading && !progressLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, progressLoading, navigate]);

  // Speed Review timer
  useEffect(() => {
    if (mode !== 'speed') return;
    if (isComplete) return;
    if (isChecked) return;
    if (!questions[currentIndex]) return;

    setTimeLeft(7);
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [mode, currentIndex, isComplete, isChecked, questions]);

  useEffect(() => {
    if (mode !== 'speed') return;
    if (isComplete) return;
    if (isChecked) return;
    const q = questions[currentIndex];
    if (!q) return;

    if (timeLeft <= 0) {
      setIsChecked(true);
      setIsCorrect(false);
      setMistakes((prev) => [...prev, q]);
      recordHardWordKey(languageCode, isKidsMode, q.key);
      // Give user 2 seconds to see the correct answer before moving on
      window.setTimeout(() => nextQuestion(), 2000);
    }
  }, [mode, timeLeft, isComplete, isChecked, currentIndex, questions, languageCode, isKidsMode]);

  const speakText = useCallback(async (text: string, slow = false) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      if (slow) {
        const words = text.split(/\s+/);
        for (const word of words) {
          await speak(word, languageCode, { rate: 0.5, engine: settings.ttsEngine, voiceURI: settings.ttsVoiceURI });
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      } else {
        await speak(text, languageCode, { engine: settings.ttsEngine, voiceURI: settings.ttsVoiceURI });
      }
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setIsSpeaking(false);
    }
  }, [languageCode, isSpeaking, settings.ttsEngine, settings.ttsVoiceURI]);

  const handleAnswer = (answer: string) => {
    if (isChecked) return;
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    const q = questions[currentIndex];
    if (!q || !selectedAnswer) return;

    const correct = selectedAnswer === q.correctAnswer;
    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => [...prev, q]);
      recordHardWordKey(languageCode, isKidsMode, q.key);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsChecked(false);
      setIsCorrect(false);
      setTimeLeft(0);
    } else {
      setIsComplete(true);
    }
  };

  const resetReview = () => {
    setCurrentIndex(0);
    setScore(0);
    setMistakes([]);
    setIsComplete(false);
    setSelectedAnswer(null);
    setIsChecked(false);
    setTimeLeft(0);

    // Regenerate questions
    const phraseLibrary = isKidsMode ? KIDS_PHRASE_LIBRARY : ADULT_PHRASE_LIBRARY;
    const allPhrases: { key: string; en: string }[] = [];
    phraseLibrary.forEach((category) => {
      category.phrases.forEach((phrase) => {
        allPhrases.push({ key: phrase.key, en: phrase.en });
      });
    });

    const pickBase = () => {
      if (mode === 'hard') {
        const hardKeys = loadHardWordKeys(languageCode, isKidsMode);
        const hardPool = allPhrases.filter((p) => hardKeys.includes(p.key));
        if (hardPool.length >= 6) return hardPool;
        return [...allPhrases].sort((a, b) => b.en.length - a.en.length).slice(0, Math.min(40, allPhrases.length));
      }
      return allPhrases;
    };

    const base = pickBase();
    const count = mode === 'speed' ? 15 : 10;

    const shuffled = [...base].sort(() => Math.random() - 0.5).slice(0, count * 2);
    const generatedQuestions: ReviewQuestion[] = shuffled
      .map((phrase) => {
        const translation = extendedContent[phrase.key] || languageContent[phrase.key];
        if (!translation || translation === phrase.en) return null;
        
        const wrongOptions = allPhrases
          .filter((p) => p.key !== phrase.key)
          .map((p) => ({
            key: p.key,
            translation: extendedContent[p.key] || languageContent[p.key],
          }))
          .filter((p) => p.translation && p.translation !== allPhrases.find(ap => ap.key === p.key)?.en)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((p) => p.translation);
        
        if (wrongOptions.length < 3) return null;
        
        const options = [translation, ...wrongOptions].sort(() => Math.random() - 0.5);
        return { question: phrase.en, correctAnswer: translation, options, key: phrase.key };
      })
      .filter((q): q is ReviewQuestion => q !== null)
      .slice(0, count);
    setQuestions(generatedQuestions);
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // If we're in a specific mode, show the practice UI
  if (mode && ['practice', 'mistakes', 'speed', 'hard'].includes(mode)) {
    const currentQuestion = questions[currentIndex];
    const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

    if (isComplete) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-6">
          <AvatarMascot mood="celebrating" size="xl" animate className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">Review Complete!</h1>
          <p className="text-muted-foreground mb-6">
            You got {score} out of {questions.length} correct
          </p>

          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg mb-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                {Math.round((score / questions.length) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-sm">
            <Button variant="outline" onClick={() => navigate('/review')} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={resetReview} className="flex-1 gradient-primary text-primary-foreground">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader
          leftSlot={
            <button onClick={() => navigate('/review')} className="text-sm font-medium text-muted-foreground">
              ← Back
            </button>
          }
          rightSlot={
            <Button variant="ghost" size="sm" onClick={resetReview} className="gap-1">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                {mode === 'practice'
                  ? 'Practice'
                  : mode === 'mistakes'
                    ? 'Mistakes Review'
                    : mode === 'speed'
                      ? `Speed Review • ${Math.max(0, timeLeft)}s`
                      : 'Hard Words'}
              </span>
              <span>{currentIndex + 1} / {questions.length}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {mode === 'speed' && (
              <Progress value={(Math.max(0, timeLeft) / 7) * 100} className="h-1 mt-2" />
            )}
          </div>

          {currentQuestion && (
            <>
              {/* Question Card */}
              <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
                <p className="text-sm text-muted-foreground mb-2">Translate this:</p>
                <p className="text-2xl font-bold mb-4">{currentQuestion.question}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => speakText(currentQuestion.correctAnswer)}
                    disabled={isSpeaking}
                    className="gap-2"
                  >
                    <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                    Listen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(currentQuestion.correctAnswer, true)}
                    disabled={isSpeaking}
                    title="Slow playback"
                  >
                    <Turtle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    disabled={isChecked}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all border-2',
                      selectedAnswer === option && !isChecked && 'border-primary bg-primary/10',
                      selectedAnswer !== option && !isChecked && 'border-border bg-card hover:border-primary/50',
                      isChecked && option === currentQuestion.correctAnswer && 'border-success bg-success/10',
                      isChecked && selectedAnswer === option && option !== currentQuestion.correctAnswer && 'border-destructive bg-destructive/10'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isChecked && option === currentQuestion.correctAnswer && (
                        <Check className="w-5 h-5 text-success" />
                      )}
                      {isChecked && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Button */}
              {!isChecked ? (
                <Button
                  onClick={checkAnswer}
                  disabled={!selectedAnswer}
                  className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
                >
                  Check Answer
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  className={cn(
                    'w-full h-14 text-lg font-bold rounded-2xl',
                    isCorrect ? 'gradient-success' : 'gradient-primary',
                    'text-primary-foreground'
                  )}
                >
                  {currentIndex < questions.length - 1 ? 'Continue' : 'See Results'}
                </Button>
              )}
            </>
          )}
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Default: Show review hub
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-center max-w-lg mx-auto">
          <h1 className="font-bold text-lg">Review Hub</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <AvatarMascot mood="happy" size="md" />
            <div>
              <h2 className="font-bold text-lg">Keep practicing!</h2>
              <p className="text-sm text-muted-foreground">
                Review helps you remember
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{progress?.total_xp || 0}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-streak">{progress?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Review Modes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg px-1">Review Modes</h3>
          
          {reviewModes.map((reviewMode) => (
            <button
              key={reviewMode.id}
              onClick={() => navigate(`/review/${reviewMode.id}`)}
              className={cn(
                'w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer'
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', reviewMode.color)}>
                <reviewMode.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{reviewMode.title}</p>
                <p className="text-sm text-muted-foreground">{reviewMode.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Timed Practice */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-xp/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-xp" />
            </div>
            <div>
              <h3 className="font-bold">Timed Challenge</h3>
              <p className="text-sm text-muted-foreground">Answer as many as you can in 60 seconds</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/timed-challenge')}
            className="w-full gradient-xp text-primary-foreground font-bold"
          >
            <Zap className="w-5 h-5 mr-2" /> Start Timed Challenge
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Review;