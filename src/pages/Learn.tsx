import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import BottomNavigation from '@/components/BottomNavigation';
import MonkeyMascot from '@/components/MonkeyMascot';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/lib/languages';
import { Lock, Star, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Unit = Database['public']['Tables']['units']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface UnitWithLessons extends Unit {
  lessons: Lesson[];
  completedLessons: number;
}

const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 - Beginner', emoji: '🌱' },
  { value: 'A2', label: 'A2 - Elementary', emoji: '📗' },
  { value: 'B1', label: 'B1 - Intermediate', emoji: '📘' },
  { value: 'B2', label: 'B2 - Upper-Int', emoji: '📙' },
  { value: 'C1', label: 'C1 - Advanced', emoji: '🔥' },
  { value: 'C2', label: 'C2 - Mastery', emoji: '🏆' },
];

const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const [units, setUnits] = useState<UnitWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0); // 0=A1, 1=A2, etc.

  // Only redirect to auth AFTER loading is complete and we're sure there's no user
  useEffect(() => {
    if (!authLoading && !progressLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, progressLoading, navigate]);

  useEffect(() => {
    const loadUnits = async () => {
      if (!activeCourse || !user) return;

      try {
        // Get units for the active language
        const { data: unitsData } = await supabase
          .from('units')
          .select('*')
          .eq('language_code', activeCourse.language_code)
          .order('unit_number');

        if (!unitsData) return;

        // Get all lessons for these units
        const unitIds = unitsData.map(u => u.id);
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .in('unit_id', unitIds)
          .order('lesson_number');

        // Get completed lessons
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id);

        const completedIds = new Set(completions?.map(c => c.lesson_id) || []);
        setCompletedLessonIds(completedIds);

        // Combine units with their lessons
        const unitsWithLessons: UnitWithLessons[] = unitsData.map(unit => {
          const unitLessons = lessonsData?.filter(l => l.unit_id === unit.id) || [];
          const completedCount = unitLessons.filter(l => completedIds.has(l.id)).length;
          return {
            ...unit,
            lessons: unitLessons,
            completedLessons: completedCount,
          };
        });

        setUnits(unitsWithLessons);
      } catch (error) {
        console.error('Error loading units:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!progressLoading) {
      loadUnits();
    }
  }, [activeCourse, progressLoading, user]);

  const language = LANGUAGES.find(l => l.code === activeCourse?.language_code);

  const startLesson = (lessonId: string) => {
    // Pass CEFR level to lesson page for AI question generation
    const cefrLevel = CEFR_LEVELS[difficultyLevel]?.value || 'A1';
    navigate(`/lesson/${lessonId}?cefr=${cefrLevel}`);
  };

  const isLessonUnlocked = (unitIndex: number, lessonIndex: number): boolean => {
    // First lesson of first unit is always unlocked
    if (unitIndex === 0 && lessonIndex === 0) return true;

    // Check if previous lesson in same unit is completed
    if (lessonIndex > 0) {
      const prevLesson = units[unitIndex]?.lessons[lessonIndex - 1];
      return prevLesson ? completedLessonIds.has(prevLesson.id) : false;
    }

    // Check if all lessons in previous unit are completed
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      return prevUnit.lessons.every(l => completedLessonIds.has(l.id));
    }

    return false;
  };

  if (authLoading || progressLoading || loading) {
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
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          <span className="text-2xl">{language?.flag}</span>
          <h1 className="font-bold text-lg">{language?.name} {t('nav.learn')}</h1>
        </div>
      </header>

      {/* Course Path */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Difficulty Slider */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">{t('learn.difficultyLevel', 'Difficulty Level')}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {CEFR_LEVELS[difficultyLevel]?.emoji} {CEFR_LEVELS[difficultyLevel]?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Reset to regenerate fresh questions at this level
                  setCompletedLessonIds(new Set());
                }}
                className="h-7 px-2 gap-1 text-muted-foreground hover:text-primary"
                title={t('learn.resetLevel', 'Reset this level for fresh AI questions')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <Slider
            value={[difficultyLevel]}
            onValueChange={(val) => setDifficultyLevel(val[0])}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {CEFR_LEVELS.map((l, i) => (
              <span key={l.value} className={cn(difficultyLevel === i && "text-primary font-medium")}>
                {l.emoji}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {units.filter(unit => {
            // Filter units by CEFR level - show units at or below selected level
            const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const selectedCEFR = CEFR_LEVELS[difficultyLevel]?.value || 'A1';
            const unitLevel = unit.cefr_level || 'A1';
            return levelOrder.indexOf(unitLevel) <= levelOrder.indexOf(selectedCEFR);
          }).map((unit, unitIndex) => (
            <div key={unit.id} className="space-y-4">
              {/* Unit Header */}
              <div className="bg-card rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {unit.unit_number}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{unit.title}</h2>
                    <p className="text-sm text-muted-foreground">{unit.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-success transition-all"
                          style={{ width: `${(unit.completedLessons / unit.lessons.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {unit.completedLessons}/{unit.lessons.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons */}
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isUnlocked = isLessonUnlocked(unitIndex, lessonIndex);
                    const isNext = isUnlocked && !isCompleted;

                    return (
                      <div key={lesson.id} className="relative flex items-center gap-4">
                        {/* Node */}
                        <button
                          onClick={() => isUnlocked && startLesson(lesson.id)}
                          disabled={!isUnlocked}
                          className={cn(
                            'lesson-node relative z-10 -ml-8',
                            isCompleted && 'lesson-node-completed',
                            isNext && 'lesson-node-active animate-pulse-glow',
                            !isUnlocked && 'lesson-node-locked'
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-6 h-6" />
                          ) : isUnlocked ? (
                            <Star className="w-6 h-6" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </button>

                        {/* Lesson Card */}
                        <button
                          onClick={() => isUnlocked && startLesson(lesson.id)}
                          disabled={!isUnlocked}
                          className={cn(
                            'flex-1 bg-card rounded-xl p-3 shadow-sm flex items-center justify-between transition-all',
                            isUnlocked && 'hover:shadow-md cursor-pointer',
                            !isUnlocked && 'opacity-50 cursor-not-allowed',
                            isNext && 'ring-2 ring-primary ring-offset-2'
                          )}
                        >
                          <div>
                            <p className="font-semibold text-left">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">+{lesson.xp_reward} XP</p>
                          </div>
                          {isUnlocked && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {units.length === 0 && (
            <div className="text-center py-12">
              <MonkeyMascot mood="sad" size="lg" className="mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t('common.loading')}</h2>
              <p className="text-muted-foreground">Content for this language is coming soon!</p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Learn;
