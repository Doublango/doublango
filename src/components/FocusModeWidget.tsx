import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { Target, Coffee, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FocusModeWidgetProps {
  className?: string;
  compact?: boolean;
}

const FocusModeWidget: React.FC<FocusModeWidgetProps> = ({ className, compact }) => {
  const navigate = useNavigate();
  const { 
    settings, 
    session, 
    isGoalReached, 
    xpRemaining,
    focusTimeElapsed,
    breakTimeRemaining,
    startFocusSession,
  } = useFocusMode();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Not enabled
  if (!settings.enabled) {
    return (
      <button
        onClick={() => navigate('/focus')}
        className={cn(
          'bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-muted/50 transition-colors w-full',
          className
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Target className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">Focus Mode</p>
          <p className="text-xs text-muted-foreground">Tap to set up</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>
    );
  }

  // Active session
  if (session.isActive) {
    if (session.isOnBreak) {
      return (
        <div className={cn(
          'bg-success/10 border-2 border-success rounded-2xl p-4',
          className
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Break Time</p>
              <p className="text-2xl font-mono font-bold text-success">
                {formatTime(breakTimeRemaining)}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/focus')}>
              View
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        'bg-primary/10 border-2 border-primary rounded-2xl p-4',
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-banana flex items-center justify-center">
            <Target className="w-5 h-5 text-banana-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {isGoalReached ? '🎉 Goal Reached!' : 'Focus Session'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isGoalReached 
                ? 'Take a break or keep learning!' 
                : `${xpRemaining} XP to unlock break`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/focus')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full gradient-banana transition-all duration-300"
            style={{ width: `${Math.min(100, (session.xpEarned / settings.xpGoal) * 100)}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{session.xpEarned} / {settings.xpGoal} XP</span>
          <span>{formatTime(focusTimeElapsed)}</span>
        </div>
      </div>
    );
  }

  // Enabled but no active session
  return (
    <button
      onClick={() => {
        startFocusSession(0);
        navigate('/focus');
      }}
      className={cn(
        'bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-muted/50 transition-colors w-full border-2 border-dashed border-primary/30',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl gradient-banana flex items-center justify-center">
        <Zap className="w-5 h-5 text-banana-foreground" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-sm">Start Focus Session</p>
        <p className="text-xs text-muted-foreground">Earn {settings.xpGoal} XP to unlock break</p>
      </div>
      <ChevronRight className="w-5 h-5 text-primary" />
    </button>
  );
};

export default FocusModeWidget;
