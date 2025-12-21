import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import BottomNavigation from '@/components/BottomNavigation';
import ParrotMascot from '@/components/ParrotMascot';
import { Button } from '@/components/ui/button';
import { RotateCcw, Target, Zap, Brain, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const reviewModes = [
  {
    id: 'practice',
    title: 'Practice',
    description: 'Review words you\'ve learned',
    icon: RotateCcw,
    color: 'bg-primary/10 text-primary',
    available: true,
  },
  {
    id: 'mistakes',
    title: 'Mistakes',
    description: 'Practice your weak spots',
    icon: Target,
    color: 'bg-destructive/10 text-destructive',
    available: true,
  },
  {
    id: 'speed',
    title: 'Speed Review',
    description: 'Quick fire questions',
    icon: Zap,
    color: 'bg-warning/10 text-warning',
    available: false,
  },
  {
    id: 'hard',
    title: 'Hard Words',
    description: 'Your most challenging vocabulary',
    icon: Brain,
    color: 'bg-secondary/10 text-secondary',
    available: false,
  },
];

const Review: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading } = useUserProgress();

  // Only redirect to auth AFTER loading is complete
  React.useEffect(() => {
    if (!authLoading && !progressLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, progressLoading, navigate]);

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParrotMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-center max-w-lg mx-auto">
          <h1 className="font-bold text-lg">Review Hub</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <ParrotMascot mood="happy" size="md" />
            <div>
              <h2 className="font-bold text-lg">Keep practicing!</h2>
              <p className="text-sm text-muted-foreground">
                Review helps you remember
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{progress?.total_xp || 0}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-streak">{progress?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Review Modes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg px-1">Review Modes</h3>
          
          {reviewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => mode.available && navigate(`/review/${mode.id}`)}
              disabled={!mode.available}
              className={cn(
                'w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all',
                mode.available ? 'hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', mode.color)}>
                <mode.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{mode.title}</p>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
              {!mode.available && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Timed Practice */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-xp/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-xp" />
            </div>
            <div>
              <h3 className="font-bold">Timed Challenge</h3>
              <p className="text-sm text-muted-foreground">Answer as many as you can in 60 seconds</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/timed-challenge')}
            className="w-full gradient-xp text-primary-foreground font-bold"
          >
            <Zap className="w-5 h-5 mr-2" /> Start Timed Challenge
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Review;
