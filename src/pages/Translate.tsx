import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';
import AppHeader from '@/components/AppHeader';
import AvatarMascot from '@/components/AvatarMascot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mic, MicOff, Volume2, Copy, Bookmark, BookmarkCheck, ArrowRightLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak } from '@/lib/tts';
import { LANGUAGES } from '@/lib/languages';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface SavedPhrase {
  id: string;
  fromText: string;
  toText: string;
  fromLang: string;
  toLang: string;
  savedAt: string;
}

const Translate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const { toast } = useToast();
  const { settings } = useAppSettings();

  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [fromLanguage, setFromLanguage] = useState<string>('en');
  const [toLanguage, setToLanguage] = useState<string>(activeCourse?.language_code || 'es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved phrases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('doublango_saved_phrases');
    if (saved) {
      try {
        setSavedPhrases(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Update toLanguage when active course changes
  useEffect(() => {
    if (activeCourse?.language_code) {
      setToLanguage(activeCourse.language_code);
    }
  }, [activeCourse?.language_code]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !progressLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, progressLoading, navigate]);

  const translateText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          fromLanguage,
          toLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Translation failed');
      }

      const data = await res.json();
      setTranslatedText(data.translation || '');
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  }, [fromLanguage, toLanguage, toast]);

  // Debounced translation
  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      translateText(text);
    }, 500);
  };

  const swapLanguages = () => {
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const playTranslation = async () => {
    if (!translatedText || isPlaying) return;
    
    setIsPlaying(true);
    try {
      await speak(translatedText, toLanguage, {
        engine: settings.ttsEngine,
        voiceURI: settings.ttsVoiceURI,
      });
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const copyTranslation = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      toast({ title: 'Copied!', description: 'Translation copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const toggleSavePhrase = () => {
    if (!inputText || !translatedText) return;

    const existingIndex = savedPhrases.findIndex(
      p => p.fromText === inputText && p.fromLang === fromLanguage && p.toLang === toLanguage
    );

    let newPhrases: SavedPhrase[];
    if (existingIndex >= 0) {
      newPhrases = savedPhrases.filter((_, i) => i !== existingIndex);
      toast({ title: 'Removed from saved phrases' });
    } else {
      const newPhrase: SavedPhrase = {
        id: Date.now().toString(),
        fromText: inputText,
        toText: translatedText,
        fromLang: fromLanguage,
        toLang: toLanguage,
        savedAt: new Date().toISOString(),
      };
      newPhrases = [newPhrase, ...savedPhrases].slice(0, 50); // Keep max 50
      toast({ title: 'Saved!', description: 'Phrase added to your collection' });
    }

    setSavedPhrases(newPhrases);
    localStorage.setItem('doublango_saved_phrases', JSON.stringify(newPhrases));
  };

  const isCurrentPhraseSaved = savedPhrases.some(
    p => p.fromText === inputText && p.fromLang === fromLanguage && p.toLang === toLanguage
  );

  // Speech recognition
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in this browser',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = fromLanguage === 'en' ? 'en-US' : fromLanguage;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Trigger translation when recording ends
      if (inputText) {
        translateText(inputText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const loadSavedPhrase = (phrase: SavedPhrase) => {
    setFromLanguage(phrase.fromLang);
    setToLanguage(phrase.toLang);
    setInputText(phrase.fromText);
    setTranslatedText(phrase.toText);
    setShowSaved(false);
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  const filteredLanguages = LANGUAGES.filter(l => l.code !== 'en' || fromLanguage !== 'en');

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        leftSlot={<h1 className="font-bold text-lg">{t('nav.translate', 'Translate')}</h1>}
      />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Language Selectors */}
        <div className="flex items-center gap-2">
          <Select value={fromLanguage} onValueChange={setFromLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={swapLanguages}
            className="shrink-0"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </Button>

          <Select value={toLanguage} onValueChange={setToLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input Area */}
        <div className="bg-card rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {LANGUAGES.find(l => l.code === fromLanguage)?.name || 'English'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(isRecording && 'text-destructive animate-pulse')}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type or speak to translate..."
            className="min-h-[120px] resize-none border-0 focus-visible:ring-0 p-0 text-lg"
          />
        </div>

        {/* Translation Output */}
        <div className="bg-card rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {LANGUAGES.find(l => l.code === toLanguage)?.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={playTranslation}
                disabled={!translatedText || isPlaying}
              >
                <Volume2 className={cn("w-5 h-5", isPlaying && "animate-pulse text-primary")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTranslation}
                disabled={!translatedText}
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSavePhrase}
                disabled={!translatedText}
              >
                {isCurrentPhraseSaved ? (
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          <div className="min-h-[120px] text-lg">
            {isTranslating ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Translating...
              </div>
            ) : (
              <p className={cn(!translatedText && 'text-muted-foreground')}>
                {translatedText || 'Translation will appear here'}
              </p>
            )}
          </div>
        </div>

        {/* Saved Phrases Section */}
        <div className="bg-card rounded-2xl p-4 shadow-md">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Saved Phrases
              <span className="text-sm font-normal text-muted-foreground">
                ({savedPhrases.length})
              </span>
            </h3>
          </button>

          {showSaved && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {savedPhrases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved phrases yet. Translate something and tap the bookmark icon!
                </p>
              ) : (
                savedPhrases.map(phrase => (
                  <button
                    key={phrase.id}
                    onClick={() => loadSavedPhrase(phrase)}
                    className="w-full p-3 bg-muted/50 hover:bg-muted rounded-xl text-left transition-colors"
                  >
                    <p className="font-medium truncate">{phrase.fromText}</p>
                    <p className="text-sm text-primary truncate">{phrase.toText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {LANGUAGES.find(l => l.code === phrase.fromLang)?.flag} →{' '}
                      {LANGUAGES.find(l => l.code === phrase.toLang)?.flag}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Translate;
