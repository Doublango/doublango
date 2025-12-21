import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/hooks/use-toast';
import { LANGUAGES } from '@/lib/languages';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { user } = useAuth();
  const { activeCourse, refetch } = useUserProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [switching, setSwitching] = useState(false);

  const currentLanguage = LANGUAGES.find(l => l.code === activeCourse?.language_code);

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSwitch = async (languageCode: string) => {
    if (!user || languageCode === activeCourse?.language_code) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);

    try {
      // Check if user already has a course for this language
      const { data: existingCourse } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_code', languageCode as LanguageCode)
        .single();

      if (existingCourse) {
        // Deactivate current course
        await supabase
          .from('user_courses')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Activate existing course
        await supabase
          .from('user_courses')
          .update({ is_active: true })
          .eq('id', existingCourse.id);
      } else {
        // Deactivate current course
        await supabase
          .from('user_courses')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Create new course
        await supabase
          .from('user_courses')
          .insert({
            user_id: user.id,
            language_code: languageCode as LanguageCode,
            is_active: true,
          });
      }

      const newLanguage = LANGUAGES.find(l => l.code === languageCode);
      toast({
        title: 'Language switched!',
        description: `Now learning ${newLanguage?.name}`,
      });

      await refetch();
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching language:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch language',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors"
        disabled={switching}
      >
        <span className="text-2xl">{currentLanguage?.flag}</span>
        <span className="font-bold text-sm">{currentLanguage?.name}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden animate-slide-up">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredLanguages.map((lang) => {
                const isActive = lang.code === activeCourse?.language_code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSwitch(lang.code)}
                    disabled={switching}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                      isActive && 'bg-primary/10'
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lang.name}</p>
                      <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No languages found
                </div>
              )}
            </div>

            {/* Add New Course Link */}
            <div className="p-3 border-t border-border">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/onboarding');
                }}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                + Start a new course
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
