import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExerciseType =
  | "multiple_choice"
  | "translation"
  | "match_pairs"
  | "fill_blank"
  | "type_what_you_hear"
  | "speak_answer"
  | "word_bank"
  | "select_sentence";

type LanguageCode = string;

type AiExercise = {
  exercise_type: ExerciseType;
  question: string;
  correct_answer: string;
  hint?: string | null;
  options?: unknown;
};

const clampLesson = (n: unknown) => {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) return 1;
  return Math.min(200, Math.floor(x));
};

const clean = (v: unknown) => String(v ?? "").trim();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { languageCode, lessonNumber } = await req.json();
    const lang = clean(languageCode) as LanguageCode;
    const lessonNo = clampLesson(lessonNumber);

    if (!lang) {
      return new Response(JSON.stringify({ error: "languageCode is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = {
      role: "system",
      content:
        "You generate Duolingo-style language-learning exercises. Output ONLY valid JSON.\n" +
        "Rules: no placeholders, no empty strings, no single-word answers unless the question explicitly asks for a single word. Prefer short sentences/phrases (3-10 words).\n" +
        "Exercise variety: include at least one of each: multiple_choice, translation, match_pairs (4 pairs), type_what_you_hear, word_bank, select_sentence.\n" +
        "Questions should be in English, but the answers must be in the target language.\n" +
        "The JSON shape must be: { \"exercises\": AiExercise[] } where AiExercise = { exercise_type, question, correct_answer, options?, hint? }.\n" +
        "Options formats: for multiple_choice/select_sentence use options: string[] (4 items). For word_bank use options: { words: string[] }. For match_pairs use options: { pairs: { left: string, right: string }[] } (exactly 4).\n" +
        "For type_what_you_hear set question: \"Type what you hear\" and correct_answer: target phrase.\n" +
        "Content should feel realistic, useful, and not silly.",
    };

    const userMsg = {
      role: "user",
      content:
        `Target language code: ${lang}. Lesson number: ${lessonNo}.\n` +
        `Generate 10 exercises for a beginner-to-intermediate lesson, with varied everyday topics (greetings, travel, food, time, family, directions).\n` +
        `Make sure answers are written in the target language.`,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [prompt, userMsg],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `AI gateway error (${aiRes.status})`, details: errText.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: { exercises?: AiExercise[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];

    // Minimal server-side validation/cleanup
    const cleaned = exercises
      .map((ex) => ({
        exercise_type: clean(ex?.exercise_type) as ExerciseType,
        question: clean(ex?.question),
        correct_answer: clean(ex?.correct_answer),
        hint: ex?.hint == null ? null : clean(ex?.hint),
        options: ex?.options,
      }))
      .filter((ex) => ex.exercise_type && ex.question && ex.correct_answer)
      .slice(0, 12);

    return new Response(JSON.stringify({ exercises: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
