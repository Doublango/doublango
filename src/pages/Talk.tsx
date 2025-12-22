import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import AvatarMascot from '@/components/AvatarMascot';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Mic2, Volume2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, preloadVoices, cancelSpeech } from '@/lib/tts';
import { LANGUAGE_CONTENT, getTTSLanguageCode } from '@/lib/languageContent';
import { 
  ADULT_PHRASE_LIBRARY, 
  KIDS_PHRASE_LIBRARY, 
  EXTENDED_TRANSLATIONS,
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
  type CategoryData
} from '@/lib/talkPhrases';

const Talk: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();
  const isKidsMode = settings.kidsMode;
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0); // 0=beginner, 1=basic, 2=intermediate, 3=advanced

  const languageCode = activeCourse?.language_code || 'es';
  const languageContent = LANGUAGE_CONTENT[languageCode as keyof typeof LANGUAGE_CONTENT] || LANGUAGE_CONTENT.es;
  const extendedContent = EXTENDED_TRANSLATIONS[languageCode] || EXTENDED_TRANSLATIONS.es || {};
  
  // Use kids or adult phrase library
  const phraseLibrary = isKidsMode ? KIDS_PHRASE_LIBRARY : ADULT_PHRASE_LIBRARY;
  
  // Filter categories based on difficulty level
  const currentDifficulty = DIFFICULTY_LEVELS[difficultyLevel]?.value || 'beginner';
  
  const getFilteredCategories = useCallback((): CategoryData[] => {
    const levelOrder: DifficultyLevel[] = ['beginner', 'basic', 'intermediate', 'advanced'];
    const maxLevelIndex = levelOrder.indexOf(currentDifficulty);
    
    return phraseLibrary.map(cat => ({
      ...cat,
      phrases: cat.phrases.filter(p => levelOrder.indexOf(p.level) <= maxLevelIndex)
    })).filter(cat => cat.phrases.length > 0);
  }, [phraseLibrary, currentDifficulty]);

  const categories = getFilteredCategories();

  // Preload voices when language changes
  useEffect(() => {
    preloadVoices(languageCode);
    return () => cancelSpeech();
  }, [languageCode]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Get translated phrase from language content
  const getTranslatedPhrase = useCallback((phraseKey: string, englishFallback: string): string => {
    // Check extended translations first (for new phrases)
    if (extendedContent && extendedContent[phraseKey]) {
      return extendedContent[phraseKey];
    }
    // Then check main language content
    if (languageContent && languageContent[phraseKey]) {
      return languageContent[phraseKey];
    }
    // Fallback: try Spanish extended
    if (EXTENDED_TRANSLATIONS.es?.[phraseKey]) {
      return EXTENDED_TRANSLATIONS.es[phraseKey];
    }
    // Try Spanish main
    if (LANGUAGE_CONTENT.es[phraseKey]) {
      return LANGUAGE_CONTENT.es[phraseKey];
    }
    // Last resort: never show blank
    return englishFallback;
  }, [languageContent, extendedContent]);

  const getCurrentCategory = useCallback(() => {
    if (!selectedCategory) return null;
    return categories.find(c => c.id === selectedCategory) || null;
  }, [selectedCategory, categories]);

  const getCurrentPhrase = useCallback(() => {
    const category = getCurrentCategory();
    if (!category) return null;
    
    const phraseData = category.phrases[currentPhraseIndex];
    if (!phraseData) return null;

    const translatedPhrase = getTranslatedPhrase(phraseData.key, phraseData.en);

    return {
      english: phraseData.en,
      translation: translatedPhrase,
      key: phraseData.key,
      level: phraseData.level,
    };
  }, [getCurrentCategory, currentPhraseIndex, getTranslatedPhrase]);

  const speakPhrase = useCallback(async (text: string) => {
    if (isSpeaking || !text) return;
    
    setIsSpeaking(true);
    try {
      await speak(text, languageCode, { rate: 0.7 });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [languageCode, isSpeaking]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getTTSLanguageCode(languageCode);

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      
      const phrase = getCurrentPhrase();
      if (phrase) {
        const acc = calculateAccuracy(phrase.translation, spokenText);
        setAccuracy(acc);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }, [languageCode, getCurrentPhrase]);

  const calculateAccuracy = (target: string, spoken: string): number => {
    const targetClean = target.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const spokenClean = spoken.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (targetClean === spokenClean) return 100;
    
    const targetWords = targetClean.split(/\s+/);
    const spokenWords = spokenClean.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.some(sw => sw.includes(word) || word.includes(sw))) matches++;
    });
    
    return Math.round((matches / Math.max(targetWords.length, 1)) * 100);
  };

  const nextPhrase = useCallback(() => {
    const category = getCurrentCategory();
    if (!category) return;
    
    if (currentPhraseIndex < category.phrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setTranscript('');
      setAccuracy(null);
    } else {
      setPracticeComplete(true);
    }
  }, [getCurrentCategory, currentPhraseIndex]);

  const resetPractice = () => {
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
    cancelSpeech();
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // Practice Complete Screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-6">
        <AvatarMascot mood="celebrating" size="xl" animate className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">{t('speech.practiceComplete', 'Practice Complete!')}</h1>
        <p className="text-muted-foreground mb-8">{t('speech.greatPronunciation', 'Great pronunciation practice!')}</p>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={resetPractice}>
            {t('speech.tryAnother', 'Try Another')}
          </Button>
          <Button onClick={() => navigate('/home')} className="gradient-primary text-primary-foreground">
            {t('common.continue', 'Continue')}
          </Button>
        </div>
      </div>
    );
  }

  // Active Practice Screen
  if (selectedCategory) {
    const category = getCurrentCategory();
    const phrase = getCurrentPhrase();
    const progressPercent = ((currentPhraseIndex + 1) / (category?.phrases.length || 1)) * 100;

    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader
          leftSlot={
            <button onClick={resetPractice} className="text-sm font-medium text-muted-foreground">
              ← {t('common.back', 'Back')}
            </button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{category?.title}</span>
              <span>{currentPhraseIndex + 1} / {category?.phrases.length}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Phrase Card */}
          {phrase && (
            <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  phrase.level === 'beginner' && "bg-success/20 text-success",
                  phrase.level === 'basic' && "bg-primary/20 text-primary",
                  phrase.level === 'intermediate' && "bg-warning/20 text-warning",
                  phrase.level === 'advanced' && "bg-destructive/20 text-destructive"
                )}>
                  {DIFFICULTY_LEVELS.find(l => l.value === phrase.level)?.emoji} {phrase.level}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{t('speech.sayThisPhrase', 'Say this phrase:')}</p>
              <p className="text-2xl font-bold mb-2">{phrase.translation}</p>
              <p className="text-sm text-muted-foreground mb-4">({phrase.english})</p>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => speakPhrase(phrase.translation)}
                disabled={isSpeaking}
              >
                <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                {isSpeaking ? t('speech.playing', 'Playing...') : t('speech.listen', 'Listen')}
              </Button>
            </div>
          )}

          {/* Microphone */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <button
              onClick={isListening ? undefined : startListening}
              disabled={isListening}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg',
                isListening
                  ? 'bg-destructive animate-pulse'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              <Mic2 className="w-10 h-10 text-primary-foreground" />
            </button>
            <p className="text-sm text-muted-foreground">
              {isListening ? t('speech.listening', 'Listening...') : t('speech.tapToSpeak', 'Tap to speak')}
            </p>
          </div>

          {/* Result */}
          {transcript && (
            <div className={cn(
              'rounded-2xl p-4 mb-6',
              accuracy !== null && accuracy >= 70 ? 'bg-success/10' : 'bg-muted'
            )}>
              <p className="text-sm text-muted-foreground mb-1">{t('speech.youSaid', 'You said:')}</p>
              <p className="text-lg font-medium mb-2">"{transcript}"</p>

              {accuracy !== null && (
                <div className="flex items-center gap-2">
                  <Progress value={accuracy} className="flex-1 h-2" />
                  <span className={cn(
                    'font-bold',
                    accuracy >= 70 ? 'text-success' : 'text-muted-foreground'
                  )}>
                    {accuracy}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {accuracy !== null && (
            <Button
              onClick={nextPhrase}
              className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
            >
              {t('common.next', 'Next')} <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Category Selection Screen
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        leftSlot={<h1 className="font-bold text-lg">{t('nav.talk', 'Talk')}</h1>}
      />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-primary-foreground mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Mic2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isKidsMode ? '🎤 Talk Practice!' : t('speech.title', 'Talk Practice')}</h2>
              <p className="text-sm opacity-80">{isKidsMode ? 'Say it out loud!' : t('speech.subtitle', 'Master pronunciation with audio exercises')}</p>
            </div>
          </div>
        </div>

        {/* Level Slider */}
        {!isKidsMode && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm">Difficulty Level</span>
              <span className="text-sm font-bold text-primary">
                {DIFFICULTY_LEVELS[difficultyLevel]?.emoji} {DIFFICULTY_LEVELS[difficultyLevel]?.label}
              </span>
            </div>
            <Slider
              value={[difficultyLevel]}
              onValueChange={(val) => setDifficultyLevel(val[0])}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {DIFFICULTY_LEVELS.map((l, i) => (
                <span key={l.value} className={cn(difficultyLevel === i && "text-primary font-medium")}>
                  {l.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <h3 className="font-bold text-lg mb-4">{isKidsMode ? '🌟 Pick a Topic!' : t('speech.categories', 'Practice Categories')}</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setCurrentPhraseIndex(0);
                setTranscript('');
                setAccuracy(null);
              }}
              className="w-full bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {category.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{category.title}</h4>
                <p className="text-sm text-muted-foreground">{category.phrases.length} phrases</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Talk;
