import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';
import MonkeyMascot from '@/components/MonkeyMascot';
import { LANGUAGES } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];
type UserCourse = Database['public']['Tables']['user_courses']['Row'];

const Languages: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, refetch } = useUserProgress();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadUserCourses = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id);
      
      setUserCourses(data || []);
      setLoading(false);
    };

    if (user) loadUserCourses();
  }, [user]);

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCourseProgress = (code: string): UserCourse | undefined => {
    return userCourses.find(c => c.language_code === code);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    if (!user) return;
    
    setSwitching(languageCode);
    
    const existingCourse = getCourseProgress(languageCode);
    
    try {
      if (existingCourse) {
        // Switch to existing course
        await supabase
          .from('user_courses')
          .update({ is_active: false })
          .eq('user_id', user.id);
        
        await supabase
          .from('user_courses')
          .update({ is_active: true })
          .eq('id', existingCourse.id);
        
        toast({
          title: `Switched to ${LANGUAGES.find(l => l.code === languageCode)?.name}!`,
          description: 'Continue where you left off.',
        });
      } else {
        // Deactivate current courses
        await supabase
          .from('user_courses')
          .update({ is_active: false })
          .eq('user_id', user.id);
        
        // Create new course
        await supabase
          .from('user_courses')
          .insert({
            user_id: user.id,
            language_code: languageCode as LanguageCode,
            is_active: true,
          });
        
        toast({
          title: `Started ${LANGUAGES.find(l => l.code === languageCode)?.name}!`,
          description: 'Begin your learning journey.',
        });
        
        // Go to placement test for new languages
        navigate('/placement-test');
        return;
      }
      
      await refetch();
      navigate('/learn');
    } catch (error) {
      console.error('Error switching language:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch language. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSwitching(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }

  const startedLanguages = LANGUAGES.filter(lang => getCourseProgress(lang.code));
  const newLanguages = LANGUAGES.filter(lang => !getCourseProgress(lang.code));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          <h1 className="font-bold text-lg">Languages</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Monkey Animation */}
        <div className="text-center">
          <MonkeyMascot mood="excited" size="lg" animate className="mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">Swing into a new language! 🍌</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Your Languages */}
        {startedLanguages.length > 0 && !searchQuery && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Your Languages</h2>
            <div className="space-y-2">
              {startedLanguages.map((lang) => {
                const course = getCourseProgress(lang.code);
                const isActive = activeCourse?.language_code === lang.code;
                
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    disabled={switching !== null}
                    className={cn(
                      'w-full bg-card rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all',
                      isActive && 'ring-2 ring-primary',
                      switching === lang.code && 'opacity-50'
                    )}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold flex items-center gap-2">
                        {lang.name}
                        {isActive && <Check className="w-4 h-4 text-success" />}
                      </p>
                      <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min((course?.total_xp || 0) / 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{course?.total_xp || 0} XP</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* All Languages */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {searchQuery ? 'Search Results' : 'Start a New Language'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(searchQuery ? filteredLanguages : newLanguages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={switching !== null}
                className={cn(
                  'bg-card rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-all',
                  switching === lang.code && 'opacity-50'
                )}
              >
                <span className="text-4xl">{lang.flag}</span>
                <p className="font-semibold text-sm">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                <div className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  lang.difficulty === 'easy' && 'bg-success/10 text-success',
                  lang.difficulty === 'medium' && 'bg-banana/10 text-banana-foreground',
                  lang.difficulty === 'hard' && 'bg-destructive/10 text-destructive'
                )}>
                  {lang.difficulty}
                </div>
              </button>
            ))}
          </div>
          
          {filteredLanguages.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No languages found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Languages;
