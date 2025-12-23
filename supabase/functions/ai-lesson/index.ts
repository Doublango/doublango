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

// BANNED PATTERNS - these overused sentences must NEVER appear
const BANNED_PATTERNS = [
  // Basic "I am X" patterns
  /\bi am (happy|sad|tired|hungry|thirsty|fine|good|bad|okay|great|well|cold|hot|ready|busy)\b/i,
  // Basic animal patterns
  /\bthe (cat|dog|bird|fish) is (big|small|black|white|brown|cute|nice|good|bad)\b/i,
  // Basic "he/she is X" patterns
  /\b(she|he) is (nice|tall|short|young|old|happy|sad|good|bad)\b/i,
  // Basic "it is X" patterns  
  /\bit is (good|bad|nice|big|small|hot|cold|new|old)\b/i,
  // "This is a X" patterns
  /\bthis is (a|an|the)?\s*(book|pen|apple|cat|dog|table|chair|car)\b/i,
  // Placeholder answers
  /\baudio transcript\b/i,
  /\bword bank\b/i,
  /\btype what you hear\b/i,
  // Single word answers (unless vocab drill)
  /^(yes|no|hello|hi|bye|good|bad|nice|okay|ok)$/i,
  // Fill blank "I ___ happy"
  /\bi _+ (happy|sad|tired|good|bad|fine)\b/i,
];

const containsBannedPattern = (text: string): boolean => {
  if (!text || text.length < 3) return true;
  return BANNED_PATTERNS.some(pattern => pattern.test(text));
};

// Validate word_bank exercises - words must actually form the answer
const validateWordBank = (ex: AiExercise): AiExercise => {
  if (ex.exercise_type !== "word_bank") return ex;
  
  const opts = ex.options as { words?: string[] } | undefined;
  if (!opts?.words || !Array.isArray(opts.words)) return ex;
  
  const answerWords = ex.correct_answer.toLowerCase().replace(/[?.!,]/g, "").split(/\s+/);
  const providedWords = opts.words.map(w => w.toLowerCase().replace(/[?.!,]/g, ""));
  
  const allAnswerWordsPresent = answerWords.every(aw => providedWords.includes(aw));
  
  if (!allAnswerWordsPresent) {
    const distractors = ["the", "a", "is", "and", "but", "very", "not", "my", "your", "we", "they"];
    const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    const newWords = [...ex.correct_answer.split(/\s+/), ...shuffledDistractors].sort(() => 0.5 - Math.random());
    return { ...ex, options: { words: newWords } };
  }
  
  return ex;
};

// Language name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish", fr: "French", de: "German", ja: "Japanese", it: "Italian",
  ko: "Korean", zh: "Chinese (Mandarin)", pt: "Portuguese", ru: "Russian",
  ar: "Arabic", tr: "Turkish", nl: "Dutch", sv: "Swedish", ga: "Irish",
  pl: "Polish", hi: "Hindi", he: "Hebrew", vi: "Vietnamese", el: "Greek",
  no: "Norwegian", da: "Danish", ro: "Romanian", fi: "Finnish", cs: "Czech",
  uk: "Ukrainian", cy: "Welsh", gd: "Scottish Gaelic", hu: "Hungarian",
  id: "Indonesian", haw: "Hawaiian", nv: "Navajo", sw: "Swahili",
  eo: "Esperanto", val: "Valencian", tlh: "Klingon", la: "Latin",
  yi: "Yiddish", ht: "Haitian Creole", zu: "Zulu", ta: "Tamil",
  ca: "Catalan", th: "Thai"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { languageCode, lessonNumber, difficulty, isKidsMode, topicHint, usedQuestions } = body;
    const lang = clean(languageCode) as LanguageCode;
    const lessonNo = clampLesson(lessonNumber);
    const diffLevel = clean(difficulty) || "beginner";
    const kidsMode = Boolean(isKidsMode);
    const topic = clean(topicHint) || "";
    const excludeQuestions = Array.isArray(usedQuestions) ? usedQuestions.slice(0, 20) : [];

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

    // Determine CEFR level based on difficulty slider value
    let cefrLevel = "A1";
    let sentenceLength = "3-5 words";
    let complexity = "basic vocabulary and present tense only";
    
    if (diffLevel === "mastery" || diffLevel === "expert" || lessonNo > 80) {
      cefrLevel = "C1";
      sentenceLength = "12-20 words";
      complexity = "advanced grammar, idioms, subjunctive mood, complex clauses";
    } else if (diffLevel === "fluent" || lessonNo > 60) {
      cefrLevel = "B2";
      sentenceLength = "10-15 words";
      complexity = "past and future tenses, conditional, relative clauses";
    } else if (diffLevel === "advanced" || lessonNo > 40) {
      cefrLevel = "B1";
      sentenceLength = "8-12 words";
      complexity = "past tense, future tense, modal verbs, conjunctions";
    } else if (diffLevel === "intermediate" || lessonNo > 20) {
      cefrLevel = "A2";
      sentenceLength = "5-8 words";
      complexity = "simple past, basic conjunctions, common expressions";
    } else if (diffLevel === "basic" || lessonNo > 10) {
      cefrLevel = "A2";
      sentenceLength = "4-7 words";
      complexity = "present tense, numbers, colors, family members";
    }

    const languageName = LANGUAGE_NAMES[lang] || lang.toUpperCase();

    // Topic pools for variety - different for each CEFR level
    const topicPools: Record<string, string[]> = {
      A1: [
        "greeting someone formally and informally at different times of day",
        "introducing yourself and asking someone's name and origin",
        "ordering coffee, tea, water and snacks at a café",
        "asking for directions to the train station, airport, and hotel",
        "buying train, bus, and metro tickets",
        "counting from 1-100 and telling the time",
        "describing today's weather and asking about tomorrow",
        "asking prices when shopping for groceries",
        "saying please, thank you, excuse me, and sorry",
        "family members and describing relationships",
      ],
      A2: [
        "making hotel reservations and asking about amenities",
        "describing symptoms and buying medicine at a pharmacy",
        "making appointments at the doctor or dentist",
        "talking about hobbies, sports, and weekend activities",
        "giving and following street directions with landmarks",
        "ordering at a restaurant with dietary preferences",
        "shopping for clothes, asking about sizes and colors",
        "describing your daily routine and schedule",
        "asking about transportation schedules and delays",
        "talking about your job or studies",
      ],
      B1: [
        "expressing opinions about movies, books, and TV shows",
        "describing memorable travel experiences in the past",
        "discussing future plans, goals, and dreams",
        "explaining a problem to customer service or tech support",
        "making formal phone calls for appointments or inquiries",
        "writing and discussing emails for work or school",
        "discussing current events and local news",
        "negotiating prices at a market or for services",
        "describing your hometown and comparing it to other cities",
        "talking about environmental issues and recycling",
      ],
      B2: [
        "debating social topics like work-life balance",
        "explaining complex processes and giving instructions",
        "discussing hypothetical situations and their consequences",
        "making formal complaints about products or services",
        "presenting ideas in a meeting or academic setting",
        "discussing climate change and sustainability",
        "analyzing differences between cultures",
        "negotiating terms in business or rental agreements",
        "discussing health, fitness, and lifestyle choices",
        "explaining historical events and their significance",
      ],
      C1: [
        "nuanced political discussions with multiple viewpoints",
        "academic presentations with supporting arguments",
        "discussing legal rights and bureaucratic procedures",
        "philosophical debates about ethics and morality",
        "advanced business negotiations with technical terms",
        "literary analysis discussing themes and symbolism",
        "scientific explanations of natural phenomena",
        "using idioms, proverbs, and figurative language",
        "discussing art movements and cultural criticism",
        "handling conflict resolution and mediation",
      ],
    };

    // Kids mode has simpler, fun topics
    const kidsTopics = [
      "animals and pets - cats, dogs, birds, fish",
      "colors and shapes - circles, squares, rainbows",
      "food and drinks kids love - pizza, ice cream, juice",
      "family members - mom, dad, brother, sister, grandparents",
      "playground activities - swings, slides, playing ball",
      "classroom objects - pencil, book, desk, teacher",
      "body parts - head, arms, legs, eyes, nose",
      "weather - sunny, rainy, cloudy, snow",
      "numbers and counting toys",
      "days of the week and daily activities",
    ];

    const levelTopics = kidsMode ? kidsTopics : (topicPools[cefrLevel] || topicPools["A1"]);
    // If topic hint provided, use it; otherwise random selection
    const selectedTopics = topic 
      ? [topic, ...levelTopics.filter(t => t !== topic).sort(() => 0.5 - Math.random()).slice(0, 2)]
      : levelTopics.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Build exclusion note
    const exclusionNote = excludeQuestions.length > 0 
      ? `\n\nAVOID THESE EXACT QUESTIONS (already used):\n${excludeQuestions.map(q => `- "${q}"`).join("\n")}`
      : "";

    const prompt = {
      role: "system",
      content:
        "You are an expert language-learning content generator for a Duolingo-style app.\n" +
        "Output ONLY valid JSON with { \"exercises\": AiExercise[] }.\n\n" +
        "ABSOLUTELY BANNED (NEVER USE):\n" +
        "- 'I am happy', 'I am sad', 'I am tired', 'I am hungry', 'I am fine'\n" +
        "- 'The cat is big', 'The dog is small', 'This is a book', 'This is a pen'\n" +
        "- Any simple 'I am [adjective]' or 'The [animal] is [adjective]' patterns\n" +
        "- 'Fill in the blank: I ___ happy' or similar trivial fill-blanks\n" +
        "- 'audio transcript', 'word bank' as answers\n" +
        "- Single word answers (except for vocabulary matching)\n\n" +
        "REQUIRED: Generate PRACTICAL, REAL-WORLD sentences that people actually use:\n" +
        "✅ 'Excuse me, where is the nearest pharmacy?'\n" +
        "✅ 'I would like a table for two, please'\n" +
        "✅ 'What time does the museum close?'\n" +
        "✅ 'Can you recommend a good restaurant nearby?'\n" +
        "✅ 'My flight leaves at 3 o'clock tomorrow'\n\n" +
        `CEFR Level: ${cefrLevel} - Sentence complexity: ${complexity}\n` +
        `Sentence length: ${sentenceLength}\n` +
        (kidsMode ? "MODE: Kids/Children - Use simple, fun, encouraging language with emojis in hints!\n" : "") +
        "\nCRITICAL word_bank RULES:\n" +
        "- The 'words' array MUST contain ALL words from correct_answer\n" +
        "- Add exactly 2-3 distractor words that are plausible but not in the answer\n" +
        "- Shuffle the words randomly\n\n" +
        "Exercise variety required:\n" +
        "- 2x multiple_choice (translate English→target with 4 options)\n" +
        "- 2x translation (type the translation)\n" +
        "- 2x word_bank (arrange words to form a sentence)\n" +
        "- 1x match_pairs (4 word pairs left/right - vocabulary matching)\n" +
        "- 2x type_what_you_hear (transcribe a target language phrase)\n" +
        "- 1x fill_blank (complete a sentence with missing word)\n\n" +
        "Options formats:\n" +
        "- multiple_choice: options: string[] (exactly 4 including correct)\n" +
        "- word_bank: options: { words: string[] } (all answer words + 2-3 distractors, shuffled)\n" +
        "- match_pairs: options: { pairs: [{left: string, right: string}] } (exactly 4 pairs)\n" +
        "- type_what_you_hear: question='Type what you hear: [phrase in target language]', correct_answer=[same phrase]\n" +
        "- fill_blank: question with ___ for blank, correct_answer is the missing word(s)\n" +
        exclusionNote,
    };

    const userMsg = {
      role: "user",
      content:
        `Target language: ${languageName} (code: ${lang}). Lesson number: ${lessonNo}. CEFR Level: ${cefrLevel}.\n` +
        `Generate exactly 10 high-quality, UNIQUE exercises for ${cefrLevel} learners.\n` +
        `Focus on these specific scenarios: ${selectedTopics.join(", ")}.\n` +
        `All answers must be written in ${languageName}. Questions are in English.\n` +
        `Each exercise MUST be different - vary the vocabulary, grammar, and context.\n` +
        `CRITICAL: Use REAL practical sentences, NOT basic patterns like 'I am happy' or 'The cat is big'.`,
    };

    console.log(`Generating exercises for ${languageName} (${lang}), lesson ${lessonNo}, CEFR: ${cefrLevel}, kids: ${kidsMode}`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.9, // Higher for more variety
        response_format: { type: "json_object" },
        messages: [prompt, userMsg],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("AI gateway error:", aiRes.status, errText);
      
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
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
      console.error("Failed to parse AI response:", content.slice(0, 500));
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
      .filter((ex) => ex.correct_answer.length >= 2) // Must have at least 2 chars
      .filter((ex) => !containsBannedPattern(ex.question) && !containsBannedPattern(ex.correct_answer))
      .filter((ex) => !excludeQuestions.some(used => 
        used.toLowerCase() === ex.question.toLowerCase() || 
        used.toLowerCase() === ex.correct_answer.toLowerCase()
      ))
      .map(validateWordBank)
      .slice(0, 12);

    console.log(`Generated ${cleaned.length} valid exercises for ${lang} lesson ${lessonNo} (${cefrLevel})`);

    return new Response(JSON.stringify({ exercises: cleaned, cefrLevel }), {
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
