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
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Gamepad2, 
  Zap, 
  Mic2, 
  Trophy, 
  ArrowLeft,
  Globe,
  Star,
  Timer,
  Target
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

const CEFR_LEVELS = [
  { value: 'A1', label: 'Beginner', emoji: '🌱' },
  { value: 'A2', label: 'Elementary', emoji: '📗' },
  { value: 'B1', label: 'Intermediate', emoji: '📘' },
  { value: 'B2', label: 'Upper-Int', emoji: '📙' },
  { value: 'C1', label: 'Advanced', emoji: '🔥' },
  { value: 'C2', label: 'Mastery', emoji: '🏆' },
];

type GameType = 'match-race' | 'pronunciation' | null;

const Games: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, progress, updateProgress, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();
  const { toast } = useToast();

  const [selectedGame, setSelectedGame] = useState<GameType>(null);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

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

  const handleMatchGameComplete = useCallback(async (score: number, timeRemaining: number, perfectRun: boolean) => {
    setTotalScore(prev => prev + score);
    setGamesPlayed(prev => prev + 1);

    // Award XP
    const xpEarned = Math.floor(score / 2);
    if (progress && xpEarned > 0) {
      await updateProgress({
        total_xp: (progress.total_xp || 0) + xpEarned,
        today_xp: (progress.today_xp || 0) + xpEarned,
      });
    }

    toast({
      title: perfectRun ? '🎉 Perfect Run!' : '✅ Game Complete!',
      description: `You earned ${score} points and ${xpEarned} XP${timeRemaining > 0 ? ` with ${timeRemaining}s to spare!` : ''}`,
    });

    setSelectedGame(null);
  }, [progress, updateProgress, toast]);

  const handlePronunciationComplete = useCallback(async (score: number, perfectCount: number, totalAttempts: number) => {
    setTotalScore(prev => prev + score);
    setGamesPlayed(prev => prev + 1);

    // Award XP
    const xpEarned = Math.floor(score / 2) + perfectCount * 5;
    if (progress && xpEarned > 0) {
      await updateProgress({
        total_xp: (progress.total_xp || 0) + xpEarned,
        today_xp: (progress.today_xp || 0) + xpEarned,
      });
    }

    toast({
      title: perfectCount > 0 ? '🌟 Great Pronunciation!' : '✅ Challenge Complete!',
      description: `You earned ${score} points, ${perfectCount} perfect scores, and ${xpEarned} XP!`,
    });

    setSelectedGame(null);
  }, [progress, updateProgress, toast]);

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
              {t('common.back', 'Back')}
            </button>
          }
        />

        <main className="px-4 py-6 max-w-lg mx-auto">
          {/* Language & Level Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {CEFR_LEVELS[difficultyLevel]?.emoji} {currentCefr}
            </span>
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
          <h1 className="font-bold text-lg">{t('games.title', 'Language Games')}</h1>
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

        {/* Difficulty Selector */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">{t('games.difficulty', 'Difficulty Level')}</span>
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

        {/* Game Cards */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">{t('games.chooseGame', 'Choose a Game')}</h2>

          {/* Match Race */}
          <button
            onClick={() => setSelectedGame('match-race')}
            className="w-full bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Match Race</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Race against the clock to match word pairs! Build streaks for bonus points.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="w-3 h-3" /> 30 seconds
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Target className="w-3 h-3" /> {matchPairs.length} pairs
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Pronunciation Challenge */}
          <button
            onClick={() => setSelectedGame('pronunciation')}
            className="w-full bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic2 className="w-7 h-7 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Pronunciation Challenge</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Practice speaking and earn points for accurate pronunciation!
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Target className="w-3 h-3" /> {pronunciationPhrases.length} phrases
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Star className="w-3 h-3" /> Streak bonuses
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-2xl p-4 text-center">
          <AvatarMascot mood="happy" size="sm" className="mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('games.tip', 'Tip: Higher difficulty levels give more XP!')}
          </p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Games;
