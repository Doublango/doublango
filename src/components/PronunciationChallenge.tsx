import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, Turtle, Trophy, Star, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { getTTSLanguageCode } from '@/lib/languageContent';

interface PronunciationChallengeProps {
  phrases: Array<{ text: string; translation?: string }>;
  languageCode: string;
  onComplete: (score: number, perfectCount: number, totalAttempts: number) => void;
  disabled?: boolean;
  passingScore?: number; // accuracy % needed to pass each phrase
}

const PronunciationChallenge: React.FC<PronunciationChallengeProps> = ({
  phrases,
  languageCode,
  onComplete,
  disabled = false,
  passingScore = 70,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const recognitionRef = useRef<any>(null);

  const currentPhrase = phrases[currentIndex];
  const progressPercent = ((currentIndex + 1) / phrases.length) * 100;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const speakPhrase = useCallback(async (slow = false) => {
    if (isSpeaking || !currentPhrase) return;
    
    setIsSpeaking(true);
    try {
      await speak(currentPhrase.text, languageCode, {
        rate: slow ? 0.5 : 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [currentPhrase, languageCode, isSpeaking]);

  const calculateAccuracy = (target: string, spoken: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const targetNorm = normalize(target);
    const spokenNorm = normalize(spoken);
    
    if (targetNorm === spokenNorm) return 100;
    
    const targetWords = targetNorm.split(/\s+/);
    const spokenWords = spokenNorm.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.some(sw => sw.includes(word) || word.includes(sw))) {
        matches++;
      }
    });
    
    return Math.round((matches / Math.max(targetWords.length, 1)) * 100);
  };

  const startListening = useCallback(() => {
    if (disabled || !currentPhrase) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getTTSLanguageCode(languageCode);
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setAccuracy(null);
      setShowResult(false);
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      
      const acc = calculateAccuracy(currentPhrase.text, spokenText);
      setAccuracy(acc);
      setAttempts(prev => prev + 1);
      setShowResult(true);
      
      // Update score and streak
      if (acc >= passingScore) {
        const streakBonus = Math.min(streak, 5) * 5;
        const points = Math.floor(acc / 10) + streakBonus;
        setTotalScore(prev => prev + points);
        setStreak(prev => prev + 1);
        setBestStreak(prev => Math.max(prev, streak + 1));
        
        if (acc >= 90) {
          setPerfectCount(prev => prev + 1);
        }
      } else {
        setStreak(0);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }, [disabled, currentPhrase, languageCode, streak, passingScore]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const nextPhrase = useCallback(() => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTranscript('');
      setAccuracy(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
      onComplete(totalScore, perfectCount, attempts);
    }
  }, [currentIndex, phrases.length, totalScore, perfectCount, attempts, onComplete]);

  const retryPhrase = () => {
    setTranscript('');
    setAccuracy(null);
    setShowResult(false);
  };

  if (isComplete) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold">Challenge Complete!</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-xp">{totalScore}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{perfectCount}</p>
            <p className="text-xs text-muted-foreground">Perfect</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{bestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPhrase) return null;

  const isPassing = accuracy !== null && accuracy >= passingScore;
  const isPerfect = accuracy !== null && accuracy >= 90;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span>{currentIndex + 1}/{phrases.length}</span>
        </div>
        
        {streak > 0 && (
          <div className="flex items-center gap-1 text-primary">
            <Flame className="w-4 h-4 animate-pulse" />
            <span className="font-bold">{streak}x</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-xp" />
          <span className="font-bold">{totalScore}</span>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progressPercent} className="h-2" />

      {/* Phrase card */}
      <div className="bg-muted/50 rounded-2xl p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Say this phrase:</p>
        <p className="text-xl font-bold">{currentPhrase.text}</p>
        {currentPhrase.translation && (
          <p className="text-sm text-muted-foreground">({currentPhrase.translation})</p>
        )}
        
        {/* Audio controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => speakPhrase(false)}
            disabled={isSpeaking}
            className="gap-2"
          >
            <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
            Listen
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => speakPhrase(true)}
            disabled={isSpeaking}
            title="Slow playback"
          >
            <Turtle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Microphone button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg',
            isListening
              ? 'bg-destructive animate-pulse'
              : 'bg-primary hover:bg-primary/90'
          )}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </button>
        <p className="text-sm text-muted-foreground">
          {isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
        </p>
      </div>

      {/* Result */}
      {showResult && accuracy !== null && (
        <div className={cn(
          "rounded-2xl p-4 text-center space-y-3",
          isPassing ? "bg-success/10" : "bg-destructive/10"
        )}>
          <div className="flex items-center justify-center gap-2">
            {isPerfect ? (
              <>
                <Star className="w-5 h-5 text-xp fill-xp" />
                <span className="font-bold text-success">Perfect!</span>
              </>
            ) : isPassing ? (
              <span className="font-bold text-success">Good job!</span>
            ) : (
              <span className="font-bold text-destructive">Try again</span>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Accuracy</span>
              <span className={cn(
                "font-bold",
                isPassing ? "text-success" : "text-destructive"
              )}>
                {accuracy}%
              </span>
            </div>
            <Progress 
              value={accuracy} 
              className={cn(
                "h-2",
                isPassing ? "[&>div]:bg-success" : "[&>div]:bg-destructive"
              )}
            />
          </div>
          
          {transcript && (
            <div className="text-sm">
              <span className="text-muted-foreground">You said: </span>
              <span className="font-medium">{transcript}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            {!isPassing && (
              <Button variant="outline" onClick={retryPhrase} className="flex-1">
                Try Again
              </Button>
            )}
            <Button 
              onClick={nextPhrase}
              className={cn(
                "flex-1",
                isPassing ? "gradient-success text-success-foreground" : ""
              )}
            >
              {currentIndex < phrases.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationChallenge;
