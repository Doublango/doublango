import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import AvatarMascot from '@/components/AvatarMascot';
import TimedMatchGame from '@/components/TimedMatchGame';
import PronunciationChallenge from '@/components/PronunciationChallenge';
import FlashCardGame from '@/components/games/FlashCardGame';
import WordScrambleGame from '@/components/games/WordScrambleGame';
import MemoryGame from '@/components/games/MemoryGame';
import KidsAnimalGame from '@/components/games/KidsAnimalGame';
import KidsColorGame from '@/components/games/KidsColorGame';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Gamepad2, 
  Zap, 
  Mic2, 
  Trophy, 
  ArrowLeft,
  Globe,
  Star,
  Timer,
  Target,
  Layers,
  Shuffle,
  Brain,
  Cat,
  Palette,
  Baby
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGUAGES } from '@/lib/languages';
import { useToast } from '@/hooks/use-toast';

// Sample game content by CEFR level
const MATCH_PAIRS_BY_LEVEL: Record<string, Array<{ left: string; right: string }>> = {
  A1: [
    { left: 'Hello', right: 'Hola' },
    { left: 'Goodbye', right: 'Adiós' },
    { left: 'Thank you', right: 'Gracias' },
    { left: 'Please', right: 'Por favor' },
    { left: 'Yes', right: 'Sí' },
    { left: 'No', right: 'No' },
  ],
  A2: [
    { left: 'Where is...?', right: '¿Dónde está...?' },
    { left: 'How much?', right: '¿Cuánto cuesta?' },
    { left: 'I would like', right: 'Me gustaría' },
    { left: 'What time?', right: '¿Qué hora?' },
    { left: 'I understand', right: 'Entiendo' },
    { left: 'I don\'t understand', right: 'No entiendo' },
  ],
  B1: [
    { left: 'In my opinion', right: 'En mi opinión' },
    { left: 'On the other hand', right: 'Por otro lado' },
    { left: 'It depends on', right: 'Depende de' },
    { left: 'I agree with', right: 'Estoy de acuerdo con' },
    { left: 'Nevertheless', right: 'Sin embargo' },
    { left: 'Furthermore', right: 'Además' },
  ],
  B2: [
    { left: 'As far as I know', right: 'Que yo sepa' },
    { left: 'To be honest', right: 'Para ser sincero' },
    { left: 'Taking into account', right: 'Teniendo en cuenta' },
    { left: 'As a matter of fact', right: 'De hecho' },
    { left: 'In spite of', right: 'A pesar de' },
    { left: 'Provided that', right: 'Siempre que' },
  ],
  C1: [
    { left: 'Notwithstanding', right: 'No obstante' },
    { left: 'Henceforth', right: 'De ahora en adelante' },
    { left: 'Whereby', right: 'Por el cual' },
    { left: 'Inasmuch as', right: 'En la medida en que' },
    { left: 'To that end', right: 'A tal fin' },
    { left: 'Insofar as', right: 'En tanto que' },
  ],
  C2: [
    { left: 'Be that as it may', right: 'Sea como fuere' },
    { left: 'For all intents', right: 'A todos los efectos' },
    { left: 'By virtue of', right: 'En virtud de' },
    { left: 'Ipso facto', right: 'Ipso facto' },
    { left: 'Mutatis mutandis', right: 'Mutatis mutandis' },
    { left: 'Vis-à-vis', right: 'Respecto a' },
  ],
};

const PRONUNCIATION_PHRASES_BY_LEVEL: Record<string, Array<{ text: string; translation: string }>> = {
  A1: [
    { text: 'Buenos días', translation: 'Good morning' },
    { text: 'Buenas noches', translation: 'Good night' },
    { text: 'Mucho gusto', translation: 'Nice to meet you' },
    { text: 'Hasta luego', translation: 'See you later' },
    { text: 'Con permiso', translation: 'Excuse me' },
  ],
  A2: [
    { text: '¿Cómo se llama usted?', translation: 'What is your name?' },
    { text: 'Me llamo Juan', translation: 'My name is Juan' },
    { text: '¿De dónde eres?', translation: 'Where are you from?' },
    { text: 'Soy de España', translation: 'I am from Spain' },
    { text: 'Tengo veinte años', translation: 'I am twenty years old' },
  ],
  B1: [
    { text: 'Me gustaría reservar una mesa', translation: 'I would like to book a table' },
    { text: '¿Podría repetir eso, por favor?', translation: 'Could you repeat that, please?' },
    { text: 'Estoy buscando la estación', translation: 'I am looking for the station' },
    { text: '¿A qué hora cierra?', translation: 'What time do you close?' },
    { text: 'Me interesa mucho', translation: 'I am very interested' },
  ],
  B2: [
    { text: 'Si hubiera sabido, habría venido antes', translation: 'If I had known, I would have come earlier' },
    { text: 'No creo que sea posible', translation: 'I don\'t think it\'s possible' },
    { text: 'A menos que llueva, iremos', translation: 'Unless it rains, we will go' },
    { text: 'Por mucho que lo intente', translation: 'No matter how much I try' },
    { text: 'Dado que es así', translation: 'Given that it is so' },
  ],
  C1: [
    { text: 'Habría sido mejor que hubieras esperado', translation: 'It would have been better if you had waited' },
    { text: 'Sea lo que sea, lo aceptaré', translation: 'Whatever it may be, I will accept it' },
    { text: 'Por más que insistas, no cambiaré de opinión', translation: 'No matter how much you insist, I won\'t change my mind' },
    { text: 'Dicho esto, procederemos', translation: 'That being said, we will proceed' },
    { text: 'En caso de que surja algún problema', translation: 'In case any problem arises' },
  ],
  C2: [
    { text: 'Habiendo considerado todas las opciones, he decidido', translation: 'Having considered all options, I have decided' },
    { text: 'Cualesquiera que sean las consecuencias', translation: 'Whatever the consequences may be' },
    { text: 'De no haber sido por su intervención', translation: 'Had it not been for their intervention' },
    { text: 'Lejos de ser un obstáculo, es una oportunidad', translation: 'Far from being an obstacle, it is an opportunity' },
    { text: 'Quienquiera que lo haya dicho, se equivoca', translation: 'Whoever said it is wrong' },
  ],
};

const FLASHCARD_WORDS_BY_LEVEL: Record<string, Array<{ front: string; back: string; hint?: string }>> = {
  A1: [
    { front: 'Hello', back: 'Hola', hint: 'A greeting' },
    { front: 'Goodbye', back: 'Adiós', hint: 'Farewell' },
    { front: 'Water', back: 'Agua', hint: 'You drink this' },
    { front: 'Food', back: 'Comida', hint: 'You eat this' },
    { front: 'House', back: 'Casa', hint: 'Where you live' },
    { front: 'Friend', back: 'Amigo', hint: 'Someone close to you' },
  ],
  A2: [
    { front: 'To travel', back: 'Viajar', hint: 'Going places' },
    { front: 'To eat', back: 'Comer', hint: 'Consuming food' },
    { front: 'To sleep', back: 'Dormir', hint: 'At night' },
    { front: 'To work', back: 'Trabajar', hint: 'At an office' },
    { front: 'To study', back: 'Estudiar', hint: 'Learning' },
    { front: 'To play', back: 'Jugar', hint: 'Having fun' },
  ],
  B1: [
    { front: 'Achievement', back: 'Logro', hint: 'Something accomplished' },
    { front: 'Challenge', back: 'Desafío', hint: 'Something difficult' },
    { front: 'Development', back: 'Desarrollo', hint: 'Growth' },
    { front: 'Environment', back: 'Medio ambiente', hint: 'Nature around us' },
    { front: 'Experience', back: 'Experiencia', hint: 'Life knowledge' },
    { front: 'Opportunity', back: 'Oportunidad', hint: 'A chance' },
  ],
  B2: [
    { front: 'Accountability', back: 'Responsabilidad', hint: 'Being answerable' },
    { front: 'Breakthrough', back: 'Avance', hint: 'Important discovery' },
    { front: 'Commitment', back: 'Compromiso', hint: 'Dedication' },
    { front: 'Determination', back: 'Determinación', hint: 'Strong will' },
    { front: 'Efficiency', back: 'Eficiencia', hint: 'Doing things well' },
    { front: 'Innovation', back: 'Innovación', hint: 'New ideas' },
  ],
  C1: [
    { front: 'Ambiguity', back: 'Ambigüedad', hint: 'Unclear meaning' },
    { front: 'Bureaucracy', back: 'Burocracia', hint: 'Administrative system' },
    { front: 'Condescension', back: 'Condescendencia', hint: 'Looking down on' },
    { front: 'Dichotomy', back: 'Dicotomía', hint: 'Two opposites' },
    { front: 'Ephemeral', back: 'Efímero', hint: 'Short-lived' },
    { front: 'Fallacy', back: 'Falacia', hint: 'False reasoning' },
  ],
  C2: [
    { front: 'Grandiloquent', back: 'Grandilocuente', hint: 'Pompous speech' },
    { front: 'Ineffable', back: 'Inefable', hint: 'Beyond words' },
    { front: 'Juxtaposition', back: 'Yuxtaposición', hint: 'Side by side' },
    { front: 'Kafkaesque', back: 'Kafkiano', hint: 'Surreal complexity' },
    { front: 'Loquacious', back: 'Locuaz', hint: 'Very talkative' },
    { front: 'Magnanimous', back: 'Magnánimo', hint: 'Generous spirit' },
  ],
};

const SCRAMBLE_WORDS_BY_LEVEL: Record<string, Array<{ word: string; translation: string }>> = {
  A1: [
    { word: 'HOLA', translation: 'Hello' },
    { word: 'AGUA', translation: 'Water' },
    { word: 'CASA', translation: 'House' },
    { word: 'GATO', translation: 'Cat' },
    { word: 'PERRO', translation: 'Dog' },
    { word: 'LIBRO', translation: 'Book' },
  ],
  A2: [
    { word: 'AMIGO', translation: 'Friend' },
    { word: 'COMIDA', translation: 'Food' },
    { word: 'TIEMPO', translation: 'Time/Weather' },
    { word: 'CIUDAD', translation: 'City' },
    { word: 'FAMILIA', translation: 'Family' },
    { word: 'TRABAJO', translation: 'Work' },
  ],
  B1: [
    { word: 'PROBLEMA', translation: 'Problem' },
    { word: 'GOBIERNO', translation: 'Government' },
    { word: 'HISTORIA', translation: 'History' },
    { word: 'PROGRAMA', translation: 'Program' },
    { word: 'SERVICIO', translation: 'Service' },
    { word: 'PROYECTO', translation: 'Project' },
  ],
  B2: [
    { word: 'DESARROLLO', translation: 'Development' },
    { word: 'EXPERIENCIA', translation: 'Experience' },
    { word: 'INFORMACION', translation: 'Information' },
    { word: 'TECNOLOGIA', translation: 'Technology' },
    { word: 'SEGURIDAD', translation: 'Security' },
    { word: 'INVESTIGACION', translation: 'Research' },
  ],
  C1: [
    { word: 'RESPONSABILIDAD', translation: 'Responsibility' },
    { word: 'CIRCUNSTANCIA', translation: 'Circumstance' },
    { word: 'ADMINISTRACION', translation: 'Administration' },
    { word: 'RECONOCIMIENTO', translation: 'Recognition' },
    { word: 'CARACTERISTICA', translation: 'Characteristic' },
    { word: 'REPRESENTACION', translation: 'Representation' },
  ],
  C2: [
    { word: 'INCONMENSURABLE', translation: 'Immeasurable' },
    { word: 'IMPRESCINDIBLE', translation: 'Essential' },
    { word: 'DESAFORTUNADAMENTE', translation: 'Unfortunately' },
    { word: 'SIMULTANEAMENTE', translation: 'Simultaneously' },
    { word: 'EXTRAORDINARIAMENTE', translation: 'Extraordinarily' },
    { word: 'INCOMPREHENSIBLE', translation: 'Incomprehensible' },
  ],
};

const MEMORY_PAIRS_BY_LEVEL: Record<string, Array<{ word: string; translation: string }>> = {
  A1: [
    { word: 'Hola', translation: 'Hello' },
    { word: 'Adiós', translation: 'Goodbye' },
    { word: 'Gracias', translation: 'Thank you' },
    { word: 'Sí', translation: 'Yes' },
    { word: 'No', translation: 'No' },
    { word: 'Amigo', translation: 'Friend' },
  ],
  A2: [
    { word: 'Tiempo', translation: 'Time' },
    { word: 'Dinero', translation: 'Money' },
    { word: 'Trabajo', translation: 'Work' },
    { word: 'Escuela', translation: 'School' },
    { word: 'Comida', translation: 'Food' },
    { word: 'Familia', translation: 'Family' },
  ],
  B1: [
    { word: 'Desarrollo', translation: 'Development' },
    { word: 'Gobierno', translation: 'Government' },
    { word: 'Sociedad', translation: 'Society' },
    { word: 'Problema', translation: 'Problem' },
    { word: 'Cultura', translation: 'Culture' },
    { word: 'Historia', translation: 'History' },
  ],
  B2: [
    { word: 'Experiencia', translation: 'Experience' },
    { word: 'Oportunidad', translation: 'Opportunity' },
    { word: 'Responsabilidad', translation: 'Responsibility' },
    { word: 'Comunicación', translation: 'Communication' },
    { word: 'Investigación', translation: 'Research' },
    { word: 'Tecnología', translation: 'Technology' },
  ],
  C1: [
    { word: 'Trascendencia', translation: 'Significance' },
    { word: 'Complejidad', translation: 'Complexity' },
    { word: 'Sostenibilidad', translation: 'Sustainability' },
    { word: 'Implementación', translation: 'Implementation' },
    { word: 'Infraestructura', translation: 'Infrastructure' },
    { word: 'Interdependencia', translation: 'Interdependence' },
  ],
  C2: [
    { word: 'Idiosincrasia', translation: 'Idiosyncrasy' },
    { word: 'Epistemología', translation: 'Epistemology' },
    { word: 'Inconmensurable', translation: 'Incommensurable' },
    { word: 'Introspección', translation: 'Introspection' },
    { word: 'Yuxtaposición', translation: 'Juxtaposition' },
    { word: 'Serendipidad', translation: 'Serendipity' },
  ],
};

// Kids game content
const KIDS_ANIMALS = [
  { emoji: '🐶', english: 'Dog', translation: 'Perro' },
  { emoji: '🐱', english: 'Cat', translation: 'Gato' },
  { emoji: '🐭', english: 'Mouse', translation: 'Ratón' },
  { emoji: '🐰', english: 'Rabbit', translation: 'Conejo' },
  { emoji: '🦊', english: 'Fox', translation: 'Zorro' },
  { emoji: '🐻', english: 'Bear', translation: 'Oso' },
  { emoji: '🐷', english: 'Pig', translation: 'Cerdo' },
  { emoji: '🐸', english: 'Frog', translation: 'Rana' },
  { emoji: '🐵', english: 'Monkey', translation: 'Mono' },
  { emoji: '🦁', english: 'Lion', translation: 'León' },
];

const KIDS_COLORS = [
  { color: '#FF0000', english: 'Red', translation: 'Rojo' },
  { color: '#0000FF', english: 'Blue', translation: 'Azul' },
  { color: '#00FF00', english: 'Green', translation: 'Verde' },
  { color: '#FFFF00', english: 'Yellow', translation: 'Amarillo' },
  { color: '#FFA500', english: 'Orange', translation: 'Naranja' },
  { color: '#800080', english: 'Purple', translation: 'Morado' },
  { color: '#FFC0CB', english: 'Pink', translation: 'Rosa' },
  { color: '#000000', english: 'Black', translation: 'Negro' },
];

const CEFR_LEVELS = [
  { value: 'A1', label: 'Beginner', emoji: '🌱' },
  { value: 'A2', label: 'Elementary', emoji: '📗' },
  { value: 'B1', label: 'Intermediate', emoji: '📘' },
  { value: 'B2', label: 'Upper-Int', emoji: '📙' },
  { value: 'C1', label: 'Advanced', emoji: '🔥' },
  { value: 'C2', label: 'Mastery', emoji: '🏆' },
];

type GameType = 'match-race' | 'pronunciation' | 'flashcards' | 'word-scramble' | 'memory' | 'kids-animals' | 'kids-colors' | null;

const Games: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, progress, updateProgress, loading: progressLoading } = useUserProgress();
  const { settings, setKidsMode } = useAppSettings();
  const { toast } = useToast();

  const [selectedGame, setSelectedGame] = useState<GameType>(null);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [showKidsGames, setShowKidsGames] = useState(settings.kidsMode);

  const languageCode = activeCourse?.language_code || 'es';
  const currentLanguage = LANGUAGES.find(l => l.code === languageCode);
  const currentCefr = CEFR_LEVELS[difficultyLevel]?.value || 'A1';

  const matchPairs = useMemo(() => 
    MATCH_PAIRS_BY_LEVEL[currentCefr] || MATCH_PAIRS_BY_LEVEL.A1,
    [currentCefr]
  );

  const pronunciationPhrases = useMemo(() => 
    PRONUNCIATION_PHRASES_BY_LEVEL[currentCefr] || PRONUNCIATION_PHRASES_BY_LEVEL.A1,
    [currentCefr]
  );

  const flashcardWords = useMemo(() => 
    FLASHCARD_WORDS_BY_LEVEL[currentCefr] || FLASHCARD_WORDS_BY_LEVEL.A1,
    [currentCefr]
  );

  const scrambleWords = useMemo(() => 
    SCRAMBLE_WORDS_BY_LEVEL[currentCefr] || SCRAMBLE_WORDS_BY_LEVEL.A1,
    [currentCefr]
  );

  const memoryPairs = useMemo(() => 
    MEMORY_PAIRS_BY_LEVEL[currentCefr] || MEMORY_PAIRS_BY_LEVEL.A1,
    [currentCefr]
  );

  const handleGameComplete = useCallback(async (score: number, bonusMessage?: string) => {
    setTotalScore(prev => prev + score);
    setGamesPlayed(prev => prev + 1);

    const xpEarned = Math.floor(score / 2);
    if (progress && xpEarned > 0) {
      await updateProgress({
        total_xp: (progress.total_xp || 0) + xpEarned,
        today_xp: (progress.today_xp || 0) + xpEarned,
      });
    }

    toast({
      title: `🎉 ${t('games.complete')}`,
      description: `${t('common.score')}: ${score} ${t('common.points')} • +${xpEarned} XP${bonusMessage ? ` • ${bonusMessage}` : ''}`,
    });

    setSelectedGame(null);
  }, [progress, updateProgress, toast, t]);

  const handleMatchGameComplete = useCallback(async (score: number, timeRemaining: number, perfectRun: boolean) => {
    handleGameComplete(score, perfectRun ? t('games.perfect') : undefined);
  }, [handleGameComplete, t]);

  const handlePronunciationComplete = useCallback(async (score: number, perfectCount: number, totalAttempts: number) => {
    handleGameComplete(score, perfectCount > 0 ? `${perfectCount} ${t('games.perfect')}` : undefined);
  }, [handleGameComplete, t]);

  const handleFlashCardsComplete = useCallback(async (knownCount: number, totalCards: number) => {
    const score = knownCount * 10;
    handleGameComplete(score, `${knownCount}/${totalCards} ${t('games.gotIt')}`);
  }, [handleGameComplete, t]);

  const handleWordScrambleComplete = useCallback(async (score: number, perfectWords: number) => {
    handleGameComplete(score, `${perfectWords} ${t('games.perfect')}`);
  }, [handleGameComplete, t]);

  const handleMemoryComplete = useCallback(async (score: number, moves: number, time: number) => {
    handleGameComplete(score, `${moves} ${t('common.moves')}`);
  }, [handleGameComplete, t]);

  const handleKidsGameComplete = useCallback(async (score: number, perfectCount: number) => {
    handleGameComplete(score, `${perfectCount} ⭐`);
  }, [handleGameComplete]);

  const toggleKidsMode = useCallback((enabled: boolean) => {
    setShowKidsGames(enabled);
    setKidsMode(enabled);
  }, [setKidsMode]);

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // Active game view
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader
          leftSlot={
            <button onClick={() => setSelectedGame(null)} className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Language & Level Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
            {!showKidsGames && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {CEFR_LEVELS[difficultyLevel]?.emoji} {currentCefr}
              </span>
            )}
          </div>

          {selectedGame === 'match-race' && (
            <TimedMatchGame
              pairs={matchPairs}
              languageCode={languageCode}
              onComplete={handleMatchGameComplete}
              timeLimit={30}
            />
          )}

          {selectedGame === 'pronunciation' && (
            <PronunciationChallenge
              phrases={pronunciationPhrases}
              languageCode={languageCode}
              onComplete={handlePronunciationComplete}
              passingScore={65}
            />
          )}

          {selectedGame === 'flashcards' && (
            <FlashCardGame
              cards={flashcardWords}
              languageCode={languageCode}
              onComplete={handleFlashCardsComplete}
              title={t('games.flashCards')}
            />
          )}

          {selectedGame === 'word-scramble' && (
            <WordScrambleGame
              words={scrambleWords}
              languageCode={languageCode}
              onComplete={handleWordScrambleComplete}
              timeLimit={60}
            />
          )}

          {selectedGame === 'memory' && (
            <MemoryGame
              pairs={memoryPairs}
              languageCode={languageCode}
              onComplete={handleMemoryComplete}
            />
          )}

          {selectedGame === 'kids-animals' && (
            <KidsAnimalGame
              animals={KIDS_ANIMALS}
              languageCode={languageCode}
              onComplete={handleKidsGameComplete}
            />
          )}

          {selectedGame === 'kids-colors' && (
            <KidsColorGame
              colors={KIDS_COLORS}
              languageCode={languageCode}
              onComplete={handleKidsGameComplete}
            />
          )}
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Game selection view
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-lg">{t('games.title')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats Bar */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xp">
                <Star className="w-4 h-4" />
                <span className="font-bold">{totalScore}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>{gamesPlayed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kids Mode Toggle */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showKidsGames ? "bg-banana/20" : "bg-muted"
              )}>
                <Baby className={cn("w-5 h-5", showKidsGames ? "text-banana" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-medium">{t('games.kidsGames')}</p>
                <p className="text-xs text-muted-foreground">{t('games.kidsAnimalsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={showKidsGames}
              onCheckedChange={toggleKidsMode}
            />
          </div>
        </div>

        {/* Difficulty Selector (only for regular games) */}
        {!showKidsGames && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm">{t('games.difficulty')}</span>
              <span className="text-sm font-bold text-primary">
                {CEFR_LEVELS[difficultyLevel]?.emoji} {CEFR_LEVELS[difficultyLevel]?.label}
              </span>
            </div>
            <Slider
              value={[difficultyLevel]}
              onValueChange={(val) => setDifficultyLevel(val[0])}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {CEFR_LEVELS.map((l, i) => (
                <span key={l.value} className={cn(difficultyLevel === i && "text-primary font-medium")}>
                  {l.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Game Cards */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">{t('games.chooseGame')}</h2>

          {showKidsGames ? (
            // Kids Games
            <>
              <GameCard
                icon={Cat}
                iconColor="text-banana"
                iconBg="bg-banana/10"
                title={t('games.kidsAnimals')}
                description={t('games.kidsAnimalsDesc')}
                stats={[
                  { icon: Target, text: `${KIDS_ANIMALS.length} animals` },
                ]}
                onClick={() => setSelectedGame('kids-animals')}
              />
              <GameCard
                icon={Palette}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                title={t('games.kidsColors')}
                description={t('games.kidsColorsDesc')}
                stats={[
                  { icon: Target, text: `${KIDS_COLORS.length} colors` },
                ]}
                onClick={() => setSelectedGame('kids-colors')}
              />
            </>
          ) : (
            // Regular Games
            <>
              <GameCard
                icon={Zap}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                title={t('games.matchRace')}
                description={t('games.matchRaceDesc')}
                stats={[
                  { icon: Timer, text: `30 ${t('games.seconds')}` },
                  { icon: Target, text: `${matchPairs.length} ${t('games.pairs')}` },
                ]}
                onClick={() => setSelectedGame('match-race')}
              />

              <GameCard
                icon={Mic2}
                iconColor="text-success"
                iconBg="bg-success/10"
                title={t('games.pronunciation')}
                description={t('games.pronunciationDesc')}
                stats={[
                  { icon: Target, text: `${pronunciationPhrases.length} ${t('games.phrases')}` },
                  { icon: Star, text: t('games.streakBonuses') },
                ]}
                onClick={() => setSelectedGame('pronunciation')}
              />

              <GameCard
                icon={Layers}
                iconColor="text-banana"
                iconBg="bg-banana/10"
                title={t('games.flashCards')}
                description={t('games.flashCardsDesc')}
                stats={[
                  { icon: Target, text: `${flashcardWords.length} ${t('games.cards')}` },
                ]}
                onClick={() => setSelectedGame('flashcards')}
              />

              <GameCard
                icon={Shuffle}
                iconColor="text-xp"
                iconBg="bg-xp/10"
                title={t('games.wordScramble')}
                description={t('games.wordScrambleDesc')}
                stats={[
                  { icon: Timer, text: `60 ${t('games.seconds')}` },
                  { icon: Target, text: `${scrambleWords.length} ${t('common.words')}` },
                ]}
                onClick={() => setSelectedGame('word-scramble')}
              />

              <GameCard
                icon={Brain}
                iconColor="text-streak"
                iconBg="bg-streak/10"
                title={t('games.memory')}
                description={t('games.memoryDesc')}
                stats={[
                  { icon: Target, text: `${memoryPairs.length} ${t('games.pairs')}` },
                ]}
                onClick={() => setSelectedGame('memory')}
              />
            </>
          )}
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-2xl p-4 text-center">
          <AvatarMascot mood="happy" size="sm" className="mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('games.tip')}
          </p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

// Game Card Component
interface GameCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  stats: Array<{ icon: React.ElementType; text: string }>;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ icon: Icon, iconColor, iconBg, title, description, stats, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-left group"
  >
    <div className="flex items-start gap-4">
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", iconBg)}>
        <Icon className={cn("w-7 h-7", iconColor)} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        <div className="flex items-center gap-3 text-xs">
          {stats.map((stat, i) => (
            <span key={i} className="flex items-center gap-1 text-muted-foreground">
              <stat.icon className="w-3 h-3" /> {stat.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  </button>
);

export default Games;
