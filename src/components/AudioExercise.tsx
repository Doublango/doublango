import React, { useState, useCallback, useEffect } from 'react';
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
  const [audioSupported, setAudioSupported] = useState(true);

  // Check if speech synthesis is supported
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setAudioSupported(false);
    }
  }, []);

  const speakText = useCallback(() => {
    if (isPlaying || !audioSupported) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(correctAnswer);
    
    // Set language based on the course language
    const langCode = getTTSLanguageCode(languageCode);
    utterance.lang = langCode;
    utterance.rate = playCount === 0 ? 0.65 : 0.8; // Even slower first time
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a voice for this language
    const voices = speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    utterance.onend = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      setPlayCount(prev => prev + 1);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setHasPlayed(true);
    };
    
    speechSynthesis.speak(utterance);
  }, [correctAnswer, languageCode, isPlaying, playCount, audioSupported]);

  // Auto-play on mount
  useEffect(() => {
    // Load voices first
    const loadVoices = () => {
      speechSynthesis.getVoices();
    };
    loadVoices();
    
    // Some browsers need this event
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Auto-play after a short delay
    const timer = setTimeout(() => {
      if (audioSupported && !hasPlayed) {
        speakText();
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      speechSynthesis.cancel();
    };
  }, []);

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
      {/* Audio Play Button */}
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

      {/* Answer Input */}
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
        
        {/* Show correct answer as hint after 2 plays */}
        {playCount >= 2 && !disabled && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">💡 Hint: The answer is:</p>
            <p className="text-sm font-medium text-primary">{correctAnswer}</p>
          </div>
        )}
        
        {/* Helpful hint */}
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
