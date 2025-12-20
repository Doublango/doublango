export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  native_language: string;
  daily_goal_xp: number;
  motivation: string | null;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  streak_freeze_count: number;
  lives: number;
  lives_last_regenerated: string;
  crystals: number;
  total_xp: number;
  today_xp: number;
  last_practice_date: string;
  league_position: number;
}

export interface UserCourse {
  id: string;
  user_id: string;
  language_code: string;
  current_unit: number;
  current_lesson: number;
  total_xp: number;
  proficiency_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  is_active: boolean;
  started_at: string;
  last_practiced_at: string;
}

export interface Unit {
  id: string;
  language_code: string;
  unit_number: number;
  title: string;
  description: string | null;
  icon_name: string;
  cefr_level: string;
  total_lessons: number;
}

export interface Lesson {
  id: string;
  unit_id: string;
  lesson_number: number;
  title: string;
  xp_reward: number;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  exercise_order: number;
  exercise_type: 'multiple_choice' | 'translation' | 'match_pairs' | 'fill_blank' | 'type_what_you_hear' | 'speak_answer' | 'word_bank' | 'select_sentence';
  question: string;
  correct_answer: string;
  options: Record<string, unknown> | null;
  audio_url: string | null;
  hint: string | null;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  xp_earned: number;
  mistakes: number;
  perfect_score: boolean;
}

export interface Quest {
  id: string;
  quest_type: 'daily' | 'weekly' | 'monthly';
  title: string;
  description: string;
  target_value: number;
  xp_reward: number;
  crystal_reward: number;
  icon_name: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  is_completed: boolean;
  completed_at: string | null;
  assigned_date: string;
  quest?: Quest;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  crystal_reward: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile?: UserProfile;
}