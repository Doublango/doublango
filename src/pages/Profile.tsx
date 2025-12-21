import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import BottomNavigation from '@/components/BottomNavigation';
import MonkeyMascot from '@/components/MonkeyMascot';
import { Button } from '@/components/ui/button';
import { 
  User, Settings, LogOut, Trophy, Flame, Zap, Star, 
  ChevronRight, Bell, Moon, HelpCircle, Shield, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, progress, activeCourse, loading: progressLoading } = useUserProgress();
  const [signingOut, setSigningOut] = useState(false);

  const menuItems = [
    { id: 'notifications', label: t('settings.practiceReminders'), icon: Bell },
    { id: 'appearance', label: t('settings.preferences'), icon: Moon },
    { id: 'privacy', label: t('settings.privacyPolicy'), icon: Shield },
    { id: 'help', label: t('settings.helpCenter'), icon: HelpCircle },
  ];

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/');
  };

  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="font-bold text-lg">{t('profile.title')}</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <MonkeyMascot mood="happy" size="sm" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl">{profile?.display_name || 'Learner'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.username && (
                <p className="text-sm text-primary">@{profile.username}</p>
              )}
            </div>
            <Button variant="outline" size="sm">{t('profile.editProfile')}</Button>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6" />
            <div>
              <p className="font-bold">{t('subscription.free')}</p>
              <p className="text-sm opacity-80">{t('subscription.upgradeToPremium')}</p>
            </div>
          </div>
          <Button 
            className="w-full bg-white/20 hover:bg-white/30"
            onClick={() => navigate('/settings')}
          >
            {t('subscription.upgradeToPremium')}
          </Button>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <h3 className="font-bold mb-4">{t('profile.statistics')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-xp/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-xp" />
              </div>
              <div>
                <p className="font-bold text-lg">{progress?.total_xp || 0}</p>
                <p className="text-xs text-muted-foreground">{t('profile.totalXP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-streak/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-streak" />
              </div>
              <div>
                <p className="font-bold text-lg">{progress?.current_streak || 0}</p>
                <p className="text-xs text-muted-foreground">{t('profile.daysStreak')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-bold text-lg">#{progress?.league_position || '-'}</p>
                <p className="text-xs text-muted-foreground">League Rank</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-bold text-lg">{progress?.longest_streak || 0}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-2xl shadow-md overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.id}
              className={cn(
                'w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors',
                i < menuItems.length - 1 && 'border-b border-border'
              )}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {signingOut ? t('settings.signingOut') : t('settings.signOut')}
        </Button>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
