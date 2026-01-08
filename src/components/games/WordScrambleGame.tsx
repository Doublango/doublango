import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, Trophy, Star, Sparkles, RotateCcw, Lightbulb, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { playSound, playKidsSound } from '@/lib/gameSounds';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface WordScrambleProps {
  words: Array<{ word: string; translation: string; hint?: string }>;
  languageCode: string;
  onComplete: (score: number, perfectWords: number) => void;
  timeLimit?: number;
}

const WordScrambleGame: React.FC<WordScrambleProps> = ({
  words,
  languageCode,
  onComplete,
  timeLimit = 60,
}) => {
  const { settings } = useAppSettings();
  const sound = settings.kidsMode ? playKidsSound : playSound;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [perfectWords, setPerfectWords] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  const currentWord = words[currentIndex];

  const scrambleWord = useCallback((word: string) => {
    const letters = word.toUpperCase().split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Make sure it's actually scrambled
    if (letters.join('') === word.toUpperCase()) {
      [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
    }
    return letters;
  }, []);

  useEffect(() => {
    if (currentWord) {
      setScrambledLetters(scrambleWord(currentWord.word));
      setSelectedLetters([]);
      setIsCorrect(null);
      setShowHint(false);
    }
  }, [currentWord, scrambleWord]);

  // Timer
  useEffect(() => {
    if (!isStarted || isComplete) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          sound('gameComplete');
          onComplete(score, perfectWords);
          return 0;
        }
        if (prev <= 10) sound('tick');
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isComplete, score, perfectWords, onComplete, sound]);

  const userAnswer = useMemo(() => 
    selectedLetters.map(i => scrambledLetters[i]).join(''),
    [selectedLetters, scrambledLetters]
  );

  const handleLetterClick = useCallback((index: number) => {
    if (selectedLetters.includes(index) || isCorrect !== null) return;
    
    sound('pop');
    setSelectedLetters(prev => [...prev, index]);
  }, [selectedLetters, isCorrect, sound]);

  const handleRemoveLetter = useCallback((selectedIndex: number) => {
    if (isCorrect !== null) return;
    sound('click');
    setSelectedLetters(prev => prev.filter((_, i) => i !== selectedIndex));
  }, [isCorrect, sound]);

  const checkAnswer = useCallback(() => {
    if (!currentWord) return;

    const correct = userAnswer === currentWord.word.toUpperCase();
    setIsCorrect(correct);

    if (correct) {
      sound('correct');
      const timeBonus = Math.floor(timeRemaining / 10);
      const hintPenalty = hintsUsed > 0 ? 5 : 0;
      const points = 20 + timeBonus - hintPenalty;
      setScore(prev => prev + points);
      if (!showHint) setPerfectWords(prev => prev + 1);
    } else {
      sound('incorrect');
    }
  }, [currentWord, userAnswer, timeRemaining, hintsUsed, showHint, sound]);

  const nextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      sound('gameComplete');
      onComplete(score, perfectWords);
    }
  }, [currentIndex, words.length, score, perfectWords, onComplete, sound]);

  const useHint = useCallback(() => {
    if (!currentWord || showHint) return;
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
    sound('chime');
  }, [currentWord, showHint, sound]);

  const startGame = useCallback(() => {
    setIsStarted(true);
    setTimeRemaining(timeLimit);
    sound('gameStart');
  }, [timeLimit, sound]);

  const speakWord = useCallback(() => {
    if (currentWord) {
      speak(currentWord.word, languageCode, { rate: 0.8 });
      sound('pop');
    }
  }, [currentWord, languageCode, sound]);

  if (!isStarted) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold">Word Scramble</h3>
        <p className="text-muted-foreground text-sm">
          Unscramble the letters to form the correct word!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <Timer className="w-4 h-4" />
          <span>{timeLimit} seconds</span>
        </div>
        <Button onClick={startGame} className="w-full gradient-primary text-primary-foreground">
          Start Game
        </Button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold">Game Complete!</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-xp">{score}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{perfectWords}</p>
            <p className="text-xs text-muted-foreground">Perfect</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-6 h-6",
                i < Math.ceil((score / (words.length * 25)) * 5) ? "text-xp fill-xp" : "text-muted"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  const timePercent = (timeRemaining / timeLimit) * 100;
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{currentIndex + 1}/{words.length}</span>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-xp" />
          <span className="font-bold">{score}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1",
          isLowTime && "text-destructive animate-pulse"
        )}>
          <Timer className="w-4 h-4" />
          <span className="font-bold tabular-nums">{timeRemaining}s</span>
        </div>
      </div>

      <Progress 
        value={timePercent} 
        className={cn("h-2", isLowTime && "[&>div]:bg-destructive")} 
      />

      {/* Translation hint */}
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Translate:</p>
        <p className="font-bold text-lg">{currentWord.translation}</p>
        {showHint && currentWord.hint && (
          <p className="text-xs text-muted-foreground mt-2 italic">💡 {currentWord.hint}</p>
        )}
      </div>

      {/* Selected letters (answer) */}
      <div className="min-h-[60px] bg-card rounded-xl border-2 border-dashed border-border p-3 flex items-center justify-center gap-1 flex-wrap">
        {selectedLetters.length === 0 ? (
          <span className="text-muted-foreground text-sm">Tap letters to build the word</span>
        ) : (
          selectedLetters.map((letterIndex, i) => (
            <button
              key={i}
              onClick={() => handleRemoveLetter(i)}
              className={cn(
                "w-10 h-10 rounded-lg font-bold text-lg flex items-center justify-center transition-all",
                isCorrect === true && "bg-success text-success-foreground",
                isCorrect === false && "bg-destructive text-destructive-foreground",
                isCorrect === null && "bg-primary text-primary-foreground hover:scale-110",
                settings.kidsMode && "w-12 h-12 text-xl"
              )}
            >
              {scrambledLetters[letterIndex]}
            </button>
          ))
        )}
      </div>

      {/* Scrambled letters */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {scrambledLetters.map((letter, i) => (
          <button
            key={i}
            onClick={() => handleLetterClick(i)}
            disabled={selectedLetters.includes(i) || isCorrect !== null}
            className={cn(
              "w-12 h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-all",
              selectedLetters.includes(i) 
                ? "bg-muted/30 text-muted-foreground opacity-30" 
                : "bg-card border-2 border-border hover:border-primary hover:scale-110 shadow-sm",
              settings.kidsMode && "w-14 h-14 text-2xl"
            )}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Audio & Hint buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={speakWord} className="gap-2">
          <Volume2 className="w-4 h-4" />
          Listen
        </Button>
        {!showHint && currentWord.hint && (
          <Button variant="ghost" size="sm" onClick={useHint} className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Hint
          </Button>
        )}
      </div>

      {/* Check / Next buttons */}
      {isCorrect === null ? (
        <Button 
          onClick={checkAnswer}
          disabled={selectedLetters.length !== scrambledLetters.length}
          className="w-full gradient-primary text-primary-foreground"
        >
          Check Answer
        </Button>
      ) : (
        <div className="space-y-2">
          <div className={cn(
            "rounded-xl p-3 text-center",
            isCorrect ? "bg-success/10" : "bg-destructive/10"
          )}>
            <p className={cn(
              "font-bold",
              isCorrect ? "text-success" : "text-destructive"
            )}>
              {isCorrect ? '🎉 Correct!' : `✗ It was: ${currentWord.word.toUpperCase()}`}
            </p>
          </div>
          <Button onClick={nextWord} className="w-full">
            {currentIndex < words.length - 1 ? 'Next Word' : 'Finish'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WordScrambleGame;
