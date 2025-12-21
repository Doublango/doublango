import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import ParrotMascot from '@/components/ParrotMascot';
import { LANGUAGES } from '@/lib/languages';
import { Play, Target } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, progress, activeCourse, loading: progressLoading, refetch } = useUserProgress();
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  // Redirect to auth if not logged in (only after auth check is complete)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if not completed (wait for both auth and progress to load)
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
        // Get all units for the language
        const { data: units } = await supabase
          .from('units')
          .select('id')
          .eq('language_code', activeCourse.language_code)
          .order('unit_number');

        if (!units?.length) return;

        // Get all lessons
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, unit_id, lesson_number')
          .in('unit_id', units.map(u => u.id))
          .order('lesson_number');

        if (!lessons?.length) return;

        // Get completed lessons
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id);

        const completedIds = new Set(completions?.map(c => c.lesson_id) || []);

        // Find first incomplete lesson
        const nextLesson = lessons.find(l => !completedIds.has(l.id));
        if (nextLesson) {
          setNextLessonId(nextLesson.id);
        }
      } catch (error) {
        console.error('Error finding next lesson:', error);
      }
    };

    if (!progressLoading) {
      findNextLesson();
    }
  }, [activeCourse, progressLoading, user]);

  const language = LANGUAGES.find(l => l.code === activeCourse?.language_code);

  const startLesson = () => {
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    } else {
      navigate('/learn');
    }
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParrotMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  if (!user || !activeCourse) {
    return null;
  }

  const todayXp = progress?.today_xp || 0;
  const dailyGoal = profile?.daily_goal_xp || 20;
  const goalReached = todayXp >= dailyGoal;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{language?.flag}</span>
            <span className="font-bold">{language?.name}</span>
          </div>
          <div className="flex gap-2">
            <StatCard type="streak" value={progress?.current_streak || 0} />
            <StatCard type="lives" value={progress?.lives || 5} maxValue={5} />
            <StatCard type="crystals" value={progress?.crystals || 0} />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Daily Goal Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <Target className="w-6 h-6 text-xp" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Daily Goal</span>
                <span className="font-bold text-xp">{todayXp}/{dailyGoal} XP</span>
              </div>
              <ProgressBar value={todayXp} max={dailyGoal} variant="xp" />
            </div>
          </div>
        </div>

        {/* Main CTA Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md text-center">
          <ParrotMascot 
            mood={goalReached ? 'celebrating' : 'happy'} 
            size="lg" 
            className="mx-auto mb-4" 
          />
          <h2 className="text-xl font-bold mb-2">
            {goalReached ? "Great job today! 🎉" : "Ready to learn?"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {goalReached 
              ? "You've reached your daily goal!" 
              : "Continue where you left off"}
          </p>
          <Button 
            onClick={startLesson} 
            size="lg" 
            className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground shadow-glow"
          >
            <Play className="w-6 h-6 mr-2" /> 
            {nextLessonId ? 'Start Lesson' : 'Continue Learning'}
          </Button>
        </div>

        {/* Daily Quests Card */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <h3 className="font-bold mb-4">Daily Quests</h3>
          <div className="space-y-3">
            {[
              { 
                title: 'Early Bird', 
                desc: 'Complete a lesson', 
                progress: todayXp > 0 ? 1 : 0, 
                target: 1 
              },
              { 
                title: 'XP Champion', 
                desc: 'Earn 50 XP today', 
                progress: Math.min(todayXp, 50), 
                target: 50 
              },
              { 
                title: 'Perfect Lesson', 
                desc: 'Complete without mistakes', 
                progress: 0, 
                target: 1 
              }
            ].map((quest, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">{quest.desc}</p>
                </div>
                <span className="text-sm font-bold text-muted-foreground">
                  {quest.progress}/{quest.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Home;
