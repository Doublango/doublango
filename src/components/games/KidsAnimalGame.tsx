import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, Star, Sparkles, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { playKidsSound } from '@/lib/gameSounds';

interface AnimalWord {
  emoji: string;
  english: string;
  translation: string;
}

interface KidsAnimalGameProps {
  animals: AnimalWord[];
  languageCode: string;
  onComplete: (score: number, perfectCount: number) => void;
}

const KidsAnimalGame: React.FC<KidsAnimalGameProps> = ({
  animals,
  languageCode,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentAnimal = animals[currentIndex];
  const progress = ((currentIndex + 1) / animals.length) * 100;

  // Generate options for current animal
  useEffect(() => {
    if (!currentAnimal) return;

    const correctAnswer = currentAnimal.translation;
    const wrongOptions = animals
      .filter(a => a.translation !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(a => a.translation);

    const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [currentIndex, animals, currentAnimal]);

  const speakWord = useCallback((text: string) => {
    speak(text, languageCode, { rate: 0.7 });
    playKidsSound('pop');
  }, [languageCode]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentAnimal.translation;
    setIsCorrect(correct);

    if (correct) {
      playKidsSound('correct');
      setScore(prev => prev + 10);
      setPerfectCount(prev => prev + 1);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);
    } else {
      playKidsSound('incorrect');
    }

    speakWord(currentAnimal.translation);
  }, [selectedAnswer, currentAnimal, speakWord]);

  const nextAnimal = useCallback(() => {
    if (currentIndex < animals.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      playKidsSound('gameComplete');
      onComplete(score, perfectCount);
    }
  }, [currentIndex, animals.length, score, perfectCount, onComplete]);

  if (isComplete) {
    const stars = Math.ceil((perfectCount / animals.length) * 5);

    return (
      <div className="bg-card rounded-3xl p-8 text-center space-y-6">
        <div className="text-6xl animate-bounce">🎉</div>
        <h3 className="text-2xl font-bold text-primary">Great Job!</h3>
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-10 h-10 transition-all animate-scale-in",
                i < stars ? "text-xp fill-xp" : "text-muted"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className="text-lg">
          You got <span className="font-bold text-success">{perfectCount}</span> out of{' '}
          <span className="font-bold">{animals.length}</span> correct!
        </p>
        <div className="text-4xl">
          {perfectCount === animals.length ? '🏆' : perfectCount > animals.length / 2 ? '⭐' : '💪'}
        </div>
      </div>
    );
  }

  if (!currentAnimal) return null;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-4 flex-1" />
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 text-xp fill-xp" />
          <span className="font-bold text-lg">{score}</span>
        </div>
      </div>

      {/* Animal Display */}
      <div className="bg-gradient-to-b from-primary/10 to-secondary/10 rounded-3xl p-8 text-center relative overflow-hidden">
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-xp animate-ping" />
          </div>
        )}
        
        <div 
          className={cn(
            "text-8xl mb-4 transition-transform",
            showCelebration && "animate-bounce"
          )}
        >
          {currentAnimal.emoji}
        </div>
        
        <p className="text-xl font-bold mb-2">{currentAnimal.english}</p>
        
        <button
          onClick={() => speakWord(currentAnimal.translation)}
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <Volume2 className="w-5 h-5" />
          <span className="text-sm">Listen</span>
        </button>
      </div>

      {/* Question */}
      <p className="text-center text-lg font-medium">
        What is <span className="text-primary">"{currentAnimal.english}"</span> in the new language?
      </p>

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option)}
            disabled={selectedAnswer !== null}
            className={cn(
              "p-5 rounded-2xl font-bold text-lg transition-all border-3",
              selectedAnswer === null && "bg-card border-border hover:border-primary hover:scale-105 shadow-md",
              selectedAnswer === option && isCorrect && "bg-success/20 border-success text-success scale-105",
              selectedAnswer === option && !isCorrect && "bg-destructive/20 border-destructive text-destructive",
              selectedAnswer !== null && option === currentAnimal.translation && "bg-success/20 border-success",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Next Button */}
      {selectedAnswer !== null && (
        <Button 
          onClick={nextAnimal}
          className="w-full h-14 text-lg gradient-primary text-primary-foreground animate-fade-in"
        >
          {isCorrect ? '🎉 ' : ''}
          {currentIndex < animals.length - 1 ? 'Next Animal!' : 'See Results!'}
        </Button>
      )}

      {/* Feedback */}
      {selectedAnswer !== null && (
        <p className={cn(
          "text-center text-lg font-bold animate-fade-in",
          isCorrect ? "text-success" : "text-muted-foreground"
        )}>
          {isCorrect ? 'Amazing! 🌟' : `It's "${currentAnimal.translation}"`}
        </p>
      )}
    </div>
  );
};

export default KidsAnimalGame;
