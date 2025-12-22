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
        "You are an expert language-learning content generator for a Duolingo-style app.\n" +
        "Output ONLY valid JSON with { \"exercises\": AiExercise[] }.\n\n" +
        "CRITICAL RULES:\n" +
        "1. NEVER use placeholder sentences like 'I am happy', 'I am sad', 'The cat is big'. These are boring and overused.\n" +
        "2. Create REALISTIC, USEFUL sentences travelers and learners actually need.\n" +
        "3. Answers must be SHORT PHRASES or SENTENCES (3-10 words), not single words unless explicitly required.\n" +
        "4. Rotate topics: greetings, food ordering, directions, shopping, hotel, transport, emergencies, socializing, weather, time.\n" +
        "5. Make questions progressively more complex as lesson number increases.\n" +
        "6. NEVER repeat similar sentences within the same set.\n\n" +
        "Exercise variety required:\n" +
        "- 2x multiple_choice (translate English→target with 4 options)\n" +
        "- 2x translation (type the translation)\n" +
        "- 2x word_bank (arrange words to form a sentence)\n" +
        "- 1x match_pairs (4 word pairs left/right)\n" +
        "- 2x type_what_you_hear (transcribe the target phrase)\n" +
        "- 1x select_sentence (pick correct sentence from 4)\n\n" +
        "Options formats:\n" +
        "- multiple_choice/select_sentence: options: string[] (exactly 4 including correct)\n" +
        "- word_bank: options: { words: string[] } (shuffled words from answer + 2-3 distractors)\n" +
        "- match_pairs: options: { pairs: [{left:string, right:string}] } (exactly 4 pairs)\n" +
        "- type_what_you_hear: question='Type what you hear', correct_answer=target phrase\n\n" +
        "Quality examples:\n" +
        "- 'Where is the nearest pharmacy?' ✓\n" +
        "- 'I would like a table for two, please' ✓\n" +
        "- 'The train leaves at three o'clock' ✓\n" +
        "- 'I am happy' ✗ (too basic/overused)",
    };

    const topicPool = [
      "ordering food at a restaurant",
      "asking for directions",
      "checking into a hotel",
      "buying tickets for transport",
      "shopping for clothes",
      "meeting new people",
      "making a reservation",
      "asking about the weather",
      "discussing plans and schedules",
      "emergencies and asking for help",
      "describing your family",
      "talking about hobbies",
      "asking about prices",
      "polite requests and thanking",
    ];
    const selectedTopics = topicPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    const userMsg = {
      role: "user",
      content:
        `Target language code: ${lang}. Lesson number: ${lessonNo}.\n` +
        `Generate exactly 10 high-quality exercises.\n` +
        `Focus on these topics: ${selectedTopics.join(", ")}.\n` +
        `Lesson ${lessonNo <= 5 ? "is beginner level (A1)" : lessonNo <= 15 ? "is elementary level (A2)" : "is intermediate level (B1)"}.\n` +
        `All answers must be written in the target language (${lang}). Questions are in English.\n` +
        `Remember: NO 'I am happy/sad/tired' type sentences. Be creative and practical.`,
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
