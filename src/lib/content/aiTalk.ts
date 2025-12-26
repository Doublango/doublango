// AI-powered phrase generation for Talk practice

export interface AiTalkPhrase {
  key: string;
  en: string;
  translation: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface GenerateTalkPhrasesParams {
  languageCode: string;
  category?: string;
  difficultyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  isKidsMode?: boolean;
  usedPhrases?: string[];
  batchSize?: number;
}

export const generateAiTalkPhrases = async (
  params: GenerateTalkPhrasesParams
): Promise<AiTalkPhrase[]> => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-talk`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        languageCode: params.languageCode,
        category: params.category,
        difficultyLevel: params.difficultyLevel,
        isKidsMode: params.isKidsMode ?? false,
        usedPhrases: params.usedPhrases ?? [],
        batchSize: params.batchSize ?? 10,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI talk failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = (await res.json().catch(() => ({}))) as { phrases?: AiTalkPhrase[] };
    return Array.isArray(data.phrases) ? data.phrases : [];
  } catch (error) {
    console.error("AI talk generation error:", error);
    return [];
  }
};
