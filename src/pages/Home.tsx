import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import AvatarMascot from '@/components/AvatarMascot';
import LanguageSelector from '@/components/LanguageSelector';
import UILanguageDropdown from '@/components/UILanguageDropdown';
import DarkModeToggle from '@/components/DarkModeToggle';
import UpgradeModal from '@/components/UpgradeModal';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Play, Target, Flame, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { profile, progress, activeCourse, loading: progressLoading } = useUserProgress();
  const { settings } = useAppSettings();
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Redirect to landing if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!authLoading && !progressLoading && user && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [profile, progressLoading, authLoading, user, navigate]);

  // Find next lesson
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

  const startLesson = () => {
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    } else {
      navigate('/learn');
    }
  };

  // Show loading state
  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AvatarMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // Don't render if no user or course yet
  if (!user || !activeCourse) {
    return null;
  }

  const isKidsMode = settings.kidsMode;

  const todayXp = progress?.today_xp || 0;
  const dailyGoal = profile?.daily_goal_xp || 20;
  const goalReached = todayXp >= dailyGoal;

  return (
    <div className={cn('min-h-screen bg-background pb-24', isKidsMode && 'text-lg')}>
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <UILanguageDropdown />
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="p-2 rounded-xl bg-banana/10 hover:bg-banana/20 transition-colors"
            >
              <Crown className="w-5 h-5 text-banana" />
            </button>
            <StatCard type="streak" value={progress?.current_streak || 0} />
            <StatCard type="lives" value={progress?.lives || 5} maxValue={5} />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Daily Goal Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full gradient-banana flex items-center justify-center">
              <Target className="w-6 h-6 text-banana-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{t('home.dailyGoal')}</span>
                <span className="font-bold text-xp">{todayXp}/{dailyGoal} XP</span>
              </div>
              <ProgressBar value={todayXp} max={dailyGoal} variant="xp" />
            </div>
          </div>
          {progress?.current_streak ? (
            <div className="flex items-center gap-2 text-streak">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{progress.current_streak} {t('home.currentStreak')}!</span>
              <span className="text-2xl">🍌</span>
            </div>
          ) : null}
        </div>

        {/* Main CTA Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md text-center">
          <AvatarMascot 
            mood={goalReached ? 'celebrating' : 'happy'} 
            size="lg" 
            className="mx-auto mb-4" 
          />
          <h2 className={cn('text-xl font-bold mb-2', isKidsMode && 'text-2xl')}>
            {goalReached ? t('monkey.goodJob') + " 🍌🎉" : t('monkey.welcome')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {goalReached 
              ? t('monkey.keepGoing')
              : t('home.continueStreak')}
          </p>
          <Button 
            onClick={startLesson} 
            size="lg" 
            className={cn(
              'w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground shadow-banana hover:opacity-90 transition-opacity',
              isKidsMode && 'h-16 text-xl'
            )}
          >
            <Play className="w-6 h-6 mr-2" /> 
            {nextLessonId ? t('common.continue') : t('home.startLearning')}
          </Button>
        </div>

        {/* Daily Quests Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>{t('profile.achievements')}</span>
            <span className="text-lg">🍌</span>
          </h3>
          <div className="space-y-3">
            {[
              { 
                title: 'First Lesson', 
                desc: 'Complete a lesson today', 
                progress: todayXp > 0 ? 1 : 0, 
                target: 1,
                reward: '+5 XP'
              },
              { 
                title: 'XP Hunter', 
                desc: 'Earn 50 XP today', 
                progress: Math.min(todayXp, 50), 
                target: 50,
                reward: '+10 XP'
              },
              { 
                title: 'Perfect Run', 
                desc: 'Complete without mistakes', 
                progress: 0, 
                target: 1,
                reward: '🍌 Banana Bonus'
              }
            ].map((quest, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-banana/20 flex items-center justify-center text-banana">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">{quest.desc}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-muted-foreground">
                    {quest.progress}/{quest.target}
                  </span>
                  <p className="text-xs text-banana">{quest.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Home;
