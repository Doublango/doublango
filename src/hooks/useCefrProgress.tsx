import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];
type CEFRLevel = Database['public']['Enums']['cefr_level'];

export interface CefrProgress {
  id: string;
  user_id: string;
  language_code: LanguageCode;
  cefr_level: CEFRLevel;
  current_unit: number;
  current_lesson: number;
  completed: boolean;
  completed_at: string | null;
}

export const useCefrProgress = (languageCode?: LanguageCode, cefrLevel?: CEFRLevel) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CefrProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user || !languageCode || !cefrLevel) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_cefr_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_code', languageCode)
        .eq('cefr_level', cefrLevel)
        .maybeSingle();

      if (error) {
        console.error('Error fetching CEFR progress:', error);
      }
      
      setProgress(data as CefrProgress | null);
    } catch (err) {
      console.error('Error fetching CEFR progress:', err);
    } finally {
      setLoading(false);
    }
  }, [user, languageCode, cefrLevel]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = useCallback(async (updates: Partial<Pick<CefrProgress, 'current_unit' | 'current_lesson' | 'completed' | 'completed_at'>>) => {
    if (!user || !languageCode || !cefrLevel) return { error: new Error('Missing required data') };

    // Upsert: create if not exists, update if exists
    const { data, error } = await supabase
      .from('user_cefr_progress')
      .upsert({
        user_id: user.id,
        language_code: languageCode,
        cefr_level: cefrLevel,
        ...updates,
      }, {
        onConflict: 'user_id,language_code,cefr_level',
      })
      .select()
      .single();

    if (!error && data) {
      setProgress(data as CefrProgress);
    }

    return { data, error };
  }, [user, languageCode, cefrLevel]);

  const resetProgress = useCallback(async () => {
    if (!user || !languageCode || !cefrLevel) return { error: new Error('Missing required data') };

    // Reset to beginning
    const { data, error } = await supabase
      .from('user_cefr_progress')
      .upsert({
        user_id: user.id,
        language_code: languageCode,
        cefr_level: cefrLevel,
        current_unit: 1,
        current_lesson: 1,
        completed: false,
        completed_at: null,
      }, {
        onConflict: 'user_id,language_code,cefr_level',
      })
      .select()
      .single();

    if (!error && data) {
      setProgress(data as CefrProgress);
    }

    return { data, error };
  }, [user, languageCode, cefrLevel]);

  const markCompleted = useCallback(async () => {
    if (!user || !languageCode || !cefrLevel) return { error: new Error('Missing required data') };

    const { data, error } = await supabase
      .from('user_cefr_progress')
      .upsert({
        user_id: user.id,
        language_code: languageCode,
        cefr_level: cefrLevel,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,language_code,cefr_level',
      })
      .select()
      .single();

    if (!error && data) {
      setProgress(data as CefrProgress);
    }

    return { data, error };
  }, [user, languageCode, cefrLevel]);

  return {
    progress,
    loading,
    refetch: fetchProgress,
    updateProgress,
    resetProgress,
    markCompleted,
  };
};
