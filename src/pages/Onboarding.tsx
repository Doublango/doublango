import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MonkeyMascot from '@/components/MonkeyMascot';
import { LANGUAGES, DAILY_GOALS, MOTIVATIONS } from '@/lib/languages';
import { Check, ChevronRight, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | ''>('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [motivation, setMotivation] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        toast({ title: '🍌 Notifications enabled!', description: "I'll remind you to practice!" });
      }
    }
    setStep(5);
  };

  const skipNotifications = () => {
    setStep(5);
  };

  const handleStartPlacementTest = async () => {
    if (!selectedLanguage) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save basic profile settings
      await supabase.from('profiles').update({ 
        daily_goal_xp: dailyGoal, 
        motivation
      }).eq('id', user.id);
      
      // Deactivate all existing courses first
      await supabase.from('user_courses').update({ is_active: false }).eq('user_id', user.id);
      
      // Create course entry
      await supabase.from('user_courses').upsert(
        { 
          user_id: user.id, 
          language_code: selectedLanguage as LanguageCode, 
          is_active: true 
        },
        { onConflict: 'user_id,language_code' }
      );
      
      navigate('/placement-test', { state: { languageCode: selectedLanguage } });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartFromScratch = async () => {
    if (!selectedLanguage) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile settings and mark onboarding as completed
      await supabase.from('profiles').update({ 
        daily_goal_xp: dailyGoal, 
        motivation,
        onboarding_completed: true 
      }).eq('id', user.id);
      
      // Deactivate all existing courses first
      await supabase.from('user_courses').update({ is_active: false }).eq('user_id', user.id);
      
      // Upsert the selected course
      await supabase.from('user_courses').upsert(
        { 
          user_id: user.id, 
          language_code: selectedLanguage as LanguageCode, 
          is_active: true,
          proficiency_level: 'A1',
          current_unit: 1,
          current_lesson: 1,
        },
        { onConflict: 'user_id,language_code' }
      );
      
      navigate('/home');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-banana/10 to-background flex flex-col p-6">
      <div className="flex gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className={cn('h-2 flex-1 rounded-full transition-colors', s <= step ? 'gradient-banana' : 'bg-muted')} />
        ))}
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Step 1: Choose Language */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <MonkeyMascot mood="excited" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">What do you want to learn?</h1>
              <p className="text-muted-foreground">Pick a language to get started! 🍌</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code as LanguageCode)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    selectedLanguage === lang.code ? 'border-banana bg-banana/10 shadow-banana' : 'border-border hover:border-banana/50'
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <p className="font-semibold mt-1">{lang.name}</p>
                  <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Daily Goal */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <MonkeyMascot mood="thinking" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Set your daily goal</h1>
              <p className="text-muted-foreground">How many bananas can you earn? 🍌</p>
            </div>
            <div className="space-y-3">
              {DAILY_GOALS.map((goal) => (
                <button
                  key={goal.xp}
                  onClick={() => setDailyGoal(goal.xp)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all',
                    dailyGoal === goal.xp ? 'border-banana bg-banana/10' : 'border-border hover:border-banana/50'
                  )}
                >
                  <span className="text-3xl">{goal.icon}</span>
                  <div className="text-left flex-1">
                    <p className="font-bold">{goal.label}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  {dailyGoal === goal.xp && <Check className="w-6 h-6 text-banana" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Motivation */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <MonkeyMascot mood="happy" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Why are you learning?</h1>
              <p className="text-muted-foreground">This helps our monkey guide you better! 🐵</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVATIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMotivation(m.id)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-center transition-all',
                    motivation === m.id ? 'border-banana bg-banana/10' : 'border-border hover:border-banana/50'
                  )}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <p className="font-semibold mt-2">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Notifications */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center">
              <MonkeyMascot mood="excited" size="xl" className="mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Stay on track!</h1>
              <p className="text-muted-foreground mb-8">
                Let me remind you to practice daily! A little learning every day goes a long way. 🍌
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={requestNotifications}
                className="w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground"
              >
                <Bell className="mr-2 w-5 h-5" /> Enable Reminders
              </Button>
              <Button
                onClick={skipNotifications}
                variant="ghost"
                className="w-full h-14 text-lg font-medium rounded-2xl"
              >
                <BellOff className="mr-2 w-5 h-5" /> Maybe Later
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Placement Test Choice */}
        {step === 5 && (
          <div className="animate-fade-in space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center">
              <MonkeyMascot mood="thinking" size="xl" className="mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Find your level!</h1>
              <p className="text-muted-foreground mb-2">
                Take a quick placement test to find the best starting point for you.
              </p>
              <p className="text-sm text-muted-foreground">
                Or start from scratch if you're a complete beginner!
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-4 text-center">What you'll learn:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <span>Converse with confidence</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📚</span>
                  <span>Build a large vocabulary</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎯</span>
                  <span>Develop a daily habit</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏆</span>
                  <span>Track your progress</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleStartPlacementTest}
                disabled={loading}
                className="w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground"
              >
                {loading ? 'Loading...' : 'Find My Level 🍌'}
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={handleStartFromScratch}
                disabled={loading}
                variant="outline"
                className="w-full h-14 text-lg font-medium rounded-2xl"
              >
                Start from Scratch
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation for steps 1-3 */}
      {step < 4 && (
        <div className="pt-6">
          <Button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedLanguage) || (step === 3 && !motivation)}
            className="w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground"
          >
            Continue
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
