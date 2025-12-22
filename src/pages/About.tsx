import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Globe, Heart, Sparkles, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarMascot from '@/components/AvatarMascot';
import BottomNavigation from '@/components/BottomNavigation';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: '40+ Languages',
      description: 'Learn Spanish, French, German, Japanese, and many more languages from beginner to fluent.'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'AI-Powered Lessons',
      description: 'Smart lessons adapt to your level with diverse, practical sentences for real-world conversations.'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Speech Practice',
      description: 'Improve pronunciation with voice recognition and instant feedback on your speaking.'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Track Progress',
      description: 'Maintain streaks, earn XP, and unlock achievements as you advance through levels.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Kids Mode',
      description: 'Safe, engaging content designed for younger learners with fun themes and simpler exercises.'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Free to Learn',
      description: 'Core learning features are completely free. Premium unlocks unlimited practice and exclusive content.'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">About DoubLango</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center">
          <AvatarMascot mood="celebrating" size="lg" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome to DoubLango! 🍌</h2>
          <p className="text-muted-foreground">
            The fun, free way to learn languages. Practice speaking, reading, and listening with bite-sized lessons that fit your life.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-card rounded-3xl p-6 shadow-md">
          <h3 className="font-bold text-lg mb-3">Our Mission</h3>
          <p className="text-muted-foreground leading-relaxed">
            We believe everyone deserves access to quality language education. DoubLango makes learning a new language accessible, engaging, and effective through gamification and AI-powered content.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Whether you're preparing for travel, connecting with family, or expanding your career opportunities, we're here to help you achieve fluency.
          </p>
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="font-bold text-lg mb-4">What Makes DoubLango Special</h3>
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-card rounded-2xl p-4 shadow-sm flex gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-primary/10 to-banana/10 rounded-3xl p-6">
          <h3 className="font-bold text-lg mb-4 text-center">DoubLango by the Numbers</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">40+</p>
              <p className="text-xs text-muted-foreground">Languages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-banana">A1-C2</p>
              <p className="text-xs text-muted-foreground">CEFR Levels</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">1000+</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>DoubLango v1.0.0</p>
          <p className="mt-1">Made with 🍌 and ❤️</p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default About;
