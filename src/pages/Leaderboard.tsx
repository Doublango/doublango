import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BottomNavigation from '@/components/BottomNavigation';
import ParrotMascot from '@/components/ParrotMascot';
import { Trophy, Medal, Crown, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  rank: number;
}

const leagues = [
  { name: 'Bronze', icon: '🥉', minXp: 0, color: 'bg-amber-700/20 text-amber-700' },
  { name: 'Silver', icon: '🥈', minXp: 500, color: 'bg-slate-400/20 text-slate-500' },
  { name: 'Gold', icon: '🥇', minXp: 1500, color: 'bg-yellow-500/20 text-yellow-600' },
  { name: 'Platinum', icon: '💎', minXp: 3000, color: 'bg-cyan-500/20 text-cyan-600' },
  { name: 'Diamond', icon: '👑', minXp: 5000, color: 'bg-purple-500/20 text-purple-600' },
];

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'friends'>('weekly');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user) return;

      try {
        // Get top users by XP
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('user_id, total_xp')
          .order('total_xp', { ascending: false })
          .limit(50);

        if (!progressData) return;

        // Get profiles for these users
        const userIds = progressData.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const entries: LeaderboardEntry[] = progressData.map((p, index) => {
          const profile = profiles?.find(pr => pr.id === p.user_id);
          return {
            id: p.user_id,
            display_name: profile?.display_name || 'Learner',
            avatar_url: profile?.avatar_url,
            total_xp: p.total_xp || 0,
            rank: index + 1,
          };
        });

        setLeaderboard(entries);
        
        // Find user's rank
        const userEntry = entries.find(e => e.id === user.id);
        setUserRank(userEntry?.rank || null);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadLeaderboard();
    }
  }, [user, authLoading]);

  const getCurrentLeague = (xp: number) => {
    return [...leagues].reverse().find(l => xp >= l.minXp) || leagues[0];
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParrotMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  const userLeague = getCurrentLeague(leaderboard.find(e => e.id === user?.id)?.total_xp || 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          <Trophy className="w-5 h-5 text-warning" />
          <h1 className="font-bold text-lg">Leaderboard</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Current League */}
        <div className={cn('rounded-2xl p-6 shadow-md', userLeague.color)}>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{userLeague.icon}</span>
            <div>
              <h2 className="font-bold text-xl">{userLeague.name} League</h2>
              <p className="text-sm opacity-80">
                {userRank ? `You're #${userRank} this week` : 'Keep learning to rank up!'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setActiveTab('weekly')}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'weekly' ? 'bg-card shadow-sm' : 'text-muted-foreground'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'friends' ? 'bg-card shadow-sm' : 'text-muted-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="bg-card rounded-2xl shadow-md overflow-hidden">
          {activeTab === 'weekly' ? (
            <div className="divide-y divide-border">
              {leaderboard.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-4 transition-colors',
                    entry.id === user?.id && 'bg-primary/5'
                  )}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🦜</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-semibold', entry.id === user?.id && 'text-primary')}>
                      {entry.display_name}
                      {entry.id === user?.id && ' (You)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xp">{entry.total_xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Add Friends</h3>
              <p className="text-sm text-muted-foreground">
                Compete with friends to stay motivated
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Leaderboard;
