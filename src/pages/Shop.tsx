import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import BottomNavigation from '@/components/BottomNavigation';
import ParrotMascot from '@/components/ParrotMascot';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Gem, Heart, Zap, Shield, Clock, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const crystalPacks = [
  { id: 'small', crystals: 200, price: 1.99, bonus: 0 },
  { id: 'medium', crystals: 500, price: 3.99, bonus: 50, popular: true },
  { id: 'large', crystals: 1200, price: 7.99, bonus: 200 },
  { id: 'mega', crystals: 2500, price: 14.99, bonus: 500 },
];

const shopItems = [
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for one day',
    icon: Shield,
    cost: 200,
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    id: 'refill_hearts',
    name: 'Refill Hearts',
    description: 'Restore all your lives instantly',
    icon: Heart,
    cost: 350,
    color: 'bg-heart/10 text-heart',
  },
  {
    id: 'double_xp',
    name: 'Double XP (1 hour)',
    description: 'Earn 2x XP for the next hour',
    icon: Zap,
    cost: 500,
    color: 'bg-xp/10 text-xp',
  },
  {
    id: 'timer_boost',
    name: 'Timer Boost',
    description: '+15 seconds on timed challenges',
    icon: Clock,
    cost: 150,
    color: 'bg-warning/10 text-warning',
  },
];

const premiumPlans = [
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    period: 'month',
    features: [
      'Unlimited hearts',
      'No ads',
      'Offline lessons',
      'Monthly streak freeze',
    ],
    color: 'gradient-primary',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    period: 'month',
    features: [
      'Everything in Premium',
      'AI Explain My Mistake',
      'Roleplay Chat',
      'AI Conversation Practice',
      'Priority support',
    ],
    color: 'gradient-xp',
  },
];

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading } = useUserProgress();

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="font-bold text-lg">Shop</h1>
          <StatCard type="crystals" value={progress?.crystals || 0} />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Premium Plans */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-warning" />
            <h2 className="font-bold text-lg">Go Premium</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {premiumPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'rounded-2xl p-5 text-primary-foreground relative overflow-hidden',
                  plan.color
                )}
              >
                {plan.popular && (
                  <span className="absolute top-2 right-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold">
                  £{plan.price}
                  <span className="text-base font-normal opacity-80">/{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-4 bg-white/20 hover:bg-white/30 text-primary-foreground"
                  onClick={() => navigate('/subscribe')}
                >
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Power-ups */}
        <section>
          <h2 className="font-bold text-lg mb-4">Power-ups</h2>
          <div className="grid grid-cols-2 gap-3">
            {shopItems.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-2xl p-4 shadow-sm"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                <Button size="sm" variant="outline" className="w-full">
                  <Gem className="w-4 h-4 mr-1 text-crystal" />
                  {item.cost}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Crystal Packs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gem className="w-5 h-5 text-crystal" />
            <h2 className="font-bold text-lg">Get Crystals</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {crystalPacks.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  'bg-card rounded-2xl p-4 shadow-sm relative',
                  pack.popular && 'ring-2 ring-primary'
                )}
              >
                {pack.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                    Best Value
                  </span>
                )}
                <div className="text-center">
                  <Gem className="w-8 h-8 mx-auto mb-2 text-crystal" />
                  <p className="text-xl font-bold">{pack.crystals.toLocaleString()}</p>
                  {pack.bonus > 0 && (
                    <p className="text-xs text-success">+{pack.bonus} bonus</p>
                  )}
                  <Button className="w-full mt-3 gradient-crystal text-primary-foreground" size="sm">
                    £{pack.price.toFixed(2)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Shop;
