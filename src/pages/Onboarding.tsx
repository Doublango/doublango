import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ParrotMascot from '@/components/ParrotMascot';
import { LANGUAGES, DAILY_GOALS, MOTIVATIONS } from '@/lib/languages';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | ''>('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!selectedLanguage) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile settings
      await supabase.from('profiles').update({ daily_goal_xp: dailyGoal, motivation }).eq('id', user.id);
      
      // Deactivate all existing courses first
      await supabase.from('user_courses').update({ is_active: false }).eq('user_id', user.id);
      
      // Upsert the selected course (insert or update if exists)
      const { error: courseError } = await supabase.from('user_courses').upsert(
        { 
          user_id: user.id, 
          language_code: selectedLanguage as LanguageCode, 
          is_active: true 
        },
        { onConflict: 'user_id,language_code' }
      );
      
      if (courseError) throw courseError;
      
      navigate('/home');
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn('h-2 flex-1 rounded-full transition-colors', s <= step ? 'gradient-primary' : 'bg-muted')} />
        ))}
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <ParrotMascot mood="excited" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">What do you want to learn?</h1>
              <p className="text-muted-foreground">Choose your first language</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code as LanguageCode)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    selectedLanguage === lang.code ? 'border-primary bg-primary/10 shadow-glow' : 'border-border hover:border-primary/50'
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

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <ParrotMascot mood="thinking" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Set your daily goal</h1>
              <p className="text-muted-foreground">How much time can you commit?</p>
            </div>
            <div className="space-y-3">
              {DAILY_GOALS.map((goal) => (
                <button
                  key={goal.xp}
                  onClick={() => setDailyGoal(goal.xp)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all',
                    dailyGoal === goal.xp ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-3xl">{goal.icon}</span>
                  <div className="text-left flex-1">
                    <p className="font-bold">{goal.label}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  {dailyGoal === goal.xp && <Check className="w-6 h-6 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <ParrotMascot mood="happy" size="lg" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Why are you learning?</h1>
              <p className="text-muted-foreground">This helps us personalize your experience</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVATIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMotivation(m.id)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-center transition-all',
                    motivation === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <p className="font-semibold mt-2">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <Button
          onClick={() => step < 3 ? setStep(step + 1) : handleComplete()}
          disabled={(step === 1 && !selectedLanguage) || loading}
          className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary text-primary-foreground"
        >
          {loading ? 'Saving...' : step < 3 ? 'Continue' : "Let's Go!"}
          {!loading && <ChevronRight className="ml-2 w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;