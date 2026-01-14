import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';
import ProgressBar from '@/components/ProgressBar';
import LanguageSelector from '@/components/LanguageSelector';
import AppHeader from '@/components/AppHeader';
import UpgradeModal from '@/components/UpgradeModal';
import FocusModeWidget from '@/components/FocusModeWidget';
import AnimatedParrot from '@/components/AnimatedParrot';
import FloatingParticles from '@/components/FloatingParticles';
import StreakFlame from '@/components/StreakFlame';
import XPBurst from '@/components/XPBurst';
import Confetti from '@/components/Confetti';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { LANGUAGES } from '@/lib/languages';
import { playSound } from '@/lib/gameSounds';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { 
  Play, Target, Crown, Sparkles, RotateCcw, Zap, Gamepad2, 
  Heart, Trophy, Star, Gift, ChevronRight, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { profile, progress, activeCourse, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();
  const { recordXpEarned, session: focusSession } = useFocusMode();
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [prevTodayXp, setPrevTodayXp] = useState<number | null>(null);
  const [showXPBurst, setShowXPBurst] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Track XP changes for Focus Mode and show burst animation
  // NOTE: Avoid auto-playing sounds just by navigating to Home.
  useEffect(() => {
    const currentXp = progress?.today_xp || 0;
    if (prevTodayXp !== null && currentXp > prevTodayXp) {
      const gained = currentXp - prevTodayXp;
      setXpGained(gained);
      setShowXPBurst(true);
      hapticSuccess();

      if (focusSession.isActive) {
        recordXpEarned(gained);
      }

      // Check if goal just reached (visual celebration only)
      const dailyGoal = profile?.daily_goal_xp || 20;
      if (prevTodayXp < dailyGoal && currentXp >= dailyGoal) {
        setShowConfetti(true);
      }
    }
    setPrevTodayXp(currentXp);
  }, [progress?.today_xp, prevTodayXp, focusSession.isActive, recordXpEarned, profile?.daily_goal_xp]);

  const currentLanguage = LANGUAGES.find(l => l.code === activeCourse?.language_code);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !progressLoading && user && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [profile, progressLoading, authLoading, user, navigate]);

  useEffect(() => {
    const findNextLesson = async () => {
      if (!activeCourse || !user) return;

      try {
        const { data: units } = await supabase
          .from('units')
          .select('id')
          .eq('language_code', activeCourse.language_code)
          .order('unit_number');

        if (!units?.length) return;

        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, unit_id, lesson_number')
          .in('unit_id', units.map(u => u.id))
          .order('lesson_number');

        if (!lessons?.length) return;

        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id);

        const completedIds = new Set(completions?.map(c => c.lesson_id) || []);
        const nextLesson = lessons.find(l => !completedIds.has(l.id));
        if (nextLesson) {
          setNextLessonId(nextLesson.id);
        }
      } catch (error) {
        console.error('Error finding next lesson:', error);
      }
    };

    if (!progressLoading && activeCourse) {
      findNextLesson();
    }
  }, [activeCourse, progressLoading, user]);

  const startLesson = useCallback(() => {
    hapticLight();
    playSound('whoosh');
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    } else {
      navigate('/learn');
    }
  }, [nextLessonId, navigate]);

  const handleNavClick = useCallback((path: string) => {
    hapticLight();
    navigate(path);
  }, [navigate]);

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AnimatedParrot mood="thinking" size="xl" showSpeechBubble speechText="Loading..." />
      </div>
    );
  }

  if (!user || !activeCourse) {
    return null;
  }

  const isKidsMode = settings.kidsMode;
  const todayXp = progress?.today_xp || 0;
  const dailyGoal = profile?.daily_goal_xp || 20;
  const goalReached = todayXp >= dailyGoal;
  const streak = progress?.current_streak || 0;
  const lives = progress?.lives || 5;
  const crystals = progress?.crystals || 0;

  return (
    <div className={cn('min-h-screen bg-background pb-24 relative overflow-hidden', isKidsMode && 'text-lg')}>
      {/* Background floating particles */}
      <FloatingParticles 
        count={15} 
        emojis={isKidsMode ? ['🌈', '🦋', '🌸', '⭐', '🎈'] : ['🍌', '⭐', '✨', '🎯', '💎']} 
      />
      
      {/* Confetti celebration */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} bananaTheme />

      {/* Header */}
      <AppHeader leftSlot={<LanguageSelector />} />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5 relative z-10">
        {/* Hero Section with Parrot */}
        <div className="relative bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-6 shadow-lg overflow-hidden border border-border/50">
          {/* Decorative background */}
          {currentLanguage && (
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-[16rem] select-none">{currentLanguage.flag}</span>
            </div>
          )}
          
          {/* XP Burst animation */}
          <XPBurst amount={xpGained} trigger={showXPBurst} onComplete={() => setShowXPBurst(false)} />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Top row: lives + upgrade (moved out of header to prevent overlap) */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-heart/10 border border-heart/20">
                <Heart className="w-4 h-4 text-heart animate-heartbeat" fill="currentColor" />
                <span className="text-sm font-black text-heart">{lives}</span>
              </div>

              <button
                onClick={() => {
                  hapticLight();
                  setShowUpgradeModal(true);
                }}
                className="p-2 rounded-xl bg-banana/10 hover:bg-banana/20 transition-all hover:scale-110 active:scale-95"
                aria-label={t('subscription.upgradeToPremium')}
              >
                <Crown className="w-5 h-5 text-banana" />
              </button>
            </div>

            {/* Streak display */}
            {streak > 0 && (
              <div className="absolute -top-2 -right-2">
                <StreakFlame streak={streak} />
              </div>
            )}
            
            {/* Animated Parrot Character */}
            <div className="relative mb-4">
              <AnimatedParrot 
                mood={goalReached ? 'celebrating' : streak > 0 ? 'excited' : 'happy'} 
                size="xl"
                showSpeechBubble={goalReached}
                speechText={goalReached ? t('monkey.goodJob') + " 🎉" : undefined}
              />
            </div>
            
            {/* Language Badge */}
            {currentLanguage && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 mb-3 border border-primary/20">
                <span className="text-xl">{currentLanguage.flag}</span>
                <span className="text-sm font-bold text-primary">{currentLanguage.name}</span>
              </div>
            )}
            
            {/* Greeting */}
            <h2 className={cn('text-xl font-black mb-1', isKidsMode && 'text-2xl')}>
              {goalReached ? t('monkey.goodJob') + " 🍌🎉" : t('monkey.welcome')}
            </h2>
            <p className="text-muted-foreground text-sm mb-5 text-center">
              {goalReached ? t('monkey.keepGoing') : t('home.continueStreak')}
            </p>
            
            {/* CTA Button with animation */}
            <Button 
              onClick={startLesson} 
              size="lg" 
              className={cn(
                'w-full h-14 text-lg font-black rounded-2xl gradient-banana text-banana-foreground shadow-banana',
                'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] transition-all duration-200',
                'flex items-center justify-center gap-2',
                isKidsMode && 'h-16 text-xl'
              )}
            >
              <Play className="w-6 h-6" fill="currentColor" /> 
              {nextLessonId ? t('common.continue') : t('home.startLearning')}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Daily Progress Card */}
        <div 
          className="bg-card rounded-2xl p-5 shadow-md card-interactive border border-border/50"
          onClick={() => handleNavClick('/profile')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-xp flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-muted-foreground">{t('home.dailyGoal')}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-xp" fill="currentColor" />
                  <span className="font-black text-xp">{todayXp}/{dailyGoal} XP</span>
                </div>
              </div>
              <ProgressBar value={todayXp} max={dailyGoal} variant="xp" />
              {goalReached && (
                <div className="flex items-center gap-1 mt-2 text-success">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold">{t('home.goalComplete')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Focus Mode Widget */}
        <FocusModeWidget />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Practice */}
          <button
            onClick={() => handleNavClick('/review')}
            className="bg-card p-4 rounded-2xl shadow-md card-interactive border border-border/50 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <p className="font-bold text-sm">{t('home.practice')}</p>
            <p className="text-xs text-muted-foreground">{t('home.reviewWords')}</p>
          </button>
          
          {/* Games */}
          <button
            onClick={() => handleNavClick('/games')}
            className="bg-card p-4 rounded-2xl shadow-md card-interactive border border-border/50 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6 text-success" />
            </div>
            <p className="font-bold text-sm">{t('nav.games')}</p>
            <p className="text-xs text-muted-foreground">{t('home.funPractice')}</p>
          </button>
          
          {/* Speed Challenge */}
          <button
            onClick={() => handleNavClick('/timed-challenge')}
            className="bg-card p-4 rounded-2xl shadow-md card-interactive border border-border/50 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-streak/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-streak" />
            </div>
            <p className="font-bold text-sm">{t('home.speed')}</p>
            <p className="text-xs text-muted-foreground">{t('home.speedChallenge')}</p>
          </button>
          
          {/* Review */}
          <button
            onClick={() => handleNavClick('/review')}
            className="bg-card p-4 rounded-2xl shadow-md card-interactive border border-border/50 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-6 h-6 text-secondary" />
            </div>
            <p className="font-bold text-sm">{t('home.quickReview')}</p>
            <p className="text-xs text-muted-foreground">{t('home.seeAll')}</p>
          </button>
        </div>

        {/* Daily Quests Card */}
        <div className="bg-card rounded-2xl p-5 shadow-md border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-banana" />
              <span>{t('profile.achievements')}</span>
            </h3>
            <span className="text-xl">🍌</span>
          </div>
          
          <div className="space-y-3">
            {[
              { 
                title: t('home.quests.firstLesson'), 
                desc: t('home.quests.firstLessonDesc'), 
                progress: todayXp > 0 ? 1 : 0, 
                target: 1,
                reward: '+5 XP',
                emoji: '📚',
                completed: todayXp > 0,
              },
              { 
                title: t('home.quests.xpHunter'), 
                desc: t('home.quests.xpHunterDesc'), 
                progress: Math.min(todayXp, 50), 
                target: 50,
                reward: '+10 XP',
                emoji: '⚡',
                completed: todayXp >= 50,
              },
              { 
                title: t('home.quests.perfectRun'), 
                desc: t('home.quests.perfectRunDesc'), 
                progress: 0, 
                target: 1,
                reward: t('home.quests.bananaBonus'),
                emoji: '🌟',
                completed: false,
              }
            ].map((quest, i) => (
              <div 
                key={i} 
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all',
                  quest.completed 
                    ? 'bg-success/10 border border-success/30' 
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-xl',
                  quest.completed ? 'bg-success/20' : 'bg-banana/20'
                )}>
                  {quest.completed ? '✅' : quest.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{quest.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{quest.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn(
                    'text-sm font-bold',
                    quest.completed ? 'text-success' : 'text-muted-foreground'
                  )}>
                    {quest.progress}/{quest.target}
                  </span>
                  <p className="text-xs text-banana font-semibold">{quest.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus tip card */}
        <div 
          className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-4 border border-primary/20 card-interactive"
          onClick={() => handleNavClick('/talk')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">💬 {t('nav.talk')}</p>
              <p className="text-xs text-muted-foreground">{t('home.continueStreak')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </main>

      <BottomNavigation />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Home;
