import type { Database, Json } from "@/integrations/supabase/types";

export type AiExercise = {
  exercise_type: Database["public"]["Enums"]["exercise_type"];
  question: string;
  correct_answer: string;
  options?: Json;
  hint?: string | null;
};

export const generateAiLessonExercises = async (
  languageCode: Database["public"]["Enums"]["language_code"],
  lessonNumber: number
): Promise<AiExercise[]> => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lesson`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ languageCode, lessonNumber }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI lesson failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json().catch(() => ({}))) as { exercises?: AiExercise[] };
  return Array.isArray(data.exercises) ? data.exercises : [];
};
