import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Timer, RotateCcw, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { playSound, playKidsSound } from '@/lib/gameSounds';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface MemoryPair {
  word: string;
  translation: string;
}

interface MemoryGameProps {
  pairs: MemoryPair[];
  languageCode: string;
  onComplete: (score: number, moves: number, time: number) => void;
}

interface Card {
  id: number;
  content: string;
  pairId: number;
  isWord: boolean;
}

const MemoryGame: React.FC<MemoryGameProps> = ({
  pairs,
  languageCode,
  onComplete,
}) => {
  const { settings } = useAppSettings();
  const sound = settings.kidsMode ? playKidsSound : playSound;

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize cards
  useEffect(() => {
    const gameCards: Card[] = [];
    pairs.forEach((pair, index) => {
      gameCards.push({ id: index * 2, content: pair.word, pairId: index, isWord: true });
      gameCards.push({ id: index * 2 + 1, content: pair.translation, pairId: index, isWord: false });
    });
    // Shuffle
    setCards(gameCards.sort(() => Math.random() - 0.5));
  }, [pairs]);

  // Timer
  useEffect(() => {
    if (!isStarted || isComplete) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isComplete]);

  // Check for completion
  useEffect(() => {
    if (isStarted && matchedPairs.size === pairs.length) {
      setIsComplete(true);
      sound('gameComplete');
      const score = Math.max(100 - moves * 2 - Math.floor(timeElapsed / 5), 10);
      onComplete(score, moves, timeElapsed);
    }
  }, [matchedPairs.size, pairs.length, isStarted, moves, timeElapsed, onComplete, sound]);

  const handleCardClick = useCallback((cardId: number) => {
    if (!isStarted || isProcessing || flippedCards.includes(cardId)) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || matchedPairs.has(card.pairId)) return;

    sound('pop');

    // Speak the word if it's in the target language
    if (card.isWord) {
      speak(card.content, languageCode, { rate: 0.9 });
    }

    if (flippedCards.length === 0) {
      setFlippedCards([cardId]);
    } else if (flippedCards.length === 1) {
      setFlippedCards([...flippedCards, cardId]);
      setMoves(prev => prev + 1);
      setIsProcessing(true);

      // Check for match
      const firstCard = cards.find(c => c.id === flippedCards[0]);
      const secondCard = card;

      setTimeout(() => {
        if (firstCard && firstCard.pairId === secondCard.pairId) {
          sound('match');
          setMatchedPairs(prev => new Set([...prev, firstCard.pairId]));
        } else {
          sound('incorrect');
        }
        setFlippedCards([]);
        setIsProcessing(false);
      }, 1000);
    }
  }, [isStarted, isProcessing, flippedCards, cards, matchedPairs, languageCode, sound]);

  const startGame = useCallback(() => {
    setIsStarted(true);
    setTimeElapsed(0);
    setMoves(0);
    setMatchedPairs(new Set());
    setFlippedCards([]);
    sound('gameStart');
  }, [sound]);

  const resetGame = useCallback(() => {
    setIsStarted(false);
    setIsComplete(false);
    setTimeElapsed(0);
    setMoves(0);
    setMatchedPairs(new Set());
    setFlippedCards([]);
    setCards([...cards].sort(() => Math.random() - 0.5));
  }, [cards]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-xl font-bold">Memory Match</h3>
        <p className="text-muted-foreground text-sm">
          Match words with their translations! Flip cards to find pairs.
        </p>
        <div className="text-sm text-muted-foreground">
          {pairs.length} pairs to match
        </div>
        <Button onClick={startGame} className="w-full gradient-primary text-primary-foreground">
          Start Game
        </Button>
      </div>
    );
  }

  if (isComplete) {
    const score = Math.max(100 - moves * 2 - Math.floor(timeElapsed / 5), 10);
    const stars = score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;

    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold">Congratulations!</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-xp">{score}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <div>
            <p className="text-xl font-bold">{moves}</p>
            <p className="text-xs text-muted-foreground">Moves</p>
          </div>
          <div>
            <p className="text-xl font-bold">{formatTime(timeElapsed)}</p>
            <p className="text-xs text-muted-foreground">Time</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-6 h-6",
                i < stars ? "text-xp fill-xp" : "text-muted"
              )}
            />
          ))}
        </div>
        <Button onClick={resetGame} className="w-full gap-2">
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-xp" />
          <span className="font-bold">{matchedPairs.size}/{pairs.length}</span>
        </div>
        <span className="text-muted-foreground">Moves: {moves}</span>
        <div className="flex items-center gap-1">
          <Timer className="w-4 h-4" />
          <span className="font-bold tabular-nums">{formatTime(timeElapsed)}</span>
        </div>
      </div>

      {/* Card Grid */}
      <div className={cn(
        "grid gap-2",
        pairs.length <= 4 ? "grid-cols-4" : "grid-cols-4",
        settings.kidsMode && "gap-3"
      )}>
        {cards.map((card) => {
          const isFlipped = flippedCards.includes(card.id);
          const isMatched = matchedPairs.has(card.pairId);

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={isMatched || isProcessing}
              className={cn(
                "aspect-square rounded-xl font-medium text-xs p-1 transition-all transform-gpu",
                "flex items-center justify-center",
                isMatched && "bg-success/20 border-2 border-success opacity-60",
                isFlipped && !isMatched && "bg-primary text-primary-foreground scale-105",
                !isFlipped && !isMatched && "bg-card border-2 border-border hover:border-primary shadow-sm hover:shadow-md",
                settings.kidsMode && "text-sm"
              )}
              style={{ minHeight: settings.kidsMode ? '70px' : '60px' }}
            >
              {(isFlipped || isMatched) ? (
                <span className="line-clamp-2 text-center">{card.content}</span>
              ) : (
                <span className="text-2xl">❓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reset button */}
      <Button variant="ghost" size="sm" onClick={resetGame} className="w-full gap-2">
        <RotateCcw className="w-4 h-4" />
        Restart
      </Button>
    </div>
  );
};

export default MemoryGame;
