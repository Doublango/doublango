import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, cancelSpeech, preloadVoices, isTTSSupported } from '@/lib/tts';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/contexts/AppSettingsContext';

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
  const { toast } = useToast();
  const { settings } = useAppSettings();

  const [typedAnswer, setTypedAnswer] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [audioSupported, setAudioSupported] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const supported = isTTSSupported();
    setAudioSupported(supported);

    if (!supported) {
      toast({
        title: t('common.error', 'Audio not available'),
        description: t('speech.notSupported', 'Audio playback is not supported in your browser.'),
        variant: 'destructive',
      });
      return () => {
        mountedRef.current = false;
      };
    }

    // Preload voices (non-blocking)
    preloadVoices(languageCode).catch(() => undefined);

    return () => {
      mountedRef.current = false;
      cancelSpeech();
    };
  }, [languageCode, toast, t]);

  const speakText = useCallback(async () => {
    if (isPlaying || !audioSupported || !correctAnswer || disabled) return;

    setIsPlaying(true);

    try {
      await speak(correctAnswer, languageCode, {
        rate: playCount === 0 ? 0.75 : 0.9,
        engine: settings.ttsEngine,
        voiceURI: settings.ttsVoiceURI,
      });

      if (mountedRef.current) {
        setHasPlayed(true);
        setPlayCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Speech error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('speech.genericError', 'Could not play audio.'),
        variant: 'destructive',
      });
    } finally {
      if (mountedRef.current) setIsPlaying(false);
    }
  }, [audioSupported, correctAnswer, disabled, isPlaying, languageCode, playCount, settings.ttsEngine, settings.ttsVoiceURI, toast, t]);

  const handleSubmit = () => {
    onAnswer(typedAnswer);
  };

  if (!audioSupported) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-2xl">
        <p className="text-muted-foreground">{t('speech.notSupported', 'Audio playback is not supported in your browser.')}</p>
        <p className="mt-2 font-medium">{t('common.answer', 'Answer')}: {correctAnswer}</p>
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
          <Volume2 className={cn('w-12 h-12 text-primary-foreground mb-1', isPlaying && 'animate-bounce')} />
          <span className="text-primary-foreground text-sm font-medium">
            {isPlaying ? t('speech.playing', 'Playing...') : t('speech.tapToListen', 'Tap to listen')}
          </span>
        </button>

        {playCount > 0 && (
          <button
            onClick={speakText}
            disabled={isPlaying || disabled}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RotateCcw className="w-4 h-4" />
            {t('speech.listenAgain', 'Listen again')} ({playCount}x)
          </button>
        )}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={disabled}
          placeholder={t('speech.typeWhatYouHear', 'Type what you hear...')}
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
            <p className="text-xs text-muted-foreground mb-1">💡 {t('speech.hint', 'Hint')}: {t('speech.answerIs', 'The answer is')}:</p>
            <p className="text-sm font-medium text-primary">{correctAnswer}</p>
          </div>
        )}

        {hasPlayed && playCount < 2 && !disabled && (
          <p className="text-sm text-muted-foreground text-center">💡 {t('speech.typeExactly', 'Type exactly what you hear')}</p>
        )}
      </div>
    </div>
  );
};

export default AudioExercise;

