import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import MonkeyMascot from '@/components/MonkeyMascot';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Mic2, Volume2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, preloadVoices } from '@/lib/tts';
import { LANGUAGE_CONTENT } from '@/lib/languageContent';
import { getTTSLanguageCode } from '@/lib/languageContent';

// Phrase key mapping from English phrases to languageContent keys
const PHRASE_KEY_MAP: Record<string, string> = {
  'hello': 'hello',
  'good morning': 'good_morning',
  'good evening': 'good_night',
  'goodbye': 'goodbye',
  'see you later': 'goodbye',
  'yes': 'yes',
  'no': 'no',
  'please': 'please',
  'thank you': 'thank_you',
  "you're welcome": 'please',
  'excuse me': 'excuse_me',
  'sorry': 'sorry',
  'my name is...': 'my_name_is',
  'nice to meet you': 'nice_to_meet_you',
  'how are you?': 'how_are_you',
  'i am fine': 'im_fine',
  'where are you from?': 'where_is',
  'one': 'yes',
  'two': 'no',
  'three': 'yes',
  'four': 'no',
  'five': 'yes',
  'six': 'no',
  'seven': 'yes',
  'eight': 'no',
  'nine': 'yes',
  'ten': 'no',
  'water': 'water',
  'coffee': 'food',
  'tea': 'food',
  'bread': 'food',
  'i am hungry': 'food',
  'i am thirsty': 'water',
  'the bill, please': 'how_much',
  'where is...?': 'where_is',
  'left': 'yes',
  'right': 'no',
  'straight ahead': 'yes',
  'near': 'yes',
  'far': 'no',
  'what time is it?': 'how_are_you',
  'today': 'good_morning',
  'tomorrow': 'good_night',
  'yesterday': 'goodbye',
  'morning': 'good_morning',
  'afternoon': 'good_morning',
  'night': 'good_night',
  'how much?': 'how_much',
  'too expensive': 'no',
  'i want to buy...': 'please',
  'do you have...?': 'where_is',
  'size': 'how_much',
};

const SPEECH_CATEGORIES = [
  { id: 'greetings', title: 'Greetings', icon: '👋', phrases: ['Hello', 'Good morning', 'Good evening', 'Goodbye', 'See you later'] },
  { id: 'basics', title: 'Basic Phrases', icon: '💬', phrases: ['Yes', 'No', 'Please', 'Thank you', "You're welcome", 'Excuse me', 'Sorry'] },
  { id: 'introductions', title: 'Introductions', icon: '🤝', phrases: ['My name is...', 'Nice to meet you', 'How are you?', 'I am fine', 'Where are you from?'] },
  { id: 'numbers', title: 'Numbers', icon: '🔢', phrases: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] },
  { id: 'food', title: 'Food & Drink', icon: '🍽️', phrases: ['Water', 'Coffee', 'Tea', 'Bread', 'I am hungry', 'I am thirsty', 'The bill, please'] },
  { id: 'directions', title: 'Directions', icon: '🧭', phrases: ['Where is...?', 'Left', 'Right', 'Straight ahead', 'Near', 'Far'] },
  { id: 'time', title: 'Time', icon: '⏰', phrases: ['What time is it?', 'Today', 'Tomorrow', 'Yesterday', 'Morning', 'Afternoon', 'Night'] },
  { id: 'shopping', title: 'Shopping', icon: '🛍️', phrases: ['How much?', 'Too expensive', 'I want to buy...', 'Do you have...?', 'Size'] },
];

const Talk: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [practiceComplete, setPracticeComplete] = useState(false);

  const languageCode = activeCourse?.language_code || 'es';
  const languageContent = LANGUAGE_CONTENT[languageCode as keyof typeof LANGUAGE_CONTENT] || LANGUAGE_CONTENT.es;

  // Preload voices when language changes
  useEffect(() => {
    preloadVoices(languageCode);
  }, [languageCode]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const getTranslatedPhrase = useCallback((englishPhrase: string): string => {
    const key = PHRASE_KEY_MAP[englishPhrase.toLowerCase()];
    if (key && languageContent && languageContent[key]) {
      return languageContent[key];
    }
    // Fallback to the English phrase
    return englishPhrase;
  }, [languageContent]);

  const getCurrentPhrase = useCallback(() => {
    if (!selectedCategory) return null;
    const category = SPEECH_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return null;
    
    const englishPhrase = category.phrases[currentPhraseIndex];
    const translatedPhrase = getTranslatedPhrase(englishPhrase);
    
    return {
      english: englishPhrase,
      translation: translatedPhrase,
    };
  }, [selectedCategory, currentPhraseIndex, getTranslatedPhrase]);

  const speakPhrase = useCallback(async (text: string) => {
    if (isSpeaking) return;
    
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
    // Use proper TTS language code for speech recognition
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
    const targetClean = target.toLowerCase().replace(/[^\w\s]/g, '');
    const spokenClean = spoken.toLowerCase().replace(/[^\w\s]/g, '');
    
    if (targetClean === spokenClean) return 100;
    
    const targetWords = targetClean.split(/\s+/);
    const spokenWords = spokenClean.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.includes(word)) matches++;
    });
    
    return Math.round((matches / Math.max(targetWords.length, 1)) * 100);
  };

  const nextPhrase = useCallback(() => {
    const category = SPEECH_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return;
    
    if (currentPhraseIndex < category.phrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setTranscript('');
      setAccuracy(null);
    } else {
      setPracticeComplete(true);
    }
  }, [selectedCategory, currentPhraseIndex]);

  const resetPractice = () => {
    setSelectedCategory(null);
    setCurrentPhraseIndex(0);
    setTranscript('');
    setAccuracy(null);
    setPracticeComplete(false);
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // Practice Complete Screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-6">
        <MonkeyMascot mood="celebrating" size="xl" animate className="mb-6" />
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
    const category = SPEECH_CATEGORIES.find(c => c.id === selectedCategory);
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
          <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
            <p className="text-sm text-muted-foreground mb-2">{t('speech.sayThisPhrase', 'Say this phrase:')}</p>
            <p className="text-2xl font-bold mb-2">{phrase?.translation}</p>
            <p className="text-sm text-muted-foreground mb-4">({phrase?.english})</p>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => phrase && speakPhrase(phrase.translation)}
              disabled={isSpeaking}
            >
              <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
              {isSpeaking ? t('speech.playing', 'Playing...') : t('speech.listen', 'Listen')}
            </Button>
          </div>

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
              <h2 className="text-xl font-bold">{t('speech.title', 'Talk Practice')}</h2>
              <p className="text-sm opacity-80">{t('speech.subtitle', 'Master pronunciation with audio exercises')}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <h3 className="font-bold text-lg mb-4">{t('speech.categories', 'Practice Categories')}</h3>
        <div className="space-y-3">
          {SPEECH_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
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
