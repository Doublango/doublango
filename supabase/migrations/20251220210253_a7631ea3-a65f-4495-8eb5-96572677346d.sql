-- Create enums for the app
CREATE TYPE public.language_code AS ENUM (
  'es', 'fr', 'de', 'ja', 'it', 'ko', 'zh', 'pt', 'ru', 'ar',
  'tr', 'nl', 'sv', 'ga', 'pl', 'hi', 'he', 'vi', 'el', 'no',
  'da', 'ro', 'fi', 'cs', 'uk', 'cy', 'gd', 'hu', 'id', 'haw',
  'nv', 'sw', 'eo', 'val', 'tlh', 'la', 'yi', 'ht', 'zu', 'ta',
  'ca', 'th'
);

CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

CREATE TYPE public.exercise_type AS ENUM (
  'multiple_choice', 'translation', 'match_pairs', 'fill_blank',
  'type_what_you_hear', 'speak_answer', 'word_bank', 'select_sentence'
);

CREATE TYPE public.quest_type AS ENUM ('daily', 'weekly', 'monthly');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  native_language TEXT DEFAULT 'en',
  daily_goal_xp INTEGER DEFAULT 20,
  motivation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_courses table (tracks which languages a user is learning)
CREATE TABLE public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  language_code language_code NOT NULL,
  current_unit INTEGER DEFAULT 1,
  current_lesson INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  proficiency_level cefr_level DEFAULT 'A1',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, language_code)
);

ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own courses"
  ON public.user_courses FOR ALL
  USING (auth.uid() = user_id);

-- Create user_progress table (tracks streaks, lives, crystals)
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_freeze_count INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 5,
  lives_last_regenerated TIMESTAMPTZ DEFAULT NOW(),
  crystals INTEGER DEFAULT 100,
  total_xp INTEGER DEFAULT 0,
  today_xp INTEGER DEFAULT 0,
  last_practice_date DATE DEFAULT CURRENT_DATE,
  league_position INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = user_id);

-- Create units table (course structure)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code language_code NOT NULL,
  unit_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'star',
  cefr_level cefr_level DEFAULT 'A1',
  total_lessons INTEGER DEFAULT 5,
  UNIQUE(language_code, unit_number)
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view units"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  UNIQUE(unit_id, lesson_number)
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  exercise_order INTEGER NOT NULL,
  exercise_type exercise_type NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB, -- For multiple choice, match pairs, etc.
  audio_url TEXT,
  hint TEXT,
  UNIQUE(lesson_id, exercise_order)
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- Create lesson_completions table
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  mistakes INTEGER DEFAULT 0,
  perfect_score BOOLEAN DEFAULT false,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their lesson completions"
  ON public.lesson_completions FOR ALL
  USING (auth.uid() = user_id);

-- Create quests table
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_type quest_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  crystal_reward INTEGER DEFAULT 0,
  icon_name TEXT DEFAULT 'target'
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quests"
  ON public.quests FOR SELECT
  TO authenticated
  USING (true);

-- Create user_quests table
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, quest_id, assigned_date)
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quests"
  ON public.user_quests FOR ALL
  USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name TEXT DEFAULT 'award',
  crystal_reward INTEGER DEFAULT 10
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their achievements"
  ON public.user_achievements FOR ALL
  USING (auth.uid() = user_id);

-- Create friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their friendships"
  ON public.friends FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Learner'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();