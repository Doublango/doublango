import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Mic2, Volume2, ChevronRight, RotateCcw, Turtle, Globe, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, preloadVoices, cancelSpeech } from '@/lib/tts';
import { LANGUAGE_CONTENT, getTTSLanguageCode } from '@/lib/languageContent';
import { LANGUAGES } from '@/lib/languages';
import { generateAiTalkPhrases, type AiTalkPhrase } from '@/lib/content/aiTalk';
import {
  ADULT_PHRASE_LIBRARY,
  KIDS_PHRASE_LIBRARY,
  EXTENDED_TRANSLATIONS,
} from '@/lib/talkPhrases';
import type { DifficultyLevel, CategoryData, PhraseData } from '@/lib/talkPhrases';

// 6 CEFR levels for adult mode
const ADULT_DIFFICULTY_LEVELS = [
  { value: 'A1' as const, label: 'A1 - Beginner', emoji: '🌱' },
  { value: 'A2' as const, label: 'A2 - Elementary', emoji: '📗' },
  { value: 'B1' as const, label: 'B1 - Intermediate', emoji: '📘' },
  { value: 'B2' as const, label: 'B2 - Upper-Int', emoji: '📙' },
  { value: 'C1' as const, label: 'C1 - Advanced', emoji: '🔥' },
  { value: 'C2' as const, label: 'C2 - Mastery', emoji: '🏆' },
];

// Kids mode capped at B1 (3 levels only)
const KIDS_DIFFICULTY_LEVELS = [
  { value: 'A1' as const, label: 'Super Easy', emoji: '🌟' },
  { value: 'A2' as const, label: 'Easy', emoji: '⭐' },
  { value: 'B1' as const, label: 'Medium', emoji: '🎯' },
];

const TALK_DIFFICULTY_KEY = 'dbl_talk_difficulty_v1';

const readStoredTalkDifficulty = (kidsMode: boolean): number => {
  try {
    const key = kidsMode ? `${TALK_DIFFICULTY_KEY}:kids` : `${TALK_DIFFICULTY_KEY}:adult`;
    const raw = window.localStorage.getItem(key);
    const n = Number(raw);
    const max = kidsMode ? 2 : 5;
    return Number.isFinite(n) && n >= 0 && n <= max ? n : 0;
  } catch {
    return 0;
  }
};

const storeCurrentTalkDifficulty = (level: number, kidsMode: boolean) => {
  try {
    const key = kidsMode ? `${TALK_DIFFICULTY_KEY}:kids` : `${TALK_DIFFICULTY_KEY}:adult`;
    window.localStorage.setItem(key, String(level));
  } catch {}
};

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
  '20': ['twenty', 'veinte', 'vingt', 'zwanzig'],
  '30': ['thirty', 'treinta', 'trente', 'dreißig'],
  '100': ['hundred', 'cien', 'cent', 'hundert'],
};

// Normalize spoken text to handle number word/digit equivalence
const normalizeForComparison = (text: string): string => {
  let normalized = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  for (const [digit, words] of Object.entries(NUMBER_WORDS)) {
    if (normalized === digit) {
      return words[0];
    }
    if (words.includes(normalized)) {
      return words[0];
    }
  }
  
  return normalized;
};

interface ActivePhrase {
  english: string;
  translation: string;
  key: string;
  level: string;
}

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
  const [difficultyLevel, setDifficultyLevel] = useState<number>(() => readStoredTalkDifficulty(settings.kidsMode));

  // Clamp when switching between modes
  useEffect(() => {
    const max = isKidsMode ? 2 : 5;
    setDifficultyLevel((prev) => {
      const stored = readStoredTalkDifficulty(isKidsMode);
      return Math.min(stored, max);
    });
  }, [isKidsMode]);
  const [sessionPhrases, setSessionPhrases] = useState<ActivePhrase[]>([]);
  const [usedPhraseKeys, setUsedPhraseKeys] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAiGeneration, setUseAiGeneration] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  const languageCode = activeCourse?.language_code || 'es';
  const languageContent = LANGUAGE_CONTENT[languageCode as keyof typeof LANGUAGE_CONTENT] || LANGUAGE_CONTENT.es;
  const extendedContent = EXTENDED_TRANSLATIONS[languageCode] || EXTENDED_TRANSLATIONS.es || {};
  const currentLanguage = LANGUAGES.find(l => l.code === languageCode);
  
  // Use appropriate difficulty levels based on mode
  const difficultyLevels = isKidsMode ? KIDS_DIFFICULTY_LEVELS : ADULT_DIFFICULTY_LEVELS;
  const maxDifficultyIndex = difficultyLevels.length - 1;
  const currentCefrLevel = difficultyLevels[Math.min(difficultyLevel, maxDifficultyIndex)]?.value || 'A1';
  
  // Use kids or adult phrase library for fallback
  const phraseLibrary = useMemo(() => 
    isKidsMode ? KIDS_PHRASE_LIBRARY : ADULT_PHRASE_LIBRARY,
    [isKidsMode]
  );
  
  // Map CEFR to legacy difficulty level for fallback
  const cefrToLegacy: Record<string, DifficultyLevel> = {
    'A1': 'beginner',
    'A2': 'basic',
    'B1': 'intermediate',
    'B2': 'advanced',
    'C1': 'advanced',
    'C2': 'advanced',
  };
  
  const legacyDifficulty = cefrToLegacy[currentCefrLevel] || 'beginner';
  
  // Filter categories based on difficulty level (for category selection)
  const categories = useMemo((): CategoryData[] => {
    const levelOrder: DifficultyLevel[] = ['beginner', 'basic', 'intermediate', 'advanced'];
    const maxLevelIndex = levelOrder.indexOf(legacyDifficulty);

    return phraseLibrary
      .map((cat) => ({
        ...cat,
        phrases: cat.phrases.filter((p) => levelOrder.indexOf(p.level) <= maxLevelIndex),
      }))
      .filter((cat) => cat.phrases.length > 0);
  }, [phraseLibrary, legacyDifficulty]);

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

  // Get translated phrase from language content (fallback)
  const getTranslatedPhrase = useCallback((phraseKey: string, englishFallback: string): string => {
    if (extendedContent && extendedContent[phraseKey]) {
      return extendedContent[phraseKey];
    }
    if (languageContent && languageContent[phraseKey]) {
      return languageContent[phraseKey];
    }
    if (EXTENDED_TRANSLATIONS.es?.[phraseKey]) {
      return EXTENDED_TRANSLATIONS.es[phraseKey];
    }
    if (LANGUAGE_CONTENT.es[phraseKey]) {
      return LANGUAGE_CONTENT.es[phraseKey];
    }
    return englishFallback;
  }, [languageContent, extendedContent]);

  // Generate AI phrases for a category
  const generateAiPhrases = useCallback(async (categoryTitle: string) => {
    setIsGenerating(true);
    try {
      const phrases = await generateAiTalkPhrases({
        languageCode,
        category: categoryTitle,
        difficultyLevel: currentCefrLevel,
        isKidsMode,
        usedPhrases: Array.from(usedPhraseKeys).slice(-30),
        batchSize: 10,
      });
      
      if (phrases.length > 0) {
        const activePhrases: ActivePhrase[] = phrases.map(p => ({
          english: p.en,
          translation: p.translation,
          key: p.key,
          level: p.level,
        }));
        
        // Mark these as used
        const newUsed = new Set(usedPhraseKeys);
        phrases.forEach(p => newUsed.add(p.key));
        setUsedPhraseKeys(newUsed);
        
        return activePhrases;
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
    return null;
  }, [languageCode, currentCefrLevel, isKidsMode, usedPhraseKeys]);

  // Generate fallback phrases from static library
  const generateFallbackPhrases = useCallback((categoryId: string): ActivePhrase[] => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    
    const shuffled = [...category.phrases]
      .filter(p => !usedPhraseKeys.has(p.key))
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    
    // If all used, reset and shuffle all
    const phrases = shuffled.length > 0 ? shuffled : [...category.phrases].sort(() => Math.random() - 0.5).slice(0, 10);
    
    return phrases.map(p => ({
      english: p.en,
      translation: getTranslatedPhrase(p.key, p.en),
      key: p.key,
      level: p.level,
    }));
  }, [categories, usedPhraseKeys, getTranslatedPhrase]);

  // Reset when difficulty changes
  useEffect(() => {
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setSessionPhrases([]);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
    // Clear used phrases for this level to get fresh content
    setUsedPhraseKeys(new Set());
  }, [difficultyLevel]);

  // Initialize session phrases when category is selected
  const startCategory = useCallback(async (categoryId: string, categoryTitle: string) => {
    setSelectedCategory(categoryId);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
    
    // Try AI generation first
    if (useAiGeneration) {
      const aiPhrases = await generateAiPhrases(categoryTitle);
      if (aiPhrases && aiPhrases.length > 0) {
        setSessionPhrases(aiPhrases);
        return;
      }
    }
    
    // Fallback to static phrases
    const fallback = generateFallbackPhrases(categoryId);
    setSessionPhrases(fallback);
  }, [useAiGeneration, generateAiPhrases, generateFallbackPhrases]);

  const getCurrentPhrase = useCallback(() => {
    if (!selectedCategory || sessionPhrases.length === 0) return null;
    return sessionPhrases[currentPhraseIndex] || null;
  }, [selectedCategory, sessionPhrases, currentPhraseIndex]);

  const speakPhrase = useCallback(async (text: string, slow = false) => {
    if (isSpeaking || !text) return;

    setIsSpeaking(true);
    try {
      if (slow) {
        const words = text.split(/\s+/);
        for (const word of words) {
          await speak(word, languageCode, {
            rate: 0.45,
            engine: settings.ttsEngine,
            voiceURI: settings.ttsVoiceURI,
          });
          await new Promise(resolve => setTimeout(resolve, 500));
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
    recognitionRef.current = recognition;

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
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

  const nextPhrase = useCallback(async () => {
    if (currentPhraseIndex < sessionPhrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setTranscript('');
      setAccuracy(null);
    } else {
      // Load more phrases or complete
      if (useAiGeneration && selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category) {
          const morePhrases = await generateAiPhrases(category.title);
          if (morePhrases && morePhrases.length > 0) {
            setSessionPhrases(prev => [...prev, ...morePhrases]);
            setCurrentPhraseIndex(prev => prev + 1);
            setTranscript('');
            setAccuracy(null);
            return;
          }
        }
      }
      setPracticeComplete(true);
    }
  }, [sessionPhrases.length, currentPhraseIndex, useAiGeneration, selectedCategory, categories, generateAiPhrases]);

  const resetPractice = useCallback(() => {
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
    setSessionPhrases([]);
    cancelSpeech();
    stopListening();
  }, [stopListening]);

  // Reset and get fresh batch for same category at same level
  const resetCurrentCategory = useCallback(async () => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        setCurrentPhraseIndex(0);
        setTranscript('');
        setAccuracy(null);
        setPracticeComplete(false);
        
        if (useAiGeneration) {
          const aiPhrases = await generateAiPhrases(category.title);
          if (aiPhrases && aiPhrases.length > 0) {
            setSessionPhrases(aiPhrases);
            return;
          }
        }
        
        const fallback = generateFallbackPhrases(selectedCategory);
        setSessionPhrases(fallback);
      }
    }
  }, [selectedCategory, categories, useAiGeneration, generateAiPhrases, generateFallbackPhrases]);

  // Get current values for rendering
  const category = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const phrase = getCurrentPhrase();
  const progressPercent = sessionPhrases.length > 0 
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={resetCurrentCategory} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('speech.morePhrases', 'More Phrases')}
          </Button>
          <Button variant="outline" onClick={resetPractice}>
            {t('speech.tryAnother', 'Try Another Category')}
          </Button>
          <Button onClick={() => navigate('/home')} className="gradient-primary text-primary-foreground">
            {t('common.continue', 'Continue')}
          </Button>
        </div>
      </div>
    );
  }

  // Active Practice Screen
  if (selectedCategory && (category || sessionPhrases.length > 0)) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader
          leftSlot={
            <button onClick={resetPractice} className="text-sm font-medium text-muted-foreground">
              ← {t('common.back', 'Back')}
            </button>
          }
          rightSlot={
            <Button variant="ghost" size="sm" onClick={resetCurrentCategory} className="gap-1" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span className="hidden sm:inline">Reset</span>
            </Button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Language Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {difficultyLevels[difficultyLevel]?.emoji} {currentCefrLevel}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{category?.title || 'Practice'}</span>
              <span>{currentPhraseIndex + 1} / {sessionPhrases.length}{useAiGeneration && '+'}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Generating indicator */}
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 mb-4 text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">{t('speech.generatingPhrases', 'Generating new phrases...')}</span>
            </div>
          )}

          {/* Phrase Card */}
          {phrase && (
            <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  (phrase.level === 'A1' || phrase.level === 'beginner') && "bg-success/20 text-success",
                  (phrase.level === 'A2' || phrase.level === 'basic') && "bg-primary/20 text-primary",
                  (phrase.level === 'B1' || phrase.level === 'B2' || phrase.level === 'intermediate') && "bg-warning/20 text-warning",
                  (phrase.level === 'C1' || phrase.level === 'C2' || phrase.level === 'advanced') && "bg-destructive/20 text-destructive"
                )}>
                  {phrase.level}
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
                  title={t('speech.slowPlayback', 'Slow playback')}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Turtle className="w-5 h-5" />
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
            <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
              <p className="text-sm text-muted-foreground mb-2">{t('speech.youSaid', 'You said:')}</p>
              <p className="text-xl font-medium mb-4">{transcript}</p>
              
              {accuracy !== null && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('speech.accuracy', 'Accuracy')}</span>
                    <span className={cn(
                      'font-bold text-lg',
                      accuracy >= 80 && 'text-success',
                      accuracy >= 50 && accuracy < 80 && 'text-warning',
                      accuracy < 50 && 'text-destructive'
                    )}>
                      {accuracy}%
                    </span>
                  </div>
                  <Progress value={accuracy} className={cn(
                    "h-3",
                    accuracy >= 80 && '[&>div]:bg-success',
                    accuracy >= 50 && accuracy < 80 && '[&>div]:bg-warning',
                    accuracy < 50 && '[&>div]:bg-destructive'
                  )} />
                  
                  <p className="text-center text-sm mt-2">
                    {accuracy >= 80 && '🎉 ' + t('speech.excellent', 'Excellent!')}
                    {accuracy >= 50 && accuracy < 80 && '👍 ' + t('speech.goodTry', 'Good try!')}
                    {accuracy < 50 && '💪 ' + t('speech.keepPracticing', 'Keep practicing!')}
                  </p>
                </div>
              )}
              
              <Button onClick={nextPhrase} className="w-full mt-4 gradient-primary text-primary-foreground gap-2">
                {t('common.continue', 'Continue')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Category Selection Screen
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Language Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-primary" />
          <span className="text-lg font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
        </div>

        {/* Difficulty Slider */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">{t('learn.difficultyLevel', 'Difficulty Level')}</span>
            <span className="text-sm font-bold text-primary">
              {difficultyLevels[difficultyLevel]?.emoji} {difficultyLevels[difficultyLevel]?.label}
            </span>
          </div>
          <Slider
            value={[Math.min(difficultyLevel, maxDifficultyIndex)]}
            onValueChange={(val) => {
              const clamped = Math.min(val[0], maxDifficultyIndex);
              setDifficultyLevel(clamped);
              storeCurrentTalkDifficulty(clamped, isKidsMode);
            }}
            max={maxDifficultyIndex}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {difficultyLevels.map((l, i) => (
              <span key={l.value + i} className={cn(difficultyLevel === i && "text-primary font-medium")}>
                {l.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* AI Toggle */}
        <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('speech.aiGeneration', 'AI-Generated Phrases')}</span>
          </div>
          <button
            onClick={() => setUseAiGeneration(!useAiGeneration)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              useAiGeneration ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
              useAiGeneration ? "translate-x-7" : "translate-x-1"
            )} />
          </button>
        </div>

        {/* Practice Categories */}
        <h2 className="font-bold text-lg mb-4">{t('speech.practiceCategories', 'Practice Categories')}</h2>
        
        <div className="grid gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => startCategory(cat.id, cat.title)}
              disabled={isGenerating}
              className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all text-left disabled:opacity-50"
            >
              <span className="text-3xl">{cat.icon}</span>
              <div className="flex-1">
                <p className="font-semibold">{cat.title}</p>
                <p className="text-sm text-muted-foreground">
                  {cat.phrases.length} {t('speech.phrases', 'phrases')}
                  {useAiGeneration && <span className="text-primary"> + ∞</span>}
                </p>
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
