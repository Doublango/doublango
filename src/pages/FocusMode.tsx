import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import AppHeader from '@/components/AppHeader';
import AvatarMascot from '@/components/AvatarMascot';
import BottomNavigation from '@/components/BottomNavigation';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { requestNotificationPermission, canUseNotifications } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';
import { useUserProgress } from '@/hooks/useUserProgress';
import { 
  ArrowLeft, Target, Clock, Calendar, Bell, Play, Pause, 
  CheckCircle, Timer, Trophy, Zap, Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DISTRACTING_APPS = [
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'twitter', name: 'X / Twitter', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '👤' },
  { id: 'reddit', name: 'Reddit', icon: '🔴' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻' },
  { id: 'games', name: 'Mobile Games', icon: '🎮' },
];

const XP_GOALS = [25, 50, 75, 100, 150];
const BREAK_DURATIONS = [5, 10, 15, 20, 30];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FocusMode: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { progress } = useUserProgress();
  const {
    settings,
    session,
    updateSettings,
    startFocusSession,
    endFocusSession,
    takeBreak,
    endBreak,
    isGoalReached,
    xpRemaining,
    focusTimeElapsed,
    breakTimeRemaining,
  } = useFocusMode();

  const [showSchedule, setShowSchedule] = useState(false);

  const handleEnableToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast({
          title: 'Notifications Required',
          description: 'Enable notifications to get focus reminders.',
          variant: 'destructive',
        });
      }
    }
    updateSettings({ enabled });
  };

  const toggleDay = (index: number) => {
    const newDays = [...settings.schedule.days];
    newDays[index] = !newDays[index];
    updateSettings({
      schedule: { ...settings.schedule, days: newDays },
    });
  };

  const toggleApp = (appId: string) => {
    const newApps = settings.distractingApps.includes(appId)
      ? settings.distractingApps.filter((id) => id !== appId)
      : [...settings.distractingApps, appId];
    updateSettings({ distractingApps: newApps });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    const currentXp = progress?.today_xp || 0;
    startFocusSession(currentXp);
    toast({
      title: '🎯 Focus Session Started!',
      description: `Earn ${settings.xpGoal} XP to unlock your break.`,
    });
  };

  const handleTakeBreak = () => {
    if (!isGoalReached) {
      toast({
        title: 'Keep Going!',
        description: `Earn ${xpRemaining} more XP to unlock your break.`,
        variant: 'destructive',
      });
      return;
    }
    takeBreak();
    toast({
      title: '☕ Break Time!',
      description: `Enjoy your ${settings.breakDuration} minute break.`,
    });
  };

  const handleEndBreak = () => {
    endBreak();
    toast({
      title: '🚀 Back to Learning!',
      description: 'New focus cycle started.',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        leftSlot={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Focus Mode</h1>
          </div>
        }
      />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Active Session Card */}
        {session.isActive && (
          <div className={cn(
            'rounded-3xl p-6 shadow-lg',
            session.isOnBreak ? 'bg-success/10 border-2 border-success' : 'bg-primary/10 border-2 border-primary'
          )}>
            <div className="text-center mb-4">
              <AvatarMascot 
                mood={isGoalReached ? 'celebrating' : session.isOnBreak ? 'happy' : 'thinking'} 
                size="lg" 
                animate 
              />
            </div>

            {session.isOnBreak ? (
              <>
                <div className="text-center mb-4">
                  <Coffee className="w-8 h-8 text-success mx-auto mb-2" />
                  <h2 className="text-xl font-bold">Break Time!</h2>
                  <p className="text-4xl font-mono font-bold text-success mt-2">
                    {formatTime(breakTimeRemaining)}
                  </p>
                  <p className="text-sm text-muted-foreground">remaining</p>
                </div>
                <Button onClick={handleEndBreak} className="w-full gradient-banana text-banana-foreground">
                  <Play className="w-5 h-5 mr-2" /> End Break & Continue
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">
                    {isGoalReached ? '🎉 Goal Reached!' : '🎯 Focus Session'}
                  </h2>
                  <div className="flex justify-center gap-6 mt-4">
                    <div>
                      <p className="text-3xl font-bold text-primary">{session.xpEarned}</p>
                      <p className="text-xs text-muted-foreground">XP Earned</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{formatTime(focusTimeElapsed)}</p>
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-xp">{xpRemaining}</p>
                      <p className="text-xs text-muted-foreground">XP to Goal</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full gradient-banana transition-all duration-300"
                    style={{ width: `${Math.min(100, (session.xpEarned / settings.xpGoal) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleTakeBreak}
                    disabled={!isGoalReached}
                    variant={isGoalReached ? 'default' : 'outline'}
                    className={cn(isGoalReached && 'gradient-banana text-banana-foreground')}
                  >
                    <Coffee className="w-4 h-4 mr-2" /> Take Break
                  </Button>
                  <Button onClick={() => navigate('/learn')} variant="outline">
                    <Zap className="w-4 h-4 mr-2" /> Learn Now
                  </Button>
                </div>

                <Button 
                  onClick={endFocusSession} 
                  variant="ghost" 
                  className="w-full mt-2 text-muted-foreground"
                >
                  End Session
                </Button>
              </>
            )}
          </div>
        )}

        {/* Enable Focus Mode */}
        {!session.isActive && (
          <div className="bg-card rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-banana flex items-center justify-center">
                  <Target className="w-6 h-6 text-banana-foreground" />
                </div>
                <div>
                  <h2 className="font-bold">Focus Mode</h2>
                  <p className="text-sm text-muted-foreground">
                    {settings.enabled ? 'Ready to focus' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Switch checked={settings.enabled} onCheckedChange={handleEnableToggle} />
            </div>

            {settings.enabled && (
              <Button onClick={handleStartSession} className="w-full gradient-banana text-banana-foreground">
                <Play className="w-5 h-5 mr-2" /> Start Focus Session
              </Button>
            )}
          </div>
        )}

        {/* XP Goal Setting */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-xp" />
            <div>
              <h3 className="font-bold">XP Goal</h3>
              <p className="text-sm text-muted-foreground">Earn before taking a break</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {XP_GOALS.map((xp) => (
              <button
                key={xp}
                onClick={() => updateSettings({ xpGoal: xp })}
                className={cn(
                  'px-4 py-2 rounded-xl font-bold transition-all',
                  settings.xpGoal === xp
                    ? 'gradient-banana text-banana-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {xp} XP
              </button>
            ))}
          </div>
        </div>

        {/* Break Duration */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Coffee className="w-6 h-6 text-success" />
            <div>
              <h3 className="font-bold">Break Duration</h3>
              <p className="text-sm text-muted-foreground">Time allowed after reaching goal</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {BREAK_DURATIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => updateSettings({ breakDuration: mins })}
                className={cn(
                  'px-4 py-2 rounded-xl font-bold transition-all',
                  settings.breakDuration === mins
                    ? 'gradient-banana text-banana-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <button 
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <div className="text-left">
                <h3 className="font-bold">Study Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.schedule.enabled ? 'Scheduled reminders on' : 'No schedule set'}
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.schedule.enabled} 
              onCheckedChange={(enabled) => updateSettings({ schedule: { ...settings.schedule, enabled } })}
              onClick={(e) => e.stopPropagation()}
            />
          </button>

          {showSchedule && settings.schedule.enabled && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Days</p>
                <div className="flex gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        'w-10 h-10 rounded-full text-sm font-bold transition-all',
                        settings.schedule.days[i]
                          ? 'gradient-banana text-banana-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Start Time</p>
                  <input
                    type="time"
                    value={settings.schedule.startTime}
                    onChange={(e) => updateSettings({ 
                      schedule: { ...settings.schedule, startTime: e.target.value } 
                    })}
                    className="w-full p-2 rounded-xl bg-muted border-0"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">End Time</p>
                  <input
                    type="time"
                    value={settings.schedule.endTime}
                    onChange={(e) => updateSettings({ 
                      schedule: { ...settings.schedule, endTime: e.target.value } 
                    })}
                    className="w-full p-2 rounded-xl bg-muted border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Distracting Apps (informational) */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-destructive" />
            <div>
              <h3 className="font-bold">Apps to Limit</h3>
              <p className="text-sm text-muted-foreground">Get reminded when using these</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {DISTRACTING_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => toggleApp(app.id)}
                className={cn(
                  'p-3 rounded-xl text-center transition-all',
                  settings.distractingApps.includes(app.id)
                    ? 'bg-destructive/10 border-2 border-destructive'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <span className="text-2xl">{app.icon}</span>
                <p className="text-xs mt-1 truncate">{app.name}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            💡 This is a commitment reminder. We can't actually block apps in a web browser.
          </p>
        </div>

        {/* Notification Status */}
        {!canUseNotifications() && settings.enabled && (
          <div className="bg-destructive/10 rounded-2xl p-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-sm">Notifications Disabled</p>
              <p className="text-xs text-muted-foreground">Enable for focus reminders</p>
            </div>
            <Button size="sm" onClick={() => requestNotificationPermission()}>
              Enable
            </Button>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default FocusMode;
