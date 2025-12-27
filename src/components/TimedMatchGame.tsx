import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, Zap, Trophy, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';

interface MatchPair {
  left: string;
  right: string;
}

interface TimedMatchGameProps {
  pairs: MatchPair[];
  languageCode: string;
  onComplete: (score: number, timeRemaining: number, perfectRun: boolean) => void;
  timeLimit?: number; // seconds
  disabled?: boolean;
}

const TimedMatchGame: React.FC<TimedMatchGameProps> = ({
  pairs,
  languageCode,
  onComplete,
  timeLimit = 30,
  disabled = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isStarted, setIsStarted] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledLeft, setShuffledLeft] = useState<MatchPair[]>([]);
  const [shuffledRight, setShuffledRight] = useState<MatchPair[]>([]);
  const [flashCorrect, setFlashCorrect] = useState<string | null>(null);
  const [flashIncorrect, setFlashIncorrect] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Shuffle pairs on mount
  useEffect(() => {
    setShuffledLeft([...pairs].sort(() => Math.random() - 0.5));
    setShuffledRight([...pairs].sort(() => Math.random() - 0.5));
  }, [pairs]);

  // Timer logic
  useEffect(() => {
    if (!isStarted || disabled) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onComplete(score, 0, mistakes === 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, disabled, score, mistakes, onComplete]);

  // Check for game completion
  useEffect(() => {
    if (isStarted && matchedPairs.size === pairs.length * 2) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Bonus points for time remaining
      const timeBonus = Math.floor(timeRemaining * 2);
      const finalScore = score + timeBonus;
      
      setTimeout(() => {
        onComplete(finalScore, timeRemaining, mistakes === 0);
      }, 500);
    }
  }, [matchedPairs.size, pairs.length, isStarted, score, timeRemaining, mistakes, onComplete]);

  const speakWord = useCallback((text: string) => {
    speak(text, languageCode, { rate: 0.9 });
  }, [languageCode]);

  const handleItemClick = useCallback((item: string, side: 'left' | 'right') => {
    if (disabled || matchedPairs.has(item) || !isStarted) return;

    speakWord(item);

    if (!selectedItem) {
      setSelectedItem(item);
      return;
    }

    // Check if it's a match
    const isMatch = pairs.some(
      (p) =>
        (p.left === selectedItem && p.right === item) ||
        (p.right === selectedItem && p.left === item)
    );

    if (isMatch) {
      const matchedPair = pairs.find(
        (p) =>
          (p.left === selectedItem && p.right === item) ||
          (p.right === selectedItem && p.left === item)
      );
      
      if (matchedPair) {
        setMatchedPairs((prev) => new Set([...prev, matchedPair.left, matchedPair.right]));
        setFlashCorrect(item);
        setTimeout(() => setFlashCorrect(null), 300);
        
        // Score with streak bonus
        const streakBonus = Math.min(streak, 4);
        const pointsEarned = 10 + streakBonus * 5;
        setScore((prev) => prev + pointsEarned);
        setStreak((prev) => prev + 1);
      }
    } else {
      setFlashIncorrect(item);
      setTimeout(() => setFlashIncorrect(null), 300);
      setMistakes((prev) => prev + 1);
      setStreak(0);
    }

    setSelectedItem(null);
  }, [disabled, matchedPairs, isStarted, selectedItem, pairs, speakWord, streak]);

  const startGame = () => {
    setIsStarted(true);
    setTimeRemaining(timeLimit);
    setMatchedPairs(new Set());
    setSelectedItem(null);
    setMistakes(0);
    setStreak(0);
    setScore(0);
    setShuffledLeft([...pairs].sort(() => Math.random() - 0.5));
    setShuffledRight([...pairs].sort(() => Math.random() - 0.5));
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsStarted(false);
    setTimeRemaining(timeLimit);
    setMatchedPairs(new Set());
    setSelectedItem(null);
    setMistakes(0);
    setStreak(0);
    setScore(0);
  };

  if (!isStarted) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Match Race!</h3>
        <p className="text-muted-foreground text-sm">
          Match the pairs as fast as you can! Build streaks for bonus points.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <Timer className="w-4 h-4" />
          <span>{timeLimit} seconds</span>
        </div>
        <Button onClick={startGame} className="w-full gradient-primary text-primary-foreground">
          Start Race!
        </Button>
      </div>
    );
  }

  const timePercent = (timeRemaining / timeLimit) * 100;
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-xp" />
          <span className="font-bold">{score}</span>
        </div>
        
        {streak > 1 && (
          <div className="flex items-center gap-1 text-primary animate-pulse">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">{streak}x Streak!</span>
          </div>
        )}
        
        <div className={cn(
          "flex items-center gap-2",
          isLowTime && "text-destructive animate-pulse"
        )}>
          <Timer className="w-4 h-4" />
          <span className="font-bold tabular-nums">{timeRemaining}s</span>
        </div>
      </div>

      {/* Timer progress */}
      <Progress 
        value={timePercent} 
        className={cn(
          "h-2",
          isLowTime && "[&>div]:bg-destructive"
        )}
      />

      {/* Match grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {shuffledLeft.map((pair, i) => (
            <button
              key={`left-${i}`}
              onClick={() => handleItemClick(pair.left, 'left')}
              disabled={matchedPairs.has(pair.left)}
              className={cn(
                'w-full p-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-between gap-2',
                matchedPairs.has(pair.left) && 'bg-success/20 border-success/50 opacity-60',
                selectedItem === pair.left && 'border-primary bg-primary/10 scale-105',
                flashCorrect === pair.left && 'bg-success/30 border-success animate-pulse',
                flashIncorrect === pair.left && 'bg-destructive/30 border-destructive animate-shake',
                !matchedPairs.has(pair.left) && selectedItem !== pair.left && 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span>{pair.left}</span>
              <Volume2 className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledRight.map((pair, i) => (
            <button
              key={`right-${i}`}
              onClick={() => handleItemClick(pair.right, 'right')}
              disabled={matchedPairs.has(pair.right)}
              className={cn(
                'w-full p-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-between gap-2',
                matchedPairs.has(pair.right) && 'bg-success/20 border-success/50 opacity-60',
                selectedItem === pair.right && 'border-primary bg-primary/10 scale-105',
                flashCorrect === pair.right && 'bg-success/30 border-success animate-pulse',
                flashIncorrect === pair.right && 'bg-destructive/30 border-destructive animate-shake',
                !matchedPairs.has(pair.right) && selectedItem !== pair.right && 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span>{pair.right}</span>
              <Volume2 className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <Button variant="ghost" size="sm" onClick={resetGame} className="w-full gap-2">
        <RotateCcw className="w-4 h-4" />
        Restart
      </Button>
    </div>
  );
};

export default TimedMatchGame;
