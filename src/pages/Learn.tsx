import React, { useCallback, useEffect, useState } from 'react';
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
import { bumpLessonQuestionSetVersion, clearUsedQuestionBank, getLessonQuestionSetVersion, getQuestionSetVersion, makeGenerationId, setLessonQuestionSetVersion as setLessonQsetVersion, setQuestionSetVersion as setGlobalQsetVersion } from '@/lib/aiQuestionRegistry';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { Database } from '@/integrations/supabase/types';

const DIFFICULTY_KEY = 'dbl_learn_difficulty_v2';

type Unit = Database['public']['Tables']['units']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface UnitWithLessons extends Unit {
  lessons: Lesson[];
  completedLessons: number;
}

const CEFR_LEVELS_ADULT = [
  { value: 'A1', label: 'A1 - Beginner', emoji: '🌱' },
  { value: 'A2', label: 'A2 - Elementary', emoji: '📗' },
  { value: 'B1', label: 'B1 - Intermediate', emoji: '📘' },
  { value: 'B2', label: 'B2 - Upper-Int', emoji: '📙' },
  { value: 'C1', label: 'C1 - Advanced', emoji: '🔥' },
  { value: 'C2', label: 'C2 - Mastery', emoji: '🏆' },
];

const CEFR_LEVELS_KIDS = [
  { value: 'A1', label: 'Super Easy', emoji: '🌟' },
  { value: 'A2', label: 'Easy', emoji: '⭐' },
  { value: 'B1', label: 'Medium', emoji: '🎯' },
];

const readStoredDifficulty = (kidsMode: boolean): number => {
  try {
    const key = kidsMode ? `${DIFFICULTY_KEY}:kids` : `${DIFFICULTY_KEY}:adult`;
    const raw = window.localStorage.getItem(key);
    const n = Number(raw);
    const max = kidsMode ? 2 : 5;
    return Number.isFinite(n) && n >= 0 && n <= max ? n : 0;
  } catch {
    return 0;
  }
};

const storeCurrentDifficulty = (level: number, kidsMode: boolean) => {
  try {
    const key = kidsMode ? `${DIFFICULTY_KEY}:kids` : `${DIFFICULTY_KEY}:adult`;
    window.localStorage.setItem(key, String(level));
  } catch {}
};

const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings: appSettings } = useAppSettings();
  const { user, loading: authLoading } = useAuth();
  const { activeCourse, loading: progressLoading } = useUserProgress();
  const [units, setUnits] = useState<UnitWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [difficultyLevel, setDifficultyLevel] = useState<number>(() => readStoredDifficulty(appSettings.kidsMode));
  const [questionSetVersion, setQuestionSetVersion] = useState<number>(0);

  const CEFR_LEVELS = appSettings.kidsMode ? CEFR_LEVELS_KIDS : CEFR_LEVELS_ADULT;
  const maxDifficultyIndex = CEFR_LEVELS.length - 1;

  // Clamp difficulty when switching between modes
  useEffect(() => {
    const max = appSettings.kidsMode ? 2 : 5;
    setDifficultyLevel((prev) => {
      const stored = readStoredDifficulty(appSettings.kidsMode);
      return Math.min(stored, max);
    });
  }, [appSettings.kidsMode]);

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

  useEffect(() => {
    if (!activeCourse?.language_code) return;
    const clamped = Math.min(difficultyLevel, maxDifficultyIndex);
    const cefr = (CEFR_LEVELS[clamped]?.value || 'A1') as any;
    const mode = appSettings.kidsMode ? 'kids' : 'adult';
    setQuestionSetVersion(getQuestionSetVersion(activeCourse.language_code, cefr, mode));
  }, [activeCourse?.language_code, difficultyLevel, appSettings.kidsMode, CEFR_LEVELS, maxDifficultyIndex]);

  const resetQuestionsForDifficulty = useCallback(
    (levelIndex: number) => {
      if (!activeCourse?.language_code) return;
      const lang = activeCourse.language_code;
      const idx = Math.min(levelIndex, maxDifficultyIndex);
      const cefr = (CEFR_LEVELS[idx]?.value || 'A1') as any;
      const mode = appSettings.kidsMode ? 'kids' : 'adult';

      // “Reset back to the beginning” for this level: set versions to 0 and clear no-repeat banks.
      setGlobalQsetVersion(lang, cefr, 0, mode);

      const lessonNumbers = Array.from(
        new Set(units.flatMap((u) => u.lessons.map((l) => l.lesson_number))),
      );
      for (const lessonNo of lessonNumbers) {
        setLessonQsetVersion(lang, cefr, lessonNo, 0, mode);
        clearUsedQuestionBank(lang, cefr, lessonNo, mode);
      }

      setQuestionSetVersion(0);
    },
    [activeCourse?.language_code, appSettings.kidsMode, CEFR_LEVELS, maxDifficultyIndex, units],
  );

  const language = LANGUAGES.find(l => l.code === activeCourse?.language_code);

  const startLesson = (lesson: Lesson, opts?: { lessonSetVersionOverride?: number; difficultyOverrideIndex?: number }) => {
    const levelIndex = Math.min(opts?.difficultyOverrideIndex ?? difficultyLevel, maxDifficultyIndex);
    const cefr = (CEFR_LEVELS[levelIndex]?.value || 'A1') as any;

    const lang = activeCourse?.language_code;
    const mode = appSettings.kidsMode ? 'kids' : 'adult';
    const globalSet = lang ? getQuestionSetVersion(lang, cefr, mode) : questionSetVersion;

    const lessonSet = lang
      ? (opts?.lessonSetVersionOverride ?? getLessonQuestionSetVersion(lang, cefr, lesson.lesson_number, mode))
      : 0;

    // Combine into one stable number so backend/topic selection changes when either changes
    const qset = globalSet * 1000 + lessonSet;

    const gen = lang
      ? makeGenerationId(lang, cefr, lesson.lesson_number, qset, mode)
      : (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()));

    // pass kidsMode to backend so it can cap complexity
    navigate(`/lesson/${lesson.id}?cefr=${cefr}&qset=${qset}&gen=${encodeURIComponent(gen)}&section=${lesson.lesson_number}&kids=${mode === 'kids' ? '1' : '0'}`);
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
                {CEFR_LEVELS[Math.min(difficultyLevel, maxDifficultyIndex)]?.emoji} {CEFR_LEVELS[Math.min(difficultyLevel, maxDifficultyIndex)]?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                 onClick={() => {
                   resetQuestionsForDifficulty(difficultyLevel);
                 }}
                className="h-7 px-2 gap-1 text-muted-foreground hover:text-primary"
                title={t('learn.resetLevel', 'Reset questions for this difficulty')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <Slider
            value={[Math.min(difficultyLevel, maxDifficultyIndex)]}
             onValueChange={(val) => {
               const nextIndex = Math.min(val[0], maxDifficultyIndex);
               setDifficultyLevel(nextIndex);
               storeCurrentDifficulty(nextIndex, appSettings.kidsMode);

               // Requirement: moving the slider should reset the questions for that difficulty.
               resetQuestionsForDifficulty(nextIndex);
             }}
            max={maxDifficultyIndex}
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
            const clamped = Math.min(difficultyLevel, maxDifficultyIndex);
            const selectedCEFR = CEFR_LEVELS[clamped]?.value || 'A1';
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
                           onClick={() => isUnlocked && startLesson(lesson)}
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
                        <div
                          className={cn(
                            'flex-1 bg-card rounded-xl p-3 shadow-sm flex items-center justify-between transition-all',
                            isUnlocked && 'hover:shadow-md',
                            !isUnlocked && 'opacity-50',
                            isNext && 'ring-2 ring-primary ring-offset-2'
                          )}
                        >
                          <button
                            onClick={() => isUnlocked && startLesson(lesson)}
                            disabled={!isUnlocked}
                            className={cn(
                              'flex-1 flex items-center justify-between text-left',
                              isUnlocked && 'cursor-pointer',
                              !isUnlocked && 'cursor-not-allowed'
                            )}
                          >
                            <div>
                              <p className="font-semibold text-left">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">+{lesson.xp_reward} XP</p>
                            </div>
                            {isUnlocked && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                          </button>

                          {isUnlocked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!activeCourse?.language_code) return;
                                const clamped = Math.min(difficultyLevel, maxDifficultyIndex);
                                const cefr = (CEFR_LEVELS[clamped]?.value || 'A1') as any;
                                const mode = appSettings.kidsMode ? 'kids' : 'adult';
                                const nextLessonSet = bumpLessonQuestionSetVersion(
                                  activeCourse.language_code,
                                  cefr,
                                  lesson.lesson_number,
                                  mode
                                );
                                startLesson(lesson, { lessonSetVersionOverride: nextLessonSet });
                              }}
                              className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title={t('learn.resetLesson', 'Regenerate a brand-new set of questions for this section')}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
