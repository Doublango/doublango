import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type UserProgress = Database['public']['Tables']['user_progress']['Row'];
type UserCourse = Database['public']['Tables']['user_courses']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserData {
  profile: Profile | null;
  progress: UserProgress | null;
  activeCourse: UserCourse | null;
  loading: boolean;
}

export const useUserProgress = () => {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>({
    profile: null,
    progress: null,
    activeCourse: null,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setData({ profile: null, progress: null, activeCourse: null, loading: false });
      return;
    }

    try {
      const [profileRes, progressRes, courseRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
        supabase.from('user_courses').select('*').eq('user_id', user.id).eq('is_active', true).limit(1),
      ]);

      setData({
        profile: profileRes.data,
        progress: progressRes.data,
        activeCourse: courseRes.data?.[0] || null,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setData(prev => ({
        ...prev,
        progress: prev.progress ? { ...prev.progress, ...updates } : null,
      }));
    }
    
    return { error };
  };

  const updateCourse = async (updates: Partial<UserCourse>) => {
    if (!user || !data.activeCourse) return;
    
    const { error } = await supabase
      .from('user_courses')
      .update(updates)
      .eq('id', data.activeCourse.id);

    if (!error) {
      setData(prev => ({
        ...prev,
        activeCourse: prev.activeCourse ? { ...prev.activeCourse, ...updates } : null,
      }));
    }
    
    return { error };
  };

  return {
    ...data,
    refetch: fetchData,
    updateProgress,
    updateCourse,
  };
};
