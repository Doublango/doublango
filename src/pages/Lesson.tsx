import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import MonkeyMascot from '@/components/MonkeyMascot';
import ProgressBar from '@/components/ProgressBar';
import Confetti from '@/components/Confetti';
import SpeechExercise from '@/components/SpeechExercise';
import AudioExercise from '@/components/AudioExercise';
import { X, Heart, Volume2, Mic, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeLessonExercises } from '@/lib/exerciseSanitizer';
import { speak } from '@/lib/tts';
import { generateLessonForLanguage } from '@/lib/languageContent';
import { generateAiLessonExercises } from '@/lib/content/aiLesson';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { Database } from '@/integrations/supabase/types';

type Exercise = Database['public']['Tables']['exercises']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface ExerciseOption {
  text: string;
  correct?: boolean;
}

// Helper to normalize options to string array
const normalizeOptions = (options: unknown): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((opt) => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'object' && opt !== null && 'text' in opt) return (opt as ExerciseOption).text;
      return String(opt);
    });
  }
  return [];
};

// Helper to generate word bank words from correct answer
const generateWordBankWords = (correctAnswer: string, existingOptions: unknown): string[] => {
  // Split correct answer into words
  const correctWords = correctAnswer.split(/\s+/).filter(w => w.trim());
  
  // Check if we have existing words in options
  const opts = existingOptions as unknown as { words?: string[] } | string[];
  let words: string[] = [];
  
  if (opts && typeof opts === 'object' && 'words' in opts && Array.isArray(opts.words)) {
    // If words is a single sentence, split it
    if (opts.words.length === 1 && opts.words[0].includes(' ')) {
      words = opts.words[0].split(/\s+/).filter(w => w.trim());
    } else {
      words = opts.words.filter(w => w.trim());
    }
  } else if (Array.isArray(opts)) {
    words = normalizeOptions(opts).filter(w => w.trim());
  }
  
  // If we have words, use them; otherwise use correct answer words
  if (words.length === 0) {
    words = [...correctWords];
  }
  
  // Add distractor words if we have too few
  const distractors = ['the', 'a', 'is', 'are', 'to', 'in', 'and', 'for', 'of', 'with', 'it', 'on', 'at', 'by', 'from'];
  while (words.length < Math.max(correctWords.length + 2, 5)) {
    const distractor = distractors[Math.floor(Math.random() * distractors.length)];
    if (!words.includes(distractor)) {
      words.push(distractor);
    }
    if (words.length >= correctWords.length + 4) break;
  }
  
  return words;
};

const LessonPage: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, updateProgress, refetch, activeCourse } = useUserProgress();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { settings: appSettings } = useAppSettings();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [wordBankAnswer, setWordBankAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [lives, setLives] = useState(progress?.lives || 5);
  const [xpEarned, setXpEarned] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [monkeyMood, setMonkeyMood] = useState<'happy' | 'excited' | 'sad' | 'celebrating'>('happy');
  const [speechResult, setSpeechResult] = useState<{ correct: boolean; transcript: string; accuracy: number } | null>(null);

  const autoPlayedRef = useRef<string | null>(null);
  const restoredProgressRef = useRef(false);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) return;
      setLoading(true);

      try {
        const lessonRes = await supabase.from('lessons').select('*').eq('id', lessonId).single();
        if (lessonRes.data) setLesson(lessonRes.data);

        const exercisesRes = await supabase
          .from('exercises')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('exercise_order');

        const lang = (activeCourse?.language_code || 'es') as Database['public']['Enums']['language_code'];

        if (exercisesRes.data?.length) {
          setExercises(sanitizeLessonExercises(exercisesRes.data, lang));
          return;
        }

        // If backend has no exercises for this lesson yet, generate them.
        const lessonNumber = lessonRes.data?.lesson_number ?? 1;

        let generated: Array<{ exercise_type: Exercise['exercise_type']; question: string; correct_answer: string; options?: any; hint?: string | null }> = [];

        try {
          const ai = await generateAiLessonExercises(lang, lessonNumber);
          generated = ai.map((e) => ({
            exercise_type: e.exercise_type,
            question: e.question,
            correct_answer: e.correct_answer,
            options: e.options,
            hint: e.hint ?? null,
          }));
        } catch {
          // ignore and fallback to local generator
        }

        if (!generated.length) {
          const local = generateLessonForLanguage(lang, lessonNumber);
          generated = local.map((e) => ({
            exercise_type: e.type as Exercise['exercise_type'],
            question: e.question,
            correct_answer: e.correctAnswer,
            options: e.options ?? null,
            hint: e.hint ?? null,
          }));
        }

        const rows: Exercise[] = generated.slice(0, 10).map((g, i) => ({
          id: `gen-${lessonId}-${i}`,
          lesson_id: lessonId,
          exercise_order: i + 1,
          exercise_type: g.exercise_type,
          question: g.question,
          correct_answer: g.correct_answer,
          options: (g.options ?? null) as any,
          hint: g.hint ?? null,
          audio_url: null,
        }));

        setExercises(rows);
      } catch (error) {
        console.error('Error loading lesson:', error);
        toast({ title: 'Error', description: 'Failed to load lesson', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, toast, activeCourse?.language_code]);

  // If the course language arrives after initial fetch, resanitize existing exercises
  useEffect(() => {
    if (!activeCourse?.language_code || exercises.length === 0) return;
    setExercises(prev => sanitizeLessonExercises(prev, activeCourse.language_code));
  }, [activeCourse?.language_code]);

  useEffect(() => {
    // Initialize word bank when exercise changes
    const exercise = exercises[currentIndex];
    if (exercise?.exercise_type === 'word_bank') {
      // Use the new helper to generate proper word bank words
      const words = generateWordBankWords(exercise.correct_answer, exercise.options);
      setAvailableWords(shuffleArray([...words]));
      setWordBankAnswer([]);
    }
    if (exercise?.exercise_type === 'match_pairs') {
      setMatchedPairs(new Set());
      setSelectedMatch(null);
    }
  }, [currentIndex, exercises]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const currentExercise = exercises[currentIndex];

  const checkAnswer = () => {
    if (!currentExercise) return;

    let correct = false;
    const correctAnswer = currentExercise.correct_answer.toLowerCase().trim();

    switch (currentExercise.exercise_type) {
      case 'multiple_choice':
      case 'select_sentence':
        correct = selectedAnswer?.toLowerCase().trim() === correctAnswer;
        break;
      case 'translation':
      case 'fill_blank':
      case 'type_what_you_hear':
        correct = typedAnswer.toLowerCase().trim() === correctAnswer;
        break;
      case 'word_bank':
        correct = wordBankAnswer.join(' ').toLowerCase().trim() === correctAnswer;
        break;
      case 'match_pairs':
        // Match pairs are checked as you go, so if we get here, it's complete
        correct = true;
        break;
    }

    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      setXpEarned(prev => prev + 10);
      setMonkeyMood('excited');
      playSound('correct');
    } else {
      setLives(prev => prev - 1);
      setMistakes(prev => prev + 1);
      setMonkeyMood('sad');
      playSound('incorrect');
    }
  };

  const playSound = (type: 'correct' | 'incorrect') => {
    // Web Audio API for sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const nextExercise = async () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    } else {
      // Lesson complete
      await completeLesson();
    }
  };

  const resetState = () => {
    setSelectedAnswer(null);
    setTypedAnswer('');
    setWordBankAnswer([]);
    setIsChecked(false);
    setIsCorrect(false);
    setMonkeyMood('happy');
    setSpeechResult(null);
  };

  const completeLesson = async () => {
    if (!lesson || !user) return;

    setIsComplete(true);
    setShowConfetti(true);
    setMonkeyMood('celebrating');

    const finalXp = xpEarned + (lesson.xp_reward || 0);
    const isPerfect = mistakes === 0;

    try {
      // Record completion
      await supabase.from('lesson_completions').insert({
        user_id: user.id,
        lesson_id: lesson.id,
        xp_earned: finalXp,
        mistakes,
        perfect_score: isPerfect,
      });

      // Update progress
      await updateProgress({
        total_xp: (progress?.total_xp || 0) + finalXp,
        today_xp: (progress?.today_xp || 0) + finalXp,
        lives,
      });

      await refetch();
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleWordBankClick = (word: string, fromAnswer: boolean) => {
    if (fromAnswer) {
      setWordBankAnswer(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);
    } else {
      setAvailableWords(prev => prev.filter(w => w !== word));
      setWordBankAnswer(prev => [...prev, word]);
    }
  };

  const getMatchPairs = useCallback((options: unknown): Array<{ left: string; right: string }> => {
    const opts = options as unknown as { pairs?: Array<{ left: string; right: string }> } | Array<{ left: string; right: string }>;
    if (opts && typeof opts === 'object' && 'pairs' in opts && Array.isArray((opts as any).pairs)) {
      return ((opts as any).pairs as Array<{ left: string; right: string }>).filter((p) => p?.left && p?.right);
    }
    if (Array.isArray(opts)) return opts.filter((p) => p?.left && p?.right);
    return [];
  }, []);

  const handleMatchClick = (item: string) => {
    if (!currentExercise) return;
    if (matchedPairs.has(item)) return;

    const pairs = getMatchPairs(currentExercise.options);
    if (!pairs.length) return;

    if (!selectedMatch) {
      setSelectedMatch(item);
      return;
    }

    const first = selectedMatch;
    const second = item;

    const pair = pairs.find(
      (p) => (p.left === first && p.right === second) || (p.right === first && p.left === second)
    );

    if (pair) {
      // mark both items as matched
      setMatchedPairs((prev) => new Set([...prev, pair.left, pair.right]));

      const nextSize = matchedPairs.size + 2;
      if (nextSize === pairs.length * 2) {
        // All matched
        setIsChecked(true);
        setIsCorrect(true);
        setXpEarned((prev) => prev + 10);
        setMonkeyMood('excited');
        playSound('correct');
      }
    } else {
      setLives((prev) => prev - 1);
      setMistakes((prev) => prev + 1);
      playSound('incorrect');
    }

    setSelectedMatch(null);
  };

  const speakText = useCallback((text: string) => {
    const langCode = activeCourse?.language_code || 'es';
    void speak(text, langCode, {
      rate: 0.9,
      engine: appSettings.ttsEngine,
      voiceURI: appSettings.ttsVoiceURI,
    });
  }, [activeCourse?.language_code, appSettings.ttsEngine, appSettings.ttsVoiceURI]);

  const handleSpeechResult = (correct: boolean, transcript: string, accuracy: number) => {
    setSpeechResult({ correct, transcript, accuracy });
    setIsChecked(true);
    setIsCorrect(correct);
    
    if (correct) {
      setXpEarned(prev => prev + 10);
      setMonkeyMood('excited');
      playSound('correct');
    } else {
      setLives(prev => prev - 1);
      setMistakes(prev => prev + 1);
      setMonkeyMood('sad');
      playSound('incorrect');
    }
  };

  const handleExit = () => {
    navigate('/learn');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-banana/10 to-background flex flex-col items-center justify-center p-6">
        {showConfetti && <Confetti trigger={showConfetti} bananaTheme />}
        <MonkeyMascot mood="celebrating" size="xl" animate className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">Lesson Complete!</h1>
        <p className="text-muted-foreground mb-8">Great job finishing the lesson</p>
        
        <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-xp">{xpEarned + (lesson?.xp_reward || 0)}</p>
              <p className="text-sm text-muted-foreground">XP Earned</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">{Math.round(((exercises.length - mistakes) / exercises.length) * 100)}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>
          {mistakes === 0 && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                ⭐ Perfect Score!
              </span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => navigate('/learn')} 
          className="w-full max-w-sm h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
        >
          Continue
        </Button>
      </div>
    );
  }

  if (lives <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-banana/10 to-background flex flex-col items-center justify-center p-6">
        <MonkeyMascot mood="sad" size="xl" animate className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">Out of Hearts!</h1>
        <p className="text-muted-foreground mb-8">Practice more or wait for hearts to regenerate</p>
        
        <div className="space-y-3 w-full max-w-sm">
          <Button 
            onClick={() => navigate('/review')} 
            className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
          >
            Practice to Earn Hearts
          </Button>
          <Button 
            onClick={() => navigate('/shop')} 
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-2xl"
          >
            Refill Hearts
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
          <button onClick={handleExit} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
          <ProgressBar 
            value={currentIndex + 1} 
            max={exercises.length} 
            variant="primary" 
            size="md"
            className="flex-1"
          />
          <div className="flex items-center gap-1 text-heart">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-bold">{lives}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
        {currentExercise && (
          <>
            {/* Exercise Type Label */}
            <p className="text-sm text-muted-foreground mb-2 capitalize">
              {currentExercise.exercise_type.replace('_', ' ')}
            </p>

            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <MonkeyMascot mood={monkeyMood} size="sm" />
                <div className="bg-card rounded-2xl p-4 shadow-sm flex-1">
                  <p className="text-lg font-semibold">{currentExercise.question}</p>
                  {currentExercise.hint && !isChecked && (
                    <p className="text-sm text-muted-foreground mt-1">💡 {currentExercise.hint}</p>
                  )}
                </div>
              </div>
              
              {/* Audio button (plays the answer in the target language) */}
              {currentExercise.exercise_type !== 'speak_answer' && (
                <button
                  onClick={() => speakText(currentExercise.correct_answer)}
                  className="mt-4 w-full bg-primary/10 hover:bg-primary/20 rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors"
                >
                  <Volume2 className="w-6 h-6 text-primary" />
                  <span className="font-medium text-primary">Listen</span>
                </button>
              )}
            </div>

            {/* Answer Area */}
            <div className="flex-1 space-y-3">
              {/* Multiple Choice / Select Sentence */}
              {(currentExercise.exercise_type === 'multiple_choice' || 
                currentExercise.exercise_type === 'select_sentence') && 
                currentExercise.options && (
                <div className="space-y-3">
                  {normalizeOptions(currentExercise.options).map((optionText, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (isChecked) return;
                        setSelectedAnswer(optionText);
                        speakText(optionText);
                      }}
                      disabled={isChecked}
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 text-left transition-all',
                        selectedAnswer === optionText && !isChecked && 'border-primary bg-primary/10',
                        isChecked && optionText.toLowerCase() === currentExercise.correct_answer.toLowerCase() && 'border-success bg-success/10',
                        isChecked && selectedAnswer === optionText && !isCorrect && 'border-destructive bg-destructive/10',
                        !selectedAnswer && !isChecked && 'border-border hover:border-primary/50',
                        isChecked && selectedAnswer !== optionText && optionText.toLowerCase() !== currentExercise.correct_answer.toLowerCase() && 'opacity-50'
                      )}
                    >
                      {optionText}
                    </button>
                  ))}
                </div>
              )}

              {/* Translation / Fill Blank / Type What You Hear - with word bank option */}
              {(currentExercise.exercise_type === 'translation' || 
                currentExercise.exercise_type === 'fill_blank' ||
                currentExercise.exercise_type === 'type_what_you_hear') && (() => {
                const providedHints = currentExercise.options
                  ? normalizeOptions(currentExercise.options).filter(o => o.trim())
                  : [];
                const wordHints = (providedHints.length > 0
                  ? providedHints
                  : generateWordBankWords(currentExercise.correct_answer, null)
                ).filter(w => w.trim());
                const hasWordBank = wordHints.length > 0;
                return (
                  <div className="space-y-4">
                    {/* Answer input */}
                    <input
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      disabled={isChecked}
                      placeholder="Type your answer..."
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 bg-card text-lg',
                        isChecked && isCorrect && 'border-success bg-success/10',
                        isChecked && !isCorrect && 'border-destructive bg-destructive/10',
                        !isChecked && 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                      )}
                    />
                    
                    {/* Word bank hints for easier translation */}
                    {hasWordBank && !isChecked && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Tap words to help build your answer:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {wordHints.map((word, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                speakText(word);
                                setTypedAnswer((prev) => (prev ? `${prev} ${word}` : word));
                              }}
                              className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                            >
                              {word}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Accent keyboard for special characters */}
                    {!isChecked && currentExercise.exercise_type === 'translation' && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map((char) => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => setTypedAnswer(prev => prev + char)}
                            className="w-9 h-9 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {isChecked && !isCorrect && (
                      <p className="text-sm text-muted-foreground">
                        Correct answer: <span className="text-success font-medium">{currentExercise.correct_answer}</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Word Bank */}
              {currentExercise.exercise_type === 'word_bank' && (
                <div className="space-y-6">
                  {/* Answer area */}
                  <div className={cn(
                    'min-h-16 p-4 rounded-2xl border-2 border-dashed flex flex-wrap gap-2',
                    isChecked && isCorrect && 'border-success bg-success/10',
                    isChecked && !isCorrect && 'border-destructive bg-destructive/10',
                    !isChecked && 'border-border'
                  )}>
                    {wordBankAnswer.length === 0 && (
                      <span className="text-muted-foreground">Tap words to build your answer</span>
                    )}
                      {wordBankAnswer.map((word, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (isChecked) return;
                            speakText(word);
                            handleWordBankClick(word, true);
                          }}
                          disabled={isChecked}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
                        >
                          {word}
                        </button>
                      ))}
                  </div>

                  {/* Available words */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableWords.map((word, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (isChecked) return;
                          speakText(word);
                          handleWordBankClick(word, false);
                        }}
                        disabled={isChecked}
                        className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>

                  {isChecked && !isCorrect && (
                    <p className="text-sm text-muted-foreground text-center">
                      Correct answer: <span className="text-success font-medium">{currentExercise.correct_answer}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Match Pairs */}
              {currentExercise.exercise_type === 'match_pairs' && currentExercise.options && (() => {
                // Handle both direct array and {pairs: [...]} formats
                const opts = currentExercise.options as unknown as { pairs?: Array<{left: string; right: string}> } | Array<{left: string; right: string}>;
                const pairs: Array<{left: string; right: string}> = 'pairs' in opts && Array.isArray(opts.pairs) ? opts.pairs : Array.isArray(opts) ? opts : [];
                if (pairs.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {pairs.map((pair, i) => (
                        <button
                          key={`left-${i}`}
                          onClick={() => !matchedPairs.has(pair.left) && handleMatchClick(pair.left)}
                          disabled={matchedPairs.has(pair.left)}
                          className={cn(
                            'w-full p-4 rounded-xl border-2 transition-all',
                            matchedPairs.has(pair.left) && 'bg-success/10 border-success opacity-50',
                            selectedMatch === pair.left && 'border-primary bg-primary/10',
                            !matchedPairs.has(pair.left) && selectedMatch !== pair.left && 'border-border hover:border-primary/50'
                          )}
                        >
                          {pair.left}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {shuffleArray(pairs).map((pair, i) => (
                        <button
                          key={`right-${i}`}
                           onClick={() => !matchedPairs.has(pair.right) && handleMatchClick(pair.right)}
                           disabled={matchedPairs.has(pair.right)}
                          className={cn(
                            'w-full p-4 rounded-xl border-2 transition-all',
                            matchedPairs.has(pair.right) && 'bg-success/10 border-success opacity-50',
                            selectedMatch === pair.right && 'border-primary bg-primary/10',
                            !matchedPairs.has(pair.right) && selectedMatch !== pair.right && 'border-border hover:border-primary/50'
                          )}
                        >
                          {pair.right}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Speak Answer */}
              {currentExercise.exercise_type === 'speak_answer' && (
                <SpeechExercise
                  targetPhrase={currentExercise.correct_answer}
                  languageCode={activeCourse?.language_code || 'es'}
                  onResult={handleSpeechResult}
                  disabled={isChecked}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          {!isChecked && currentExercise?.exercise_type !== 'speak_answer' ? (
            <Button
              onClick={checkAnswer}
              disabled={
                (currentExercise?.exercise_type === 'multiple_choice' && !selectedAnswer) ||
                (currentExercise?.exercise_type === 'select_sentence' && !selectedAnswer) ||
                (currentExercise?.exercise_type === 'translation' && !typedAnswer) ||
                (currentExercise?.exercise_type === 'fill_blank' && !typedAnswer) ||
                (currentExercise?.exercise_type === 'type_what_you_hear' && !typedAnswer) ||
                (currentExercise?.exercise_type === 'word_bank' && wordBankAnswer.length === 0)
              }
              className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
            >
              Check
            </Button>
          ) : isChecked ? (
            <div className="space-y-3">
              <div className={cn(
                'p-4 rounded-2xl text-center',
                isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}>
                <p className="font-bold text-lg">
                  {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
                </p>
              </div>
              <Button
                onClick={nextExercise}
                className={cn(
                  'w-full h-14 text-lg font-bold rounded-2xl',
                  isCorrect ? 'gradient-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                )}
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
};

export default LessonPage;
