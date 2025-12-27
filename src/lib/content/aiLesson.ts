import type { Database, Json } from "@/integrations/supabase/types";

export type AiExercise = {
  exercise_type: Database["public"]["Enums"]["exercise_type"];
  question: string;
  correct_answer: string;
  options?: Json;
  hint?: string | null;
};

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface AiLessonOptions {
  difficulty?: CEFRLevel;
  isKidsMode?: boolean;
  topicHint?: string;
  usedQuestions?: string[];
}

export const generateAiLessonExercises = async (
  languageCode: Database["public"]["Enums"]["language_code"],
  lessonNumber: number,
  options?: AiLessonOptions
): Promise<AiExercise[]> => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lesson`;

  // Map CEFR level to difficulty string expected by edge function
  const difficultyMap: Record<CEFRLevel, string> = {
    A1: "beginner",
    A2: "basic",
    B1: "intermediate",
    B2: "advanced",
    C1: "fluent",
    C2: "mastery",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      languageCode,
      lessonNumber,
      difficulty: options?.difficulty ? difficultyMap[options.difficulty] : undefined,
      isKidsMode: options?.isKidsMode ?? false,
      topicHint: options?.topicHint,
      usedQuestions: options?.usedQuestions ?? [],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI lesson failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json().catch(() => ({}))) as { exercises?: AiExercise[] };
  return Array.isArray(data.exercises) ? data.exercises : [];
};
