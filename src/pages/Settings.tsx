import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import MonkeyMascot from '@/components/MonkeyMascot';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, User, Bell, Globe, Crown, LogOut, 
  ChevronRight, Shield, HelpCircle, Info, Volume2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UI_LANGUAGES, changeUILanguage } from '@/lib/i18n';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProgress();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const currentUILanguage = UI_LANGUAGES.find(l => l.code === i18n.language) || UI_LANGUAGES[0];

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
          title: t('settings.notificationsBlocked', 'Notifications blocked'), 
          description: t('settings.enableNotifications', 'Please enable notifications in your browser settings'),
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: t('settings.notificationsEnabled', 'Notifications enabled!'), 
          description: t('settings.remindPractice', "I'll remind you to practice!") 
        });
      }
    }
  };

  const handleLanguageChange = (langCode: string) => {
    changeUILanguage(langCode);
    const lang = UI_LANGUAGES.find(l => l.code === langCode);
    toast({ 
      title: t('settings.languageUpdated', 'Language updated'), 
      description: t('settings.languageSet', { language: lang?.nativeName || langCode }) 
    });
    setShowLanguageModal(false);
  };

  const menuSections = [
    {
      title: t('settings.account', 'Account'),
      items: [
        { id: 'profile', label: t('settings.editProfile', 'Edit Profile'), icon: User, action: () => navigate('/profile') },
        { id: 'subscription', label: t('settings.subscription', 'Subscription'), icon: Crown, action: () => setShowSubscriptionModal(true), badge: t('subscription.free', 'Free') },
      ]
    },
    {
      title: t('settings.preferences', 'Preferences'),
      items: [
        { id: 'notifications', label: t('settings.practiceReminders', 'Practice Reminders'), icon: Bell, toggle: true, value: notifications, onChange: handleNotificationToggle },
        { id: 'sounds', label: t('settings.soundEffects', 'Sound Effects'), icon: Volume2, toggle: true, value: soundEffects, onChange: setSoundEffects },
        { id: 'language', label: t('settings.appLanguage', 'App Language'), icon: Globe, action: () => setShowLanguageModal(true), value: currentUILanguage.nativeName },
      ]
    },
    {
      title: t('settings.support', 'Support'),
      items: [
        { id: 'help', label: t('settings.helpCenter', 'Help Center'), icon: HelpCircle, action: () => toast({ title: t('settings.helpCenter', 'Help Center'), description: 'Coming soon!' }) },
        { id: 'privacy', label: t('settings.privacyPolicy', 'Privacy Policy'), icon: Shield, action: () => toast({ title: t('settings.privacyPolicy', 'Privacy Policy'), description: 'Coming soon!' }) },
        { id: 'about', label: t('settings.about', 'About LangoMonkey'), icon: Info, action: () => toast({ title: 'LangoMonkey v1.0', description: 'Learn languages the fun way!' }) },
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
          <h1 className="font-bold text-lg">{t('settings.title', 'Settings')}</h1>
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
          {signingOut ? t('settings.signingOut', 'Signing out...') : t('settings.signOut', 'Sign Out')}
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
                <h2 className="text-xl font-bold">{t('subscription.upgradeToPremium', 'Upgrade to Premium')}</h2>
                <button onClick={() => setShowSubscriptionModal(false)} className="text-muted-foreground">✕</button>
              </div>
              
              <div className="flex justify-center mb-6">
                <MonkeyMascot mood="excited" size="lg" animate />
              </div>

              {/* Premium Plan */}
              <div className="border-2 border-primary rounded-2xl p-4 mb-4 relative">
                <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {t('subscription.mostPopular', 'Most Popular')}
                </span>
                <h3 className="font-bold text-lg mb-1">{t('subscription.premium', 'Premium')}</h3>
                <p className="text-2xl font-bold text-primary">£4.99<span className="text-sm font-normal text-muted-foreground">{t('subscription.perMonth', '/month')}</span></p>
                <p className="text-sm text-muted-foreground mb-3">or £39.99{t('subscription.perYear', '/year')} ({t('subscription.savePercent', { percent: 33 })})</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✓ {t('subscription.unlimitedLives', 'Unlimited energy lives')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.noAds', 'No ads')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.offlineLessons', 'Offline lessons')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.monthlyStreakRepair', 'Monthly streak repair')}</li>
                </ul>
                <Button className="w-full mt-4 gradient-primary">{t('subscription.startTrial', 'Start 14-Day Free Trial')}</Button>
              </div>

              {/* Pro Plan */}
              <div className="border border-border rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-1">{t('subscription.pro', 'Pro')}</h3>
                <p className="text-2xl font-bold">£9.99<span className="text-sm font-normal text-muted-foreground">{t('subscription.perMonth', '/month')}</span></p>
                <p className="text-sm text-muted-foreground mb-3">or £89.99{t('subscription.perYear', '/year')} ({t('subscription.savePercent', { percent: 25 })})</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✓ {t('subscription.everythingInPremium', 'Everything in Premium')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.aiExplain', 'AI Explain My Mistake')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.roleplayChat', 'Roleplay Chat')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.aiConversation', 'AI Conversation Practice')}</li>
                  <li className="flex items-center gap-2">✓ {t('subscription.prioritySupport', 'Priority support')}</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">{t('subscription.startTrial', 'Start 14-Day Free Trial')}</Button>
              </div>

              {/* Family Plan */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('subscription.familyPlan', 'Family Plan available for up to 6 members')}
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
                <h2 className="text-xl font-bold">{t('settings.appLanguage', 'App Language')}</h2>
                <button onClick={() => setShowLanguageModal(false)} className="text-muted-foreground">✕</button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t('settings.chooseLanguage', 'Choose the language for the app interface')}</p>
              <div className="space-y-2">
                {UI_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={cn(
                      'w-full p-4 rounded-xl text-left flex items-center justify-between hover:bg-muted/50 transition-colors',
                      lang.code === i18n.language && 'bg-primary/10 border-2 border-primary'
                    )}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <div>
                      <p className="font-medium">{lang.nativeName}</p>
                      <p className="text-sm text-muted-foreground">{lang.name}</p>
                    </div>
                    {lang.code === i18n.language && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
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
