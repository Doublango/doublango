import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, Check, X, RotateCcw, Sparkles, Star, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { playSound, playKidsSound } from '@/lib/gameSounds';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface FlashCard {
  front: string;
  back: string;
  hint?: string;
}

interface FlashCardGameProps {
  cards: FlashCard[];
  languageCode: string;
  onComplete: (knownCount: number, totalCards: number, masteredCards: FlashCard[]) => void;
  title?: string;
}

const FlashCardGame: React.FC<FlashCardGameProps> = ({
  cards,
  languageCode,
  onComplete,
  title = 'Flash Cards',
}) => {
  const { settings } = useAppSettings();
  const sound = settings.kidsMode ? playKidsSound : playSound;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<FlashCard[]>([]);

  useEffect(() => {
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
  }, [cards]);

  const currentCard = shuffledCards[currentIndex];
  const progressPercent = ((knownCards.size + unknownCards.size) / shuffledCards.length) * 100;

  const speakText = useCallback((text: string) => {
    speak(text, languageCode, { rate: 0.85 });
    sound('pop');
  }, [languageCode, sound]);

  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
    sound('whoosh');
    if (!isFlipped && currentCard) {
      setTimeout(() => speakText(currentCard.back), 200);
    }
  }, [isFlipped, currentCard, speakText, sound]);

  const handleKnown = useCallback(() => {
    setKnownCards(prev => new Set([...prev, currentIndex]));
    sound('correct');
    nextCard();
  }, [currentIndex, sound]);

  const handleUnknown = useCallback(() => {
    setUnknownCards(prev => new Set([...prev, currentIndex]));
    sound('incorrect');
    nextCard();
  }, [currentIndex, sound]);

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      sound('gameComplete');
      const masteredCards = shuffledCards.filter((_, i) => knownCards.has(i));
      onComplete(knownCards.size, shuffledCards.length, masteredCards);
    }
  }, [currentIndex, shuffledCards.length, knownCards, shuffledCards, onComplete, sound]);

  const resetGame = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setIsComplete(false);
    setShowHint(false);
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
    sound('gameStart');
  }, [cards, sound]);

  if (isComplete) {
    const accuracy = Math.round((knownCards.size / shuffledCards.length) * 100);
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold">{title} Complete!</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-success">{knownCards.size}</p>
            <p className="text-xs text-muted-foreground">Knew It</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-destructive">{unknownCards.size}</p>
            <p className="text-xs text-muted-foreground">Learning</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-6 h-6 transition-all",
                i < Math.ceil(accuracy / 20) ? "text-xp fill-xp" : "text-muted"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{accuracy}% mastery</p>
        <Button onClick={resetGame} className="w-full gap-2">
          <RotateCcw className="w-4 h-4" />
          Practice Again
        </Button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{currentIndex + 1} / {shuffledCards.length}</span>
        <div className="flex items-center gap-2">
          <span className="text-success font-medium">{knownCards.size} ✓</span>
          <span className="text-destructive font-medium">{unknownCards.size} ✗</span>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* Flash Card */}
      <div 
        onClick={flipCard}
        className={cn(
          "relative min-h-[220px] rounded-2xl cursor-pointer transition-all duration-500 transform-gpu",
          "flex items-center justify-center p-6",
          isFlipped 
            ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30" 
            : "bg-card border-2 border-border shadow-lg hover:shadow-xl",
          settings.kidsMode && "min-h-[260px]"
        )}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="text-center">
          <p className={cn(
            "font-bold mb-2",
            settings.kidsMode ? "text-3xl" : "text-2xl"
          )}>
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
          <p className="text-xs text-muted-foreground">
            {isFlipped ? 'Translation' : 'Tap to flip'}
          </p>
        </div>

        {/* Audio button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            speakText(isFlipped ? currentCard.back : currentCard.front);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Hint toggle */}
        {currentCard.hint && !isFlipped && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Hint display */}
        {showHint && currentCard.hint && !isFlipped && (
          <div className="absolute bottom-3 left-3 right-12 text-xs text-muted-foreground italic">
            💡 {currentCard.hint}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isFlipped && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <Button
            variant="outline"
            onClick={handleUnknown}
            className="h-14 gap-2 border-destructive/30 hover:bg-destructive/10"
          >
            <X className="w-5 h-5 text-destructive" />
            <span>Still Learning</span>
          </Button>
          <Button
            onClick={handleKnown}
            className="h-14 gap-2 gradient-success text-success-foreground"
          >
            <Check className="w-5 h-5" />
            <span>Got It!</span>
          </Button>
        </div>
      )}

      {!isFlipped && (
        <p className="text-center text-sm text-muted-foreground">
          👆 Tap the card to reveal the answer
        </p>
      )}
    </div>
  );
};

export default FlashCardGame;
