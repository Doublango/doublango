import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ParrotMascot from '@/components/ParrotMascot';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <ParrotMascot mood="celebrating" size="xl" className="mx-auto" />
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-gradient">LinguaBird</h1>
          <p className="text-xl text-muted-foreground">
            Learn a new language in just 5 minutes a day!
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link to="/auth" className="block">
            <Button size="lg" className="w-full text-lg h-14 gradient-primary text-primary-foreground font-bold rounded-2xl shadow-glow">
              Get Started
            </Button>
          </Link>
          
          <Link to="/auth?mode=login" className="block">
            <Button variant="outline" size="lg" className="w-full text-lg h-14 font-bold rounded-2xl">
              I Already Have an Account
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          Join millions learning 42+ languages
        </p>
      </div>
    </div>
  );
};

export default Index;