import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import MonkeyMascot from '@/components/MonkeyMascot';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, User, Bell, Globe, Crown, LogOut, 
  ChevronRight, Shield, HelpCircle, Info, Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LANGUAGES } from '@/lib/languages';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProgress();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/');
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotifications(enabled);
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifications(false);
        toast({ 
          title: 'Notifications blocked', 
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Notifications enabled!', description: "I'll remind you to practice!" });
      }
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'Edit Profile', icon: User, action: () => navigate('/profile') },
        { id: 'subscription', label: 'Subscription', icon: Crown, action: () => setShowSubscriptionModal(true), badge: 'Free' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'notifications', label: 'Practice Reminders', icon: Bell, toggle: true, value: notifications, onChange: handleNotificationToggle },
        { id: 'sounds', label: 'Sound Effects', icon: Volume2, toggle: true, value: soundEffects, onChange: setSoundEffects },
        { id: 'language', label: 'App Language', icon: Globe, action: () => setShowLanguageModal(true), value: 'English' },
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'help', label: 'Help Center', icon: HelpCircle, action: () => toast({ title: 'Help Center', description: 'Coming soon!' }) },
        { id: 'privacy', label: 'Privacy Policy', icon: Shield, action: () => toast({ title: 'Privacy Policy', description: 'Coming soon!' }) },
        { id: 'about', label: 'About LangoMonkey', icon: Info, action: () => toast({ title: 'LangoMonkey v1.0', description: 'Learn languages the fun way!' }) },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate('/profile')} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MonkeyMascot mood="happy" size="sm" />
          </div>
          <div>
            <p className="font-semibold">{profile?.display_name || 'Learner'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{section.title}</h2>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-4',
                    i < section.items.length - 1 && 'border-b border-border',
                    !item.toggle && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={!item.toggle ? item.action : undefined}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.toggle ? (
                    <Switch checked={item.value} onCheckedChange={item.onChange} />
                  ) : (
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.value && !item.badge && (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          LangoMonkey v1.0.0
        </p>
      </main>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Upgrade to Premium</h2>
                <button onClick={() => setShowSubscriptionModal(false)} className="text-muted-foreground">✕</button>
              </div>
              
              <div className="flex justify-center mb-6">
                <MonkeyMascot mood="excited" size="lg" animate />
              </div>

              {/* Premium Plan */}
              <div className="border-2 border-primary rounded-2xl p-4 mb-4 relative">
                <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Most Popular
                </span>
                <h3 className="font-bold text-lg mb-1">Premium</h3>
                <p className="text-2xl font-bold text-primary">£4.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="text-sm text-muted-foreground mb-3">or £39.99/year (save 33%)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✓ Unlimited energy lives</li>
                  <li className="flex items-center gap-2">✓ No ads</li>
                  <li className="flex items-center gap-2">✓ Offline lessons</li>
                  <li className="flex items-center gap-2">✓ Monthly streak repair</li>
                </ul>
                <Button className="w-full mt-4 gradient-primary">Start 14-Day Free Trial</Button>
              </div>

              {/* Pro Plan */}
              <div className="border border-border rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-1">Pro</h3>
                <p className="text-2xl font-bold">£9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="text-sm text-muted-foreground mb-3">or £89.99/year (save 25%)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✓ Everything in Premium</li>
                  <li className="flex items-center gap-2">✓ AI Explain My Mistake</li>
                  <li className="flex items-center gap-2">✓ Roleplay Chat</li>
                  <li className="flex items-center gap-2">✓ AI Conversation Practice</li>
                  <li className="flex items-center gap-2">✓ Priority support</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">Start 14-Day Free Trial</Button>
              </div>

              {/* Family Plan */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Family Plan available for up to 6 members
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">App Language</h2>
                <button onClick={() => setShowLanguageModal(false)} className="text-muted-foreground">✕</button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Choose the language for the app interface</p>
              <div className="space-y-2">
                {['English', 'Español', 'Français', 'Deutsch', '日本語'].map((lang) => (
                  <button
                    key={lang}
                    className={cn(
                      'w-full p-3 rounded-xl text-left hover:bg-muted/50',
                      lang === 'English' && 'bg-primary/10 border-2 border-primary'
                    )}
                    onClick={() => {
                      toast({ title: 'Language updated', description: `App language set to ${lang}` });
                      setShowLanguageModal(false);
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
