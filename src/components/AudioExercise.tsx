import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, cancelSpeech, preloadVoices } from '@/lib/tts';
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
  const [audioSupported, setAudioSupported] = useState(true);
  const mountedRef = useRef(true);

  // Preload voices on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (!('speechSynthesis' in window)) {
      setAudioSupported(false);
      return;
    }
    
    // Preload voices for this language
    preloadVoices(languageCode).then(hasVoice => {
      if (mountedRef.current && !hasVoice) {
        console.warn('No voice available for', languageCode);
      }
    });
    
    return () => {
      mountedRef.current = false;
      cancelSpeech();
    };
  }, [languageCode]);

  const speakText = useCallback(async () => {
    if (isPlaying || !audioSupported || !correctAnswer) return;
    
    setIsPlaying(true);
    
    try {
      await speak(correctAnswer, languageCode, { 
        rate: playCount === 0 ? 0.65 : 0.8 
      });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      if (mountedRef.current) {
        setIsPlaying(false);
        setHasPlayed(true);
        setPlayCount(prev => prev + 1);
      }
    }
  }, [correctAnswer, languageCode, isPlaying, playCount, audioSupported]);

  // Auto-play on mount with delay
  useEffect(() => {
    if (!audioSupported || !correctAnswer) return;
    
    const timer = setTimeout(() => {
      if (!hasPlayed && mountedRef.current) {
        speakText();
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [audioSupported, correctAnswer]);

  const handleSubmit = () => {
    onAnswer(typedAnswer);
  };

  if (!audioSupported) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-2xl">
        <p className="text-muted-foreground">Audio playback is not supported in your browser.</p>
        <p className="mt-2 font-medium">Answer: {correctAnswer}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={speakText}
          disabled={isPlaying || disabled}
          className={cn(
            'w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-lg',
            isPlaying 
              ? 'bg-primary/80 animate-pulse scale-110' 
              : 'bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Volume2 className={cn(
            'w-12 h-12 text-primary-foreground mb-1',
            isPlaying && 'animate-bounce'
          )} />
          <span className="text-primary-foreground text-sm font-medium">
            {isPlaying ? 'Playing...' : 'Tap to listen'}
          </span>
        </button>
        
        {playCount > 0 && (
          <button
            onClick={speakText}
            disabled={isPlaying || disabled}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RotateCcw className="w-4 h-4" />
            Listen again ({playCount}x played)
          </button>
        )}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type what you hear..."
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
        
        {playCount >= 2 && !disabled && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">💡 Hint: The answer is:</p>
            <p className="text-sm font-medium text-primary">{correctAnswer}</p>
          </div>
        )}
        
        {hasPlayed && playCount < 2 && !disabled && (
          <p className="text-sm text-muted-foreground text-center">
            💡 Type exactly what you hear
          </p>
        )}
      </div>
    </div>
  );
};

export default AudioExercise;
