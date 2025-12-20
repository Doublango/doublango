import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import ParrotMascot from '@/components/ParrotMascot';
import { LANGUAGES } from '@/lib/languages';
import { Play, Target } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({ streak: 0, lives: 5, crystals: 100, todayXp: 0, dailyGoal: 20 });
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const [{ data: profile }, { data: userProgress }, { data: courses }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
        supabase.from('user_courses').select('*').eq('user_id', user.id).eq('is_active', true).limit(1),
      ]);

      if (!courses?.length) { navigate('/onboarding'); return; }

      setProgress({
        streak: userProgress?.current_streak || 0,
        lives: userProgress?.lives || 5,
        crystals: userProgress?.crystals || 100,
        todayXp: userProgress?.today_xp || 0,
        dailyGoal: profile?.daily_goal_xp || 20,
      });
      setCurrentLanguage(courses[0].language_code);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const language = LANGUAGES.find(l => l.code === currentLanguage);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><ParrotMascot mood="thinking" size="lg" animate /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{language?.flag}</span>
            <span className="font-bold">{language?.name}</span>
          </div>
          <div className="flex gap-2">
            <StatCard type="streak" value={progress.streak} />
            <StatCard type="lives" value={progress.lives} maxValue={5} />
            <StatCard type="crystals" value={progress.crystals} />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <Target className="w-6 h-6 text-xp" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Daily Goal</span>
                <span className="font-bold text-xp">{progress.todayXp}/{progress.dailyGoal} XP</span>
              </div>
              <ProgressBar value={progress.todayXp} max={progress.dailyGoal} variant="xp" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-md text-center">
          <ParrotMascot mood={progress.todayXp >= progress.dailyGoal ? 'celebrating' : 'happy'} size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {progress.todayXp >= progress.dailyGoal ? "Great job today! 🎉" : "Ready to learn?"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {progress.todayXp >= progress.dailyGoal ? "You've reached your daily goal!" : "Continue where you left off"}
          </p>
          <Button onClick={() => navigate('/learn')} size="lg" className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground shadow-glow">
            <Play className="w-6 h-6 mr-2" /> Start Lesson
          </Button>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-md">
          <h3 className="font-bold mb-4">Daily Quests</h3>
          <div className="space-y-3">
            {[{ title: 'Early Bird', desc: 'Complete a lesson', progress: 0, target: 1 },
              { title: 'XP Champion', desc: 'Earn 50 XP today', progress: progress.todayXp, target: 50 },
              { title: 'Perfect Lesson', desc: 'No mistakes', progress: 0, target: 1 }].map((quest, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">🎯</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">{quest.desc}</p>
                </div>
                <span className="text-sm font-bold text-muted-foreground">{quest.progress}/{quest.target}</span>
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