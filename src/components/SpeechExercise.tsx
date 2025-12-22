import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { getTTSLanguageCode } from '@/lib/languageContent';

interface SpeechExerciseProps {
  targetPhrase: string;
  languageCode: string;
  onResult: (isCorrect: boolean, transcript: string, accuracy: number) => void;
  disabled?: boolean;
}

const SpeechExercise: React.FC<SpeechExerciseProps> = ({
  targetPhrase,
  languageCode,
  onResult,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getTTSLanguageCode(languageCode);

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;
      
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        const calculatedAccuracy = calculateAccuracy(targetPhrase, transcriptText);
        setAccuracy(calculatedAccuracy);
        setIsListening(false);
        
        const isCorrect = calculatedAccuracy >= 70;
        onResult(isCorrect, transcriptText, calculatedAccuracy);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(getErrorMessage(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [languageCode, targetPhrase, onResult]);

  const calculateAccuracy = (target: string, spoken: string): number => {
    const targetWords = target.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.includes(word)) {
        matches++;
      }
    });
    
    // Also check character similarity for partial matches
    const targetClean = target.toLowerCase().replace(/[^\w]/g, '');
    const spokenClean = spoken.toLowerCase().replace(/[^\w]/g, '');
    
    const levenshteinDistance = getLevenshteinDistance(targetClean, spokenClean);
    const maxLength = Math.max(targetClean.length, spokenClean.length);
    const charAccuracy = maxLength > 0 ? ((maxLength - levenshteinDistance) / maxLength) * 100 : 0;
    
    const wordAccuracy = targetWords.length > 0 ? (matches / targetWords.length) * 100 : 0;
    
    // Weight both metrics
    return Math.round((wordAccuracy * 0.4 + charAccuracy * 0.6));
  };

  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'no-speech':
        return t('speech.noSpeech');
      case 'audio-capture':
        return t('speech.noMic');
      case 'not-allowed':
        return t('speech.micDenied');
      case 'network':
        return t('speech.networkError');
      default:
        return t('speech.genericError');
    }
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    
    setTranscript('');
    setAccuracy(null);
    setError(null);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
    }
  }, [disabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speakPhrase = useCallback(async () => {
    try {
      await speak(targetPhrase, languageCode, { rate: 0.75 });
    } catch (error) {
      console.error('Speech error:', error);
    }
  }, [targetPhrase, languageCode]);

  const retry = useCallback(() => {
    setTranscript('');
    setAccuracy(null);
    setError(null);
  }, []);

  const getAccuracyLabel = (acc: number): { label: string; color: string } => {
    if (acc >= 90) return { label: t('speech.excellent'), color: 'text-success' };
    if (acc >= 70) return { label: t('speech.goodJob'), color: 'text-success' };
    if (acc >= 50) return { label: t('speech.keepPracticing'), color: 'text-banana' };
    return { label: t('speech.tryAgain'), color: 'text-destructive' };
  };

  if (!isSupported) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-2xl">
        <MicOff className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">
          {t('speech.notSupported')}
        </p>
        <Button variant="outline" onClick={() => onResult(true, 'skipped', 100)}>
          {t('speech.skipExercise')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Phrase */}
      <div className="bg-card rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">{t('speech.sayPhrase')}</p>
        <p className="text-2xl font-bold mb-4">{targetPhrase}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={speakPhrase}
          className="gap-2"
        >
          <Volume2 className="w-4 h-4" />
          {t('speech.listen')}
        </Button>
      </div>

      {/* Microphone Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center transition-all',
            isListening
              ? 'bg-destructive animate-pulse'
              : 'bg-primary hover:bg-primary/90',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-destructive-foreground" />
          ) : (
            <Mic className="w-10 h-10 text-primary-foreground" />
          )}
        </button>
        <p className="text-sm text-muted-foreground">
          {isListening ? t('speech.listening') : t('speech.tapToSpeak')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-center">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={retry}
            className="mt-2 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Transcript Result */}
      {transcript && !error && (
        <div className={cn(
          'rounded-2xl p-4 text-center',
          accuracy !== null && accuracy >= 70 
            ? 'bg-success/10' 
            : accuracy !== null 
              ? 'bg-destructive/10'
              : 'bg-muted'
        )}>
          <p className="text-sm text-muted-foreground mb-1">{t('speech.youSaid')}</p>
          <p className="text-lg font-medium mb-2">"{transcript}"</p>
          
          {accuracy !== null && (
            <div className="space-y-2">
              {/* Accuracy Bar */}
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    accuracy >= 70 ? 'bg-success' : accuracy >= 50 ? 'bg-banana' : 'bg-destructive'
                  )}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <p className={cn(
                'font-bold',
                getAccuracyLabel(accuracy).color
              )}>
                {accuracy}% {t('speech.accuracyLabel')} - {getAccuracyLabel(accuracy).label}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Can't Speak Option */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onResult(true, 'skipped', 100)}
          className="text-muted-foreground"
        >
          {t('speech.cantSpeak')}
        </Button>
      </div>
    </div>
  );
};

export default SpeechExercise;
