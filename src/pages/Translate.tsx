import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';
import AppHeader from '@/components/AppHeader';
import AvatarMascot from '@/components/AvatarMascot';
import ChatMessage from '@/components/ChatMessage';
import TopicSelector from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mic, MicOff, Volume2, Copy, Bookmark, BookmarkCheck, 
  ArrowRightLeft, Loader2, Languages, Turtle, MessageCircle, 
  HelpCircle, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { speak, cancelSpeech } from '@/lib/tts';
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

interface ChatMessageType {
  id: string;
  type: 'user' | 'ai';
  message: string;
  translation?: string;
  timestamp: Date;
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
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Chat state
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  const playTranslation = async (slow = false) => {
    if (!translatedText || isPlaying || isPlayingSlow) return;
    
    if (slow) {
      setIsPlayingSlow(true);
      try {
        const words = translatedText.split(/\s+/);
        for (const word of words) {
          await speak(word, toLanguage, {
            rate: 0.5,
            engine: settings.ttsEngine,
            voiceURI: settings.ttsVoiceURI,
          });
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      } catch (error) {
        console.error('TTS error:', error);
      } finally {
        setIsPlayingSlow(false);
      }
    } else {
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
    }
  };

  // Trigger translation manually
  const handleTranslate = () => {
    if (inputText.trim()) {
      translateText(inputText);
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

  // Chat functionality
  const sendChatMessage = async () => {
    if (!inputText.trim() || isChatLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      message: inputText,
      translation: translatedText || undefined,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const userInput = inputText;
    setInputText('');
    setTranslatedText('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'chat',
          userMessage: userInput,
          conversationHistory: chatMessages.map(m => ({
            role: m.type,
            content: m.message,
          })),
          languageCode: toLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Chat failed');
      }

      const data = await res.json();
      
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: data.response,
        translation: data.responseEnglish,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Auto-play AI response
      if (data.response) {
        setPlayingMessageId(aiMessage.id);
        try {
          await speak(data.response, toLanguage, {
            engine: settings.ttsEngine,
            voiceURI: settings.ttsVoiceURI,
          });
        } catch (e) {
          console.error('TTS error:', e);
        }
        setPlayingMessageId(null);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const askMeQuestion = async (topicId?: string) => {
    setIsChatLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'ask_question',
          languageCode: toLanguage,
          topic: topicId || currentTopic || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get question');
      }

      const data = await res.json();
      
      const aiMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: 'ai',
        message: data.question,
        translation: data.questionEnglish,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setCurrentTopic(data.topic);

      // Auto-play the question
      if (data.question) {
        setPlayingMessageId(aiMessage.id);
        try {
          await speak(data.question, toLanguage, {
            engine: settings.ttsEngine,
            voiceURI: settings.ttsVoiceURI,
          });
        } catch (e) {
          console.error('TTS error:', e);
        }
        setPlayingMessageId(null);
      }
    } catch (error) {
      console.error('Ask me error:', error);
      toast({
        title: 'Failed to get question',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    setCurrentTopic(topicId === 'random' ? '' : topicId);
    askMeQuestion(topicId === 'random' ? undefined : topicId);
  };

  const playMessage = async (message: ChatMessageType) => {
    if (playingMessageId) return;
    
    setPlayingMessageId(message.id);
    try {
      await speak(message.message, toLanguage, {
        engine: settings.ttsEngine,
        voiceURI: settings.ttsVoiceURI,
      });
    } catch (e) {
      console.error('TTS error:', e);
    }
    setPlayingMessageId(null);
  };

  const clearChat = () => {
    setChatMessages([]);
    setCurrentTopic('');
  };

  const toggleChatMode = () => {
    setChatMode(!chatMode);
    if (!chatMode && chatMessages.length === 0) {
      // Starting chat mode - show topic selector
      setShowTopicSelector(true);
    }
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        leftSlot={<h1 className="font-bold text-lg">Translate</h1>}
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
            <span className="text-sm text-muted-foreground font-medium">
              {fromLanguage === 'en' ? 'English' : LANGUAGES.find(l => l.code === fromLanguage)?.name || 'English'}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(isRecording && 'text-destructive animate-pulse')}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={fromLanguage === 'en' ? 'Type or speak to translate...' : `Type in ${LANGUAGES.find(l => l.code === fromLanguage)?.name || 'your language'}...`}
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 text-lg"
          />
          {/* Translate Button */}
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="gap-2"
            >
              <Languages className="w-4 h-4" />
              {isTranslating ? 'Translating...' : 'Translate'}
            </Button>
          </div>
        </div>

        {/* Translation Output */}
        <div className="bg-card rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">
              {LANGUAGES.find(l => l.code === toLanguage)?.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playTranslation(false)}
                disabled={!translatedText || isPlaying || isPlayingSlow}
                title="Play"
              >
                <Volume2 className={cn("w-5 h-5", isPlaying && "animate-pulse text-primary")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playTranslation(true)}
                disabled={!translatedText || isPlaying || isPlayingSlow}
                title="Slow playback"
              >
                <Turtle className={cn("w-5 h-5", isPlayingSlow && "animate-pulse text-primary")} />
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
          <div className="min-h-[100px] text-lg">
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

        {/* Chat Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant={chatMode ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={chatMode ? sendChatMessage : toggleChatMode}
            disabled={chatMode && (!inputText.trim() || isChatLoading)}
          >
            <MessageCircle className="w-4 h-4" />
            {chatMode ? (isChatLoading ? 'Sending...' : 'Chat') : 'Start Chat'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setShowTopicSelector(true)}
            disabled={isChatLoading}
          >
            <HelpCircle className="w-4 h-4" />
            Ask Me
          </Button>
        </div>

        {/* Chat Messages Area */}
        {(chatMode || chatMessages.length > 0) && (
          <div className="bg-card rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-bold flex items-center gap-2">
                💬 Conversation
                {currentTopic && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({currentTopic})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {chatMessages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearChat}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setChatMode(!chatMode)}>
                  {chatMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {chatMode && (
              <div 
                ref={chatContainerRef}
                className="max-h-80 overflow-y-auto p-3"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-2xl mb-2">🦜</p>
                    <p className="text-sm">
                      Type a message or tap "Ask Me" to start practicing!
                    </p>
                  </div>
                ) : (
                  <>
                    {chatMessages.map(msg => (
                      <ChatMessage
                        key={msg.id}
                        type={msg.type}
                        message={msg.message}
                        translation={msg.translation}
                        timestamp={msg.timestamp}
                        speaking={playingMessageId === msg.id}
                        onPlayAudio={() => playMessage(msg)}
                        isPlaying={playingMessageId === msg.id}
                      />
                    ))}
                    {isChatLoading && (
                      <div className="flex gap-2 items-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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

      <TopicSelector
        open={showTopicSelector}
        onOpenChange={setShowTopicSelector}
        onSelectTopic={handleTopicSelect}
        selectedTopic={currentTopic}
      />

      <BottomNavigation />
    </div>
  );
};

export default Translate;
