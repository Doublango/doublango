import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, Star, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { playKidsSound } from '@/lib/gameSounds';

interface ColorWord {
  color: string; // CSS color
  english: string;
  translation: string;
}

interface KidsColorGameProps {
  colors: ColorWord[];
  languageCode: string;
  onComplete: (score: number, hearts: number) => void;
}

const KidsColorGame: React.FC<KidsColorGameProps> = ({
  colors,
  languageCode,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [colorOptions, setColorOptions] = useState<ColorWord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [isComplete, setIsComplete] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const currentColor = colors[currentIndex];
  const progress = ((currentIndex + 1) / colors.length) * 100;

  // Generate color options
  useEffect(() => {
    if (!currentColor) return;

    const wrongOptions = colors
      .filter(c => c.color !== currentColor.color)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [currentColor, ...wrongOptions].sort(() => Math.random() - 0.5);
    setColorOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [currentIndex, colors, currentColor]);

  const speakWord = useCallback((text: string) => {
    speak(text, languageCode, { rate: 0.6 });
    playKidsSound('pop');
  }, [languageCode]);

  const handleColorClick = useCallback((color: ColorWord) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(color.color);
    const correct = color.color === currentColor.color;
    setIsCorrect(correct);

    if (correct) {
      playKidsSound('correct');
      setScore(prev => prev + 10);
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    } else {
      playKidsSound('incorrect');
      setHearts(prev => Math.max(0, prev - 1));
    }

    speakWord(currentColor.translation);
  }, [selectedAnswer, currentColor, speakWord]);

  const nextColor = useCallback(() => {
    if (hearts === 0 || currentIndex >= colors.length - 1) {
      setIsComplete(true);
      playKidsSound('gameComplete');
      onComplete(score, hearts);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, colors.length, hearts, score, onComplete]);

  if (isComplete) {
    return (
      <div className="bg-card rounded-3xl p-8 text-center space-y-6">
        <div className="text-6xl animate-bounce">🎨</div>
        <h3 className="text-2xl font-bold text-primary">Wonderful!</h3>
        <div className="flex items-center justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "w-10 h-10 transition-all",
                i < hearts ? "text-heart fill-heart" : "text-muted"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-1">
          <Star className="w-8 h-8 text-xp fill-xp" />
          <span className="text-3xl font-bold">{score}</span>
        </div>
        <p className="text-lg">You learned {colors.length} colors! 🌈</p>
      </div>
    );
  }

  if (!currentColor) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "w-7 h-7 transition-all",
                i < hearts ? "text-heart fill-heart" : "text-muted"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-6 h-6 text-xp fill-xp" />
          <span className="font-bold text-xl">{score}</span>
        </div>
      </div>

      <Progress value={progress} className="h-4" />

      {/* Word to find */}
      <div className="bg-gradient-to-b from-primary/10 to-secondary/10 rounded-3xl p-8 text-center relative">
        {showSparkles && (
          <Sparkles className="absolute top-4 right-4 w-8 h-8 text-xp animate-ping" />
        )}
        
        <p className="text-sm text-muted-foreground mb-2">Find the color:</p>
        <p className="text-4xl font-bold mb-4">{currentColor.translation}</p>
        
        <button
          onClick={() => speakWord(currentColor.translation)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Volume2 className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Listen</span>
        </button>
      </div>

      {/* Color Options */}
      <div className="grid grid-cols-2 gap-4">
        {colorOptions.map((color, i) => (
          <button
            key={i}
            onClick={() => handleColorClick(color)}
            disabled={selectedAnswer !== null}
            className={cn(
              "aspect-square rounded-3xl transition-all border-4 shadow-lg",
              selectedAnswer === null && "hover:scale-105 border-transparent",
              selectedAnswer === color.color && isCorrect && "border-success scale-105",
              selectedAnswer === color.color && !isCorrect && "border-destructive opacity-50",
              selectedAnswer !== null && color.color === currentColor.color && "border-success scale-105",
            )}
            style={{ backgroundColor: color.color }}
          >
            {selectedAnswer !== null && color.color === currentColor.color && (
              <span className="text-4xl drop-shadow-lg">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Next Button */}
      {selectedAnswer !== null && (
        <Button 
          onClick={nextColor}
          className="w-full h-14 text-xl gradient-primary text-primary-foreground animate-fade-in"
        >
          {isCorrect ? '🎉 ' : ''}
          {currentIndex < colors.length - 1 ? 'Next Color!' : 'Finish!'}
        </Button>
      )}

      {/* Feedback */}
      {selectedAnswer !== null && (
        <div className="text-center animate-fade-in">
          <p className="text-lg font-bold text-muted-foreground">
            {currentColor.translation} = {currentColor.english}
          </p>
        </div>
      )}
    </div>
  );
};

export default KidsColorGame;
