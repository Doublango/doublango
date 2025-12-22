import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, Clock, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

const PracticeReminders: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));

  const days = [
    { index: 0, short: 'Sun', full: 'Sunday' },
    { index: 1, short: 'Mon', full: 'Monday' },
    { index: 2, short: 'Tue', full: 'Tuesday' },
    { index: 3, short: 'Wed', full: 'Wednesday' },
    { index: 4, short: 'Thu', full: 'Thursday' },
    { index: 5, short: 'Fri', full: 'Friday' },
    { index: 6, short: 'Sat', full: 'Saturday' },
  ];

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  const toggleDay = (dayIndex: number) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(dayIndex)) {
      newDays.delete(dayIndex);
    } else {
      newDays.add(dayIndex);
    }
    setSelectedDays(newDays);
  };

  const handleSave = () => {
    // In a real app, this would save to user preferences and set up push notifications
    localStorage.setItem('practiceReminders', JSON.stringify({
      enabled: remindersEnabled,
      time: selectedTime,
      days: Array.from(selectedDays)
    }));
    
    toast({
      title: remindersEnabled ? 'Reminders enabled!' : 'Reminders disabled',
      description: remindersEnabled 
        ? `We'll remind you at ${selectedTime} on selected days.`
        : 'You won\'t receive practice reminders.',
    });
    
    navigate(-1);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setRemindersEnabled(true);
        toast({
          title: 'Notifications enabled!',
          description: 'You\'ll receive reminders to practice.',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Enable notifications in your browser settings to receive reminders.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Practice Reminders</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Enable Reminders */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">Daily Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified to practice</p>
              </div>
            </div>
            <Switch
              checked={remindersEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestNotificationPermission();
                } else {
                  setRemindersEnabled(false);
                }
              }}
            />
          </div>
        </div>

        {remindersEnabled && (
          <>
            {/* Time Selection */}
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Reminder Time</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'py-2 px-3 rounded-xl text-sm font-medium transition-colors',
                      selectedTime === time
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selection */}
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Reminder Days</h3>
              </div>
              <div className="flex justify-between">
                {days.map((day) => (
                  <button
                    key={day.index}
                    onClick={() => toggleDay(day.index)}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      selectedDays.has(day.index)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                    aria-label={day.full}
                  >
                    {day.short.charAt(0)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {selectedDays.size === 7 
                  ? 'Every day' 
                  : selectedDays.size === 0 
                    ? 'No days selected' 
                    : `${selectedDays.size} days per week`}
              </p>
            </div>

            {/* Preview */}
            <div className="bg-banana/10 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-banana/20 flex items-center justify-center">
                  🍌
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Preview</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "Hey! Time for your daily practice. Your streak is waiting! 🔥"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTime} • {selectedDays.size === 7 ? 'Every day' : `${selectedDays.size} days/week`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Consistent practice is key to language learning.</p>
          <p className="mt-1">Even 5 minutes a day can make a difference!</p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-12 text-lg font-bold rounded-2xl gradient-primary"
        >
          <Check className="w-5 h-5 mr-2" />
          Save Settings
        </Button>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default PracticeReminders;
