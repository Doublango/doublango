import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MonkeyMascot from '@/components/MonkeyMascot';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: progressLoading } = useUserProgress();

  // Redirect authenticated users with completed onboarding to home
  useEffect(() => {
    if (!authLoading && !progressLoading && user) {
      if (profile?.onboarding_completed) {
        navigate('/home');
      } else if (profile) {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, progressLoading, profile, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  // Only show landing page for unauthenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-banana/20 to-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <MonkeyMascot mood="celebrating" size="xl" className="mx-auto" />
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-gradient-banana">LangoMonkey</h1>
          <p className="text-xl text-muted-foreground">
            Learn a new language in just 5 minutes a day! 🍌
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link to="/auth" className="block">
            <Button size="lg" className="w-full text-lg h-14 gradient-banana text-foreground font-bold rounded-2xl shadow-banana">
              Get Started Free
            </Button>
          </Link>
          
          <Link to="/auth?mode=login" className="block">
            <Button variant="outline" size="lg" className="w-full text-lg h-14 font-bold rounded-2xl border-2">
              I Already Have an Account
            </Button>
          </Link>
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Join millions learning 42+ languages
          </p>
          <p className="text-xs text-banana font-bold">
            🎉 Premium from just £4.99/month — half the price of competitors!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
