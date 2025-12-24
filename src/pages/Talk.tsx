import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Mic2, Volume2, ChevronRight, RotateCcw, Turtle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, preloadVoices, cancelSpeech } from '@/lib/tts';
import { LANGUAGE_CONTENT, getTTSLanguageCode } from '@/lib/languageContent';
import { LANGUAGES } from '@/lib/languages';
import {
  ADULT_PHRASE_LIBRARY,
  KIDS_PHRASE_LIBRARY,
  EXTENDED_TRANSLATIONS,
  DIFFICULTY_LEVELS,
} from '@/lib/talkPhrases';
import type { DifficultyLevel, CategoryData, PhraseData } from '@/lib/talkPhrases';

// 6 levels for kids mode
const KIDS_DIFFICULTY_LEVELS = [
  { value: 'beginner' as DifficultyLevel, label: 'Easy 1', emoji: '🌟' },
  { value: 'beginner' as DifficultyLevel, label: 'Easy 2', emoji: '⭐' },
  { value: 'basic' as DifficultyLevel, label: 'Medium 1', emoji: '🎯' },
  { value: 'basic' as DifficultyLevel, label: 'Medium 2', emoji: '🎨' },
  { value: 'intermediate' as DifficultyLevel, label: 'Hard 1', emoji: '🚀' },
  { value: 'intermediate' as DifficultyLevel, label: 'Hard 2', emoji: '🏆' },
];

// Number word to digit mapping for accuracy calculation
const NUMBER_WORDS: Record<string, string[]> = {
  '0': ['zero', 'cero', 'zéro', 'null'],
  '1': ['one', 'uno', 'un', 'une', 'eins', 'ein'],
  '2': ['two', 'dos', 'deux', 'zwei'],
  '3': ['three', 'tres', 'trois', 'drei'],
  '4': ['four', 'cuatro', 'quatre', 'vier'],
  '5': ['five', 'cinco', 'cinq', 'fünf'],
  '6': ['six', 'seis', 'sechs'],
  '7': ['seven', 'siete', 'sept', 'sieben'],
  '8': ['eight', 'ocho', 'huit', 'acht'],
  '9': ['nine', 'nueve', 'neuf', 'neun'],
  '10': ['ten', 'diez', 'dix', 'zehn'],
  '11': ['eleven', 'once', 'onze', 'elf'],
  '12': ['twelve', 'doce', 'douze', 'zwölf'],
  '13': ['thirteen', 'trece', 'treize', 'dreizehn'],
  '14': ['fourteen', 'catorce', 'quatorze', 'vierzehn'],
  '15': ['fifteen', 'quince', 'quinze', 'fünfzehn'],
  '16': ['sixteen', 'dieciséis', 'seize', 'sechzehn'],
  '17': ['seventeen', 'diecisiete', 'dix-sept', 'siebzehn'],
  '18': ['eighteen', 'dieciocho', 'dix-huit', 'achtzehn'],
  '19': ['nineteen', 'diecinueve', 'dix-neuf', 'neunzehn'],
  '20': ['twenty', 'veinte', 'vingt', 'zwanzig'],
  '30': ['thirty', 'treinta', 'trente', 'dreißig'],
  '40': ['forty', 'cuarenta', 'quarante', 'vierzig'],
  '50': ['fifty', 'cincuenta', 'cinquante', 'fünfzig'],
  '60': ['sixty', 'sesenta', 'soixante', 'sechzig'],
  '70': ['seventy', 'setenta', 'soixante-dix', 'siebzig'],
  '80': ['eighty', 'ochenta', 'quatre-vingts', 'achtzig'],
  '90': ['ninety', 'noventa', 'quatre-vingt-dix', 'neunzig'],
  '100': ['hundred', 'cien', 'cent', 'hundert'],
};

// Normalize spoken text to handle number word/digit equivalence
const normalizeForComparison = (text: string): string => {
  let normalized = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  // Check if the spoken text is a digit, convert to words
  for (const [digit, words] of Object.entries(NUMBER_WORDS)) {
    if (normalized === digit) {
      return words[0]; // Return the first (English) word equivalent
    }
    // Also check if any word variant matches
    if (words.includes(normalized)) {
      return words[0]; // Normalize to first variant
    }
  }
  
  return normalized;
};

const Talk: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();
  const isKidsMode = settings.kidsMode;
  
  // All hooks must be called unconditionally at the top
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0);
  const [sessionPhrases, setSessionPhrases] = useState<PhraseData[]>([]);

  const languageCode = activeCourse?.language_code || 'es';
  const languageContent = LANGUAGE_CONTENT[languageCode as keyof typeof LANGUAGE_CONTENT] || LANGUAGE_CONTENT.es;
  const extendedContent = EXTENDED_TRANSLATIONS[languageCode] || EXTENDED_TRANSLATIONS.es || {};
  const currentLanguage = LANGUAGES.find(l => l.code === languageCode);
  
  // Use appropriate difficulty levels based on mode
  const difficultyLevels = isKidsMode ? KIDS_DIFFICULTY_LEVELS : DIFFICULTY_LEVELS;
  const maxDifficultyIndex = difficultyLevels.length - 1;
  
  // Use kids or adult phrase library
  const phraseLibrary = useMemo(() => 
    isKidsMode ? KIDS_PHRASE_LIBRARY : ADULT_PHRASE_LIBRARY,
    [isKidsMode]
  );
  
  // Filter categories based on difficulty level
  const currentDifficulty = difficultyLevels[Math.min(difficultyLevel, maxDifficultyIndex)]?.value || 'beginner';
  
  const categories = useMemo((): CategoryData[] => {
    const levelOrder: DifficultyLevel[] = ['beginner', 'basic', 'intermediate', 'advanced'];
    const maxLevelIndex = levelOrder.indexOf(currentDifficulty);

    return phraseLibrary
      .map((cat) => ({
        ...cat,
        phrases: cat.phrases.filter((p) => levelOrder.indexOf(p.level) <= maxLevelIndex),
      }))
      .filter((cat) => cat.phrases.length > 0);
  }, [phraseLibrary, currentDifficulty]);

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

  // Reset when difficulty changes
  useEffect(() => {
    // If difficulty changes, reset the current practice session
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setSessionPhrases([]);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
  }, [difficultyLevel]);

  // Initialize session phrases when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        // Shuffle phrases for this session
        const shuffled = [...category.phrases].sort(() => Math.random() - 0.5);
        setSessionPhrases(shuffled);
        setCurrentPhraseIndex(0);
      }
    }
  }, [selectedCategory, categories]);

  const getCurrentPhrase = useCallback(() => {
    if (!selectedCategory || sessionPhrases.length === 0) return null;
    
    const phraseData = sessionPhrases[currentPhraseIndex];
    if (!phraseData) return null;

    const translatedPhrase = getTranslatedPhrase(phraseData.key, phraseData.en);

    return {
      english: phraseData.en,
      translation: translatedPhrase,
      key: phraseData.key,
      level: phraseData.level,
    };
  }, [selectedCategory, sessionPhrases, currentPhraseIndex, getTranslatedPhrase]);

  const speakPhrase = useCallback(async (text: string, slow = false) => {
    if (isSpeaking || !text) return;

    setIsSpeaking(true);
    try {
      if (slow) {
        // Speak word by word with pauses
        const words = text.split(/\s+/);
        for (const word of words) {
          await speak(word, languageCode, {
            rate: 0.5,
            engine: settings.ttsEngine,
            voiceURI: settings.ttsVoiceURI,
          });
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      } else {
        await speak(text, languageCode, {
          rate: 0.7,
          engine: settings.ttsEngine,
          voiceURI: settings.ttsVoiceURI,
        });
      }
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [languageCode, isSpeaking, settings.ttsEngine, settings.ttsVoiceURI]);

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

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const calculateAccuracy = (target: string, spoken: string): number => {
    const targetNormalized = normalizeForComparison(target);
    const spokenNormalized = normalizeForComparison(spoken);
    
    if (targetNormalized === spokenNormalized) return 100;
    
    const targetWords = targetNormalized.split(/\s+/);
    const spokenWords = spokenNormalized.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      const wordNorm = normalizeForComparison(word);
      if (spokenWords.some(sw => {
        const swNorm = normalizeForComparison(sw);
        return swNorm.includes(wordNorm) || wordNorm.includes(swNorm) || swNorm === wordNorm;
      })) {
        matches++;
      }
    });
    
    return Math.round((matches / Math.max(targetWords.length, 1)) * 100);
  };

  const nextPhrase = useCallback(() => {
    if (currentPhraseIndex < sessionPhrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setTranscript('');
      setAccuracy(null);
    } else {
      setPracticeComplete(true);
    }
  }, [sessionPhrases.length, currentPhraseIndex]);

  const resetPractice = useCallback(() => {
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
    setSessionPhrases([]);
    cancelSpeech();
  }, []);

  // Reset and get fresh batch for same category
  const resetCurrentCategory = useCallback(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        const shuffled = [...category.phrases].sort(() => Math.random() - 0.5);
        setSessionPhrases(shuffled);
        setCurrentPhraseIndex(0);
        setTranscript('');
        setAccuracy(null);
        setPracticeComplete(false);
      }
    }
  }, [selectedCategory, categories]);

  // Get current values for rendering
  const category = getCurrentCategory();
  const phrase = getCurrentPhrase();
  const progressPercent = category && category.phrases.length > 0 
    ? ((currentPhraseIndex + 1) / sessionPhrases.length) * 100 
    : 0;

  // Loading state
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
  if (selectedCategory && category) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader
          leftSlot={
            <button onClick={resetPractice} className="text-sm font-medium text-muted-foreground">
              ← {t('common.back', 'Back')}
            </button>
          }
          rightSlot={
            <Button variant="ghost" size="sm" onClick={resetCurrentCategory} className="gap-1">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{category.title}</span>
              <span>{currentPhraseIndex + 1} / {sessionPhrases.length}</span>
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
                  {difficultyLevels.find(l => l.value === phrase.level)?.emoji} {phrase.level}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{t('speech.sayThisPhrase', 'Say this phrase:')}</p>
              <p className="text-2xl font-bold mb-2">{phrase.translation}</p>
              <p className="text-sm text-muted-foreground mb-4">({phrase.english})</p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => speakPhrase(phrase.translation)}
                  disabled={isSpeaking}
                >
                  <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                  {isSpeaking ? t('speech.playing', 'Playing...') : t('speech.listen', 'Listen')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakPhrase(phrase.translation, true)}
                  disabled={isSpeaking}
                  title="Slow playback"
                >
                  <Turtle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Microphone */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg',
                isListening
                  ? 'bg-destructive animate-pulse cursor-pointer'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              <Mic2 className="w-10 h-10 text-primary-foreground" />
            </button>
            <p className="text-sm text-muted-foreground">
              {isListening ? t('speech.listening', 'Tap to stop') : t('speech.tapToSpeak', 'Tap to speak')}
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
        {/* Hero with Language Indicator */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-primary-foreground mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Mic2 className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{isKidsMode ? '🎤 Talk Practice!' : t('speech.title', 'Talk Practice')}</h2>
              <p className="text-sm opacity-80">{isKidsMode ? 'Say it out loud!' : t('speech.subtitle', 'Master pronunciation with audio exercises')}</p>
            </div>
          </div>
          
          {/* Language Badge */}
          {currentLanguage && (
            <div className="mt-4 flex items-center gap-2">
              <Globe className="w-4 h-4 opacity-80" />
              <span className="text-sm font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
            </div>
          )}
        </div>

        {/* Level Slider - shown for both adults and kids */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">{isKidsMode ? '🎯 Level' : 'Difficulty Level'}</span>
            <span className="text-sm font-bold text-primary">
              {difficultyLevels[Math.min(difficultyLevel, maxDifficultyIndex)]?.emoji} {difficultyLevels[Math.min(difficultyLevel, maxDifficultyIndex)]?.label}
            </span>
          </div>
          <Slider
            value={[difficultyLevel]}
            onValueChange={(val) => setDifficultyLevel(val[0])}
            max={maxDifficultyIndex}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {difficultyLevels.map((l, i) => (
              <span key={`${l.value}-${i}`} className={cn(difficultyLevel === i && "text-primary font-medium")}>
                {l.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <h3 className="font-bold text-lg mb-4">{isKidsMode ? '🌟 Pick a Topic!' : t('speech.categories', 'Practice Categories')}</h3>
        <div className="space-y-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPhraseIndex(0);
                setTranscript('');
                setAccuracy(null);
              }}
              className="w-full bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {cat.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{cat.title}</h4>
                <p className="text-sm text-muted-foreground">{cat.phrases.length} phrases</p>
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
