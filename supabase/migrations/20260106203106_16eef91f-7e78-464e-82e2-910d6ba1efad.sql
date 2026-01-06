-- Create user_cefr_progress table to track per-difficulty-level progress
CREATE TABLE public.user_cefr_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  language_code public.language_code NOT NULL,
  cefr_level public.cefr_level NOT NULL,
  current_unit integer DEFAULT 1,
  current_lesson integer DEFAULT 1,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, language_code, cefr_level)
);

-- Enable RLS
ALTER TABLE public.user_cefr_progress ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access their own progress
CREATE POLICY "Users can manage their CEFR progress"
  ON public.user_cefr_progress
  FOR ALL
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_cefr_progress_updated_at
  BEFORE UPDATE ON public.user_cefr_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();