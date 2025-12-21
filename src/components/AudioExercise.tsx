import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTTSLanguageCode } from '@/lib/languageContent';
import { useTranslation } from 'react-i18next';

interface AudioExerciseProps {
  correctAnswer: string;
  languageCode: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const AudioExercise: React.FC<AudioExerciseProps> = ({
  correctAnswer,
  languageCode,
  onAnswer,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const speakText = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(correctAnswer);
    utterance.lang = getTTSLanguageCode(languageCode);
    utterance.rate = playCount === 0 ? 0.7 : 0.85; // Slower first time
    
    utterance.onend = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      setPlayCount(prev => prev + 1);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    
    speechSynthesis.speak(utterance);
  }, [correctAnswer, languageCode, isPlaying, playCount]);

  const handleSubmit = () => {
    onAnswer(typedAnswer);
  };

  return (
    <div className="space-y-6">
      {/* Audio Play Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={speakText}
          disabled={isPlaying || disabled}
          className={cn(
            'w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-lg',
            isPlaying 
              ? 'bg-primary/80 animate-pulse' 
              : 'bg-primary hover:bg-primary/90 hover:scale-105',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Volume2 className={cn(
            'w-12 h-12 text-primary-foreground mb-1',
            isPlaying && 'animate-bounce'
          )} />
          <span className="text-primary-foreground text-sm font-medium">
            {isPlaying ? t('speech.listening', 'Playing...') : t('lesson.tapToListen', 'Tap to listen')}
          </span>
        </button>
        
        {playCount > 0 && (
          <button
            onClick={speakText}
            disabled={isPlaying || disabled}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RotateCcw className="w-4 h-4" />
            {t('speech.listen', 'Listen again')} ({playCount} time{playCount > 1 ? 's' : ''})
          </button>
        )}
      </div>

      {/* Answer Input */}
      <div className="space-y-4">
        <input
          type="text"
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={disabled}
          placeholder={t('lesson.typeAnswer', 'Type what you hear...')}
          className={cn(
            'w-full p-4 rounded-2xl border-2 bg-card text-lg text-center',
            !disabled && 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
            disabled && 'opacity-50'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typedAnswer.trim()) {
              handleSubmit();
            }
          }}
        />
        
        {/* Hint */}
        {hasPlayed && !disabled && (
          <p className="text-sm text-muted-foreground text-center">
            💡 {t('exercise.typeWhatYouHear', 'Type exactly what you hear')}
          </p>
        )}
      </div>
    </div>
  );
};

export default AudioExercise;
