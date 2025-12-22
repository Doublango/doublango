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

// BANNED PATTERNS - these overused sentences must never appear
const BANNED_PATTERNS = [
  /\bi am (happy|sad|tired|hungry|thirsty|fine|good|bad|okay|great|well)\b/i,
  /\bthe (cat|dog|bird) is (big|small|black|white|brown)\b/i,
  /\bshe is (nice|tall|short|young|old)\b/i,
  /\bhe is (nice|tall|short|young|old)\b/i,
  /\bit is (good|bad|nice|big|small)\b/i,
  /\bthis is (a|an|the)?\s*(book|pen|apple|cat|dog)\b/i,
];

const containsBannedPattern = (text: string): boolean => {
  return BANNED_PATTERNS.some(pattern => pattern.test(text));
};

// Validate word_bank exercises - words must actually form the answer
const validateWordBank = (ex: AiExercise): AiExercise => {
  if (ex.exercise_type !== "word_bank") return ex;
  
  const opts = ex.options as { words?: string[] } | undefined;
  if (!opts?.words || !Array.isArray(opts.words)) return ex;
  
  const answerWords = ex.correct_answer.toLowerCase().replace(/[?.!,]/g, "").split(/\s+/);
  const providedWords = opts.words.map(w => w.toLowerCase().replace(/[?.!,]/g, ""));
  
  // Check if all answer words are in the provided words
  const allAnswerWordsPresent = answerWords.every(aw => providedWords.includes(aw));
  
  if (!allAnswerWordsPresent) {
    // Fix: rebuild word bank from answer + 2 distractors
    const distractors = ["the", "a", "is", "and", "but", "very", "not", "my", "your"];
    const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 2);
    const newWords = [...ex.correct_answer.split(/\s+/), ...shuffledDistractors].sort(() => 0.5 - Math.random());
    return { ...ex, options: { words: newWords } };
  }
  
  return ex;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { languageCode, lessonNumber, difficulty } = await req.json();
    const lang = clean(languageCode) as LanguageCode;
    const lessonNo = clampLesson(lessonNumber);
    const diffLevel = clean(difficulty) || "beginner";

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

    // Determine CEFR level based on lesson number and difficulty
    let cefrLevel = "A1";
    if (diffLevel === "intermediate" || lessonNo > 20) cefrLevel = "B1";
    else if (diffLevel === "advanced" || lessonNo > 40) cefrLevel = "B2";
    else if (diffLevel === "expert" || lessonNo > 60) cefrLevel = "C1";
    else if (lessonNo > 10 || diffLevel === "basic") cefrLevel = "A2";

    const prompt = {
      role: "system",
      content:
        "You are an expert language-learning content generator for a Duolingo-style app.\n" +
        "Output ONLY valid JSON with { \"exercises\": AiExercise[] }.\n\n" +
        "ABSOLUTELY BANNED SENTENCES (NEVER USE THESE):\n" +
        "- 'I am happy', 'I am sad', 'I am tired', 'I am hungry'\n" +
        "- 'The cat is big', 'The dog is small', 'This is a book'\n" +
        "- Any simple 'I am [adjective]' or 'The [animal] is [adjective]' patterns\n" +
        "- Single word answers unless specifically for vocabulary drills\n\n" +
        "REQUIRED SENTENCE TYPES (use these instead):\n" +
        "- Practical travel phrases: 'Where is the nearest pharmacy?'\n" +
        "- Restaurant/ordering: 'I would like a table for two, please'\n" +
        "- Directions: 'Turn left at the traffic light'\n" +
        "- Time expressions: 'The train leaves at half past three'\n" +
        "- Shopping: 'Do you have this in a larger size?'\n" +
        "- Social: 'What do you do for a living?'\n" +
        "- Weather: 'It looks like it might rain later'\n" +
        "- Emergencies: 'I need to find a hospital'\n\n" +
        "CRITICAL word_bank RULES:\n" +
        "- The 'words' array MUST contain ALL words from correct_answer\n" +
        "- Add exactly 2-3 distractor words that are plausible but not in the answer\n" +
        "- Shuffle the words randomly\n" +
        "- Example: answer='Buenos días señor' → words=['señor','buenos','muy','días','bien']\n\n" +
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
        "- type_what_you_hear: question='Type what you hear', correct_answer=target phrase\n",
    };

    // Rotate through diverse real-world topics
    const topicPools: Record<string, string[]> = {
      A1: [
        "greeting someone formally and informally",
        "introducing yourself and your family",
        "ordering food and drinks at a café",
        "asking for directions to landmarks",
        "buying tickets for transport",
        "counting and telling the time",
        "describing the weather",
        "asking prices when shopping",
      ],
      A2: [
        "making hotel reservations",
        "describing symptoms at a pharmacy",
        "making plans and appointments",
        "talking about hobbies and interests",
        "giving and understanding directions",
        "ordering at a restaurant with preferences",
        "shopping for clothes and sizes",
        "discussing daily routines",
      ],
      B1: [
        "expressing opinions about movies and books",
        "describing past travel experiences",
        "discussing future plans and dreams",
        "explaining a problem to customer service",
        "making formal phone calls",
        "writing emails for work or school",
        "discussing news and current events",
        "negotiating prices and deals",
      ],
      B2: [
        "debating social and cultural topics",
        "explaining complex processes",
        "discussing hypothetical situations",
        "making formal complaints",
        "presenting ideas in meetings",
        "discussing environmental issues",
        "analyzing literature or art",
        "negotiating business agreements",
      ],
      C1: [
        "nuanced political discussions",
        "academic presentations",
        "legal or medical consultations",
        "philosophical debates",
        "advanced business negotiations",
        "literary analysis and critique",
        "scientific explanations",
        "subtle humor and idioms",
      ],
    };

    const levelTopics = topicPools[cefrLevel] || topicPools["A1"];
    const selectedTopics = levelTopics.sort(() => 0.5 - Math.random()).slice(0, 3);

    const userMsg = {
      role: "user",
      content:
        `Target language code: ${lang}. Lesson number: ${lessonNo}. CEFR Level: ${cefrLevel}.\n` +
        `Generate exactly 10 high-quality exercises for ${cefrLevel} learners.\n` +
        `Focus on these specific scenarios: ${selectedTopics.join(", ")}.\n` +
        `All answers must be written in the target language (${lang}). Questions are in English.\n` +
        `Sentence length for ${cefrLevel}: ${cefrLevel === "A1" ? "3-6 words" : cefrLevel === "A2" ? "5-8 words" : cefrLevel === "B1" ? "7-12 words" : "10-15 words"}.\n` +
        `CRITICAL: Do NOT use 'I am happy', 'The cat is big', or any similar basic patterns. Use REAL practical sentences.`,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [prompt, userMsg],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("AI gateway error:", aiRes.status, errText);
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

    // Clean, validate, and filter exercises
    const cleaned = exercises
      .map((ex) => ({
        exercise_type: clean(ex?.exercise_type) as ExerciseType,
        question: clean(ex?.question),
        correct_answer: clean(ex?.correct_answer),
        hint: ex?.hint == null ? null : clean(ex?.hint),
        options: ex?.options,
      }))
      .filter((ex) => ex.exercise_type && ex.question && ex.correct_answer)
      .filter((ex) => !containsBannedPattern(ex.question) && !containsBannedPattern(ex.correct_answer))
      .map(validateWordBank)
      .slice(0, 12);

    console.log(`Generated ${cleaned.length} exercises for ${lang} lesson ${lessonNo} (${cefrLevel})`);

    return new Response(JSON.stringify({ exercises: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ai-lesson error:", msg);
    return new Response(JSON.stringify({ error: msg || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
