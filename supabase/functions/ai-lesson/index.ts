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
  | "select_sentence"
  | "listen_and_select"
  | "write_in_english"
  | "flashcard";

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
  /\bi am (happy|sad|tired|hungry|thirsty|fine|good|bad|okay|great|well|cold|hot|ready|busy)\b/i,
  /\bthe (cat|dog|bird|fish) is (big|small|black|white|brown|cute|nice|good|bad)\b/i,
  /\b(she|he) is (nice|tall|short|young|old|happy|sad|good|bad)\b/i,
  /\bit is (good|bad|nice|big|small|hot|cold|new|old)\b/i,
  /\bthis is (a|an|the)?\s*(book|pen|apple|cat|dog|table|chair|car)\b/i,
  /\baudio transcript\b/i,
  /\bword bank\b/i,
  /\btype what you hear\b/i,
  /^(yes|no|hello|hi|bye|good|bad|nice|okay|ok)$/i,
  /\bi _+ (happy|sad|tired|good|bad|fine)\b/i,
  /placeholder/i,
  /example/i,
  /translation1/i,
  /word\s?\d+/i,
  /option\s?\d+/i,
];

const containsBannedPattern = (text: string): boolean => {
  if (!text || text.length < 3) return true;
  return BANNED_PATTERNS.some(pattern => pattern.test(text));
};

// Validate word_bank exercises
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

// Topic pools organized by CEFR level with 10 unique scenarios each
const TOPIC_POOLS: Record<string, string[][]> = {
  A1: [
    ["greeting a shopkeeper when entering a store", "asking a stranger for the time", "thanking someone for holding a door"],
    ["introducing yourself at a party", "asking someone's nationality", "saying where you're from"],
    ["ordering a coffee with milk", "asking for a glass of water", "requesting the bill at a café"],
    ["asking where the bathroom is", "getting directions to the bus stop", "finding the train station"],
    ["buying a single train ticket", "asking about departure times", "requesting a round-trip ticket"],
    ["telling someone your phone number", "saying today's date", "asking what time a store opens"],
    ["describing if it's sunny today", "asking if rain is expected", "saying it's cold outside"],
    ["asking how much something costs", "saying you want to buy bread", "paying with cash or card"],
    ["apologizing for being late", "excusing yourself to pass by", "saying you don't understand"],
    ["introducing your mother", "asking about siblings", "describing your family size"],
  ],
  A2: [
    ["booking a hotel room for two nights", "asking about breakfast included", "requesting a quiet room"],
    ["describing a headache to a pharmacist", "asking for cold medicine", "explaining allergies"],
    ["making a doctor appointment", "describing stomach pain", "asking about wait time"],
    ["discussing favorite sports", "inviting someone to play tennis", "talking about weekend hiking plans"],
    ["explaining you're looking for a museum", "asking about nearby restaurants", "finding a gas station"],
    ["ordering vegetarian food at a restaurant", "asking about ingredients", "requesting no spice"],
    ["asking for a different size shoe", "requesting a receipt", "asking about a sale"],
    ["describing your morning routine", "talking about what you eat for lunch", "explaining your work schedule"],
    ["asking when the next bus arrives", "reporting a delayed flight", "asking about platform numbers"],
    ["describing your job responsibilities", "asking about someone's profession", "discussing workplace hours"],
  ],
  B1: [
    ["recommending a movie you saw", "explaining why you liked a book", "discussing a TV series ending"],
    ["sharing a memorable vacation story", "describing a place you visited", "talking about travel mishaps"],
    ["explaining your career goals", "discussing education plans", "talking about learning a new skill"],
    ["calling about a broken appliance", "explaining an internet problem", "asking for a refund"],
    ["leaving a voicemail for a doctor", "scheduling a business call", "confirming an appointment"],
    ["writing an email about a meeting", "explaining you'll be late", "requesting information professionally"],
    ["discussing a local event", "talking about news you heard", "sharing community updates"],
    ["bargaining at a market", "discussing payment terms", "asking for a discount on services"],
    ["comparing your city to the capital", "describing neighborhood changes", "explaining why you moved"],
    ["discussing recycling habits", "talking about saving water", "explaining energy conservation"],
  ],
  B2: [
    ["debating remote work benefits", "discussing work-life challenges", "arguing about flexible hours"],
    ["explaining how to use a software", "giving instructions for a task", "describing a process step by step"],
    ["discussing what you'd do if you won the lottery", "talking about past regrets", "imagining alternative life choices"],
    ["writing a complaint about a product", "demanding a refund professionally", "escalating a service issue"],
    ["presenting an idea to colleagues", "defending your position in a debate", "summarizing a research topic"],
    ["debating climate change solutions", "discussing renewable energy", "arguing about environmental policies"],
    ["comparing cultural traditions", "discussing social norms differences", "explaining cultural misunderstandings"],
    ["negotiating a salary increase", "discussing lease terms", "agreeing on project deadlines"],
    ["discussing diet and nutrition", "debating exercise routines", "explaining stress management techniques"],
    ["describing a historical event's impact", "discussing causes of a war", "explaining economic changes"],
  ],
  C1: [
    ["analyzing different political viewpoints", "discussing election systems", "debating government policies"],
    ["presenting research findings", "supporting arguments with evidence", "responding to academic criticism"],
    ["explaining tenant rights", "discussing legal contracts", "navigating bureaucratic systems"],
    ["debating ethical dilemmas", "discussing moral philosophy", "arguing about societal values"],
    ["conducting a business negotiation", "discussing merger implications", "explaining market strategies"],
    ["analyzing themes in literature", "discussing author intentions", "comparing literary movements"],
    ["explaining a scientific theory", "describing an experiment", "discussing research methodology"],
    ["using idiomatic expressions naturally", "understanding proverbs", "using figurative language"],
    ["critiquing an art exhibition", "discussing film cinematography", "analyzing music composition"],
    ["mediating a workplace dispute", "facilitating a group discussion", "resolving conflicting viewpoints"],
  ],
  C2: [
    ["delivering a keynote speech", "improvising in high-pressure situations", "handling hostile interview questions"],
    ["writing satirical commentary", "using irony effectively", "crafting nuanced arguments"],
    ["translating complex documents", "explaining untranslatable concepts", "bridging cultural language gaps"],
    ["leading philosophical discussions", "defending thesis statements", "engaging in Socratic dialogue"],
    ["analyzing economic indicators", "predicting market trends", "explaining monetary policy"],
    ["discussing medical ethics", "debating healthcare systems", "analyzing public health policy"],
    ["explaining quantum concepts", "discussing technological singularity", "debating AI consciousness"],
    ["analyzing geopolitical conflicts", "discussing diplomatic negotiations", "explaining international law"],
    ["critiquing contemporary art", "discussing avant-garde movements", "analyzing cultural phenomena"],
    ["crafting compelling narratives", "using rhetorical devices masterfully", "adapting communication styles"],
  ],
};

// Kids mode topics - age-appropriate, fun, and simple
const KIDS_TOPICS: Record<string, string[][]> = {
  A1: [
    ["naming cute zoo animals like pandas and elephants", "what sounds do farm animals make", "counting baby animals"],
    ["finding your favorite rainbow colors", "drawing fun shapes", "matching colorful pairs"],
    ["choosing yummy ice cream flavors", "naming fruits you love to eat", "describing your favorite snack"],
    ["introducing your family with love", "describing mom and dad", "talking about brothers and sisters"],
    ["playing on the playground", "your favorite outdoor games", "what toys you like"],
  ],
  A2: [
    ["describing your pet and what it does", "imagining having a magical pet", "taking care of animals"],
    ["telling a story about your best friend", "playing games with classmates", "sharing toys nicely"],
    ["describing your favorite cartoon character", "telling about a fun movie", "your favorite superhero"],
    ["what you want to be when you grow up", "describing cool jobs", "helping people in the community"],
    ["planning a fun birthday party", "your favorite holiday", "giving and receiving presents"],
  ],
  B1: [
    ["writing a letter to a pen pal", "making friends online safely", "describing your school to someone far away"],
    ["explaining rules of your favorite game", "teaching someone a new sport", "being a good team player"],
    ["describing a fun adventure you had", "imagining going to space", "exploring a magical forest"],
    ["talking about protecting the environment", "recycling and being eco-friendly", "saving endangered animals"],
    ["creating your own invention", "building something cool", "solving problems creatively"],
  ],
  B2: [
    ["debating which superpower is best", "discussing favorite book characters", "comparing different video games"],
    ["explaining how to make your favorite recipe", "describing cultural food traditions", "planning a healthy meal"],
    ["discussing what makes a good friend", "handling disagreements kindly", "standing up against bullying"],
    ["presenting a school project", "explaining a science experiment", "teaching others something you learned"],
    ["discussing dreams and goals", "planning for the future", "what success means to you"],
  ],
  C1: [
    ["analyzing themes in your favorite book series", "comparing different storytelling styles", "writing a creative short story"],
    ["discussing current events appropriately", "understanding different perspectives", "forming your own opinions"],
    ["explaining complex scientific concepts simply", "discussing space exploration", "debating technology's impact"],
    ["understanding different cultures and traditions", "discussing global celebrations", "respecting diversity"],
    ["leadership and making a difference", "community service projects", "inspiring others to do good"],
  ],
  C2: [
    ["crafting persuasive arguments for a debate", "analyzing literature deeply", "writing sophisticated essays"],
    ["discussing philosophical questions for young minds", "exploring ethics and morality", "critical thinking challenges"],
    ["advanced scientific discussions", "understanding climate change", "exploring innovation and future tech"],
    ["global citizenship and responsibility", "understanding world history", "cultural exchange and empathy"],
    ["mastering figurative language", "using idioms correctly", "advanced creative writing"],
  ],
};

// Adult mode topics - already defined above as TOPIC_POOLS

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      languageCode,
      lessonNumber,
      difficulty,
      isKidsMode,
      topicHint,
      usedQuestions,
      sectionNumber,
      generationId,
      qsetVersion,
    } = body;
    const lang = clean(languageCode) as LanguageCode;
    const lessonNo = clampLesson(lessonNumber);
    const diffLevel = clean(difficulty) || "beginner";
    const kidsMode = Boolean(isKidsMode);
    const topic = clean(topicHint) || "";
    const excludeQuestions = Array.isArray(usedQuestions) ? usedQuestions.slice(0, 200) : [];
    const section = Number(sectionNumber) || 0;
    const genId = clean(generationId) || "";
    const qset = Number(qsetVersion);
    const qsetNum = Number.isFinite(qset) ? Math.floor(qset) : 0;

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

    // Map difficulty to CEFR level with STRICT complexity requirements
    let cefrLevel = "A1";
    let sentenceLength = "3-5 words";
    let complexity = "basic vocabulary and present tense only";
    let grammarFocus = "simple present tense, basic nouns, common adjectives";
    
    if (diffLevel === "mastery" || diffLevel === "C2" || lessonNo > 100) {
      cefrLevel = "C2";
      sentenceLength = "18-30 words";
      complexity = "native-level mastery with idioms, proverbs, nuanced expressions, subjunctive, passive voice, all tenses including perfect aspects, rhetorical devices";
      grammarFocus = "complex subordinate clauses, conditional perfect, subjunctive mood, idiomatic expressions, euphemisms, irony, cultural references";
    } else if (diffLevel === "expert" || diffLevel === "C1" || lessonNo > 80) {
      cefrLevel = "C1";
      sentenceLength = "15-22 words";
      complexity = "advanced grammar, idioms, subjunctive mood, complex embedded clauses, formal and informal registers";
      grammarFocus = "reported speech, passive constructions, relative clauses, conditional sentences (all types), modal perfects";
    } else if (diffLevel === "fluent" || diffLevel === "B2" || lessonNo > 60) {
      cefrLevel = "B2";
      sentenceLength = "12-18 words";
      complexity = "past and future tenses, conditional, relative clauses, linking words, expressing opinions";
      grammarFocus = "conditionals (types 1-3), passive voice, relative pronouns, discourse markers, comparing and contrasting";
    } else if (diffLevel === "advanced" || diffLevel === "B1" || lessonNo > 40) {
      cefrLevel = "B1";
      sentenceLength = "8-14 words";
      complexity = "past tense, future tense, modal verbs, conjunctions, time expressions";
      grammarFocus = "past simple and continuous, future with will/going to, modals of obligation and possibility, time clauses";
    } else if (diffLevel === "intermediate" || diffLevel === "A2" || lessonNo > 20) {
      cefrLevel = "A2";
      sentenceLength = "5-10 words";
      complexity = "simple past, basic conjunctions, common expressions, high-frequency vocabulary";
      grammarFocus = "past simple, possessives, comparatives, prepositions of place and time, frequency adverbs";
    } else if (diffLevel === "basic" || lessonNo > 10) {
      cefrLevel = "A1";
      sentenceLength = "4-7 words";
      complexity = "present tense, numbers, colors, family members, basic questions";
      grammarFocus = "simple present, to be, have, basic question words, singular/plural nouns";
    }

    const languageName = LANGUAGE_NAMES[lang] || lang.toUpperCase();

    // Select topics based on CEFR level, section, qset, and genId for maximum variation
    // For kids mode, use CEFR-appropriate kids topics
    const levelTopics = kidsMode 
      ? (KIDS_TOPICS[cefrLevel] || KIDS_TOPICS["A1"]) 
      : (TOPIC_POOLS[cefrLevel] || TOPIC_POOLS["A1"]);
    // Use genId hash + qsetNum + section + lessonNo for topic selection diversity
    const genHash = genId ? genId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    const topicSetIndex = (section + lessonNo + qsetNum + genHash) % levelTopics.length;
    const selectedTopicSet = levelTopics[topicSetIndex];
    
    // Use topic hint if provided, otherwise use selected topic set
    const scenarioTopics = topic 
      ? [topic, ...selectedTopicSet.filter(t => t !== topic)]
      : selectedTopicSet;

    // Build exclusion note with more emphasis
    const exclusionNote = excludeQuestions.length > 0 
      ? `\n\n⚠️ CRITICAL - NEVER USE THESE EXACT QUESTIONS OR ANSWERS (already used, must be completely different vocabulary):\n${excludeQuestions.slice(0, 40).map(q => `- "${q}"`).join("\n")}\n\nGenerate COMPLETELY NEW sentences with DIFFERENT vocabulary and topics!`
      : "";

    // Enhanced kids mode instructions
    const kidsModeInstructions = kidsMode
      ? `\n\n🧒 KIDS MODE ACTIVE - CRITICAL REQUIREMENTS:\n` +
        `- Use FUN, ENGAGING, age-appropriate language\n` +
        `- Include encouraging emojis in hints (🌟 ⭐ 🎉 👍 🦁 🐼)\n` +
        `- Topics: animals, colors, family, food, toys, games, school, nature\n` +
        `- Tone: Friendly, supportive, playful - like a fun teacher\n` +
        `- Sentences should feel like a game or adventure\n` +
        `- Use simple, positive vocabulary\n` +
        `- Avoid: complex grammar, adult topics, negative emotions, scary content\n`
      : "";

    // C2 specific instructions for truly complex content
    const c2Instructions = cefrLevel === "C2"
      ? `\n\n🎓 C2 MASTERY LEVEL - CRITICAL REQUIREMENTS:\n` +
        `- Sentences MUST be sophisticated with nuanced meaning\n` +
        `- Use idiomatic expressions, proverbs, and cultural references\n` +
        `- Include complex grammatical structures: subjunctive, passive, conditionals\n` +
        `- Vocabulary should be advanced: euphemisms, formal register, literary terms\n` +
        `- Topics: business negotiations, academic discourse, philosophical debates, cultural analysis\n` +
        `- Sentences should challenge even near-native speakers\n` +
        `- Include rhetorical devices: metaphor, irony, understatement\n`
      : "";

    const prompt = {
      role: "system",
      content:
        `You are an expert ${languageName} language teacher creating exercises for a mobile learning app.\n` +
        "Output ONLY valid JSON with { \"exercises\": AiExercise[] }.\n\n" +
        "BANNED CONTENT (NEVER USE):\n" +
        "- 'I am happy', 'I am sad', 'I am tired', 'I am hungry', 'I am fine'\n" +
        "- 'The cat is big', 'The dog is small', 'This is a book'\n" +
        "- Any 'I am [adjective]' or 'The [animal] is [adjective]' patterns\n" +
        "- Generic greetings like just 'Hello' or 'Goodbye' without context\n" +
        "- Placeholder text like 'word1', 'option1', 'translation1'\n\n" +
        "REQUIRED: Generate PRACTICAL, REAL-WORLD sentences people actually use:\n" +
        "✅ 'Excuse me, where is the nearest pharmacy?'\n" +
        "✅ 'I would like a table for two, please'\n" +
        "✅ 'What time does the museum close?'\n" +
        "✅ 'Can you recommend a good restaurant nearby?'\n" +
        "✅ 'My flight leaves at 3 o'clock tomorrow'\n\n" +
        `CEFR Level: ${cefrLevel} (STRICT - follow exactly!)\n` +
        `Complexity: ${complexity}\n` +
        `Grammar Focus: ${grammarFocus}\n` +
        `Sentence length: ${sentenceLength}\n` +
        kidsModeInstructions +
        c2Instructions +
        "\nEXERCISE TYPES TO GENERATE (exactly 10 exercises total):\n" +
        "1. multiple_choice: Translate English→${languageName} with 4 options (including correct)\n" +
        "2. translation: Type the ${languageName} translation of an English sentence\n" +
        "3. word_bank: Arrange words to form ${languageName} sentence (include ALL answer words + 3 distractors)\n" +
        "4. match_pairs: Match 4 English words to ${languageName} translations\n" +
        "5. type_what_you_hear: Audio transcription - question shows the phrase, answer is same phrase\n" +
        "6. fill_blank: Complete ${languageName} sentence with missing word(s)\n" +
        "7. listen_and_select: Listen and pick correct meaning (4 English options)\n" +
        "8. write_in_english: Translate ${languageName}→English\n" +
        "9. speak_answer: Pronounce the ${languageName} phrase shown\n" +
        "10. flashcard: Vocabulary card with word on front, meaning on back\n\n" +
        "DISTRIBUTION: 2 multiple_choice, 1 translation, 2 word_bank, 1 match_pairs, " +
        "1 type_what_you_hear, 1 fill_blank, 1 listen_and_select, 1 write_in_english\n\n" +
        "OPTIONS FORMATS:\n" +
        "- multiple_choice/listen_and_select: options: string[] (exactly 4, include correct)\n" +
        "- word_bank: options: { words: string[] } (all answer words + distractors, shuffled)\n" +
        "- match_pairs: options: { pairs: [{left: string, right: string}] } (4 pairs)\n" +
        "- type_what_you_hear: question='Type: [phrase in ${languageName}]', correct_answer=same phrase\n" +
        "- fill_blank: question has '___', correct_answer is the missing word(s)\n" +
        "- write_in_english: question shows ${languageName}, answer in English\n" +
        "- flashcard: options: { front: string, back: string } for display\n" +
        "- speak_answer: no options needed\n" +
        exclusionNote,
    };

    const userMsg = {
      role: "user",
      content:
        `Target language: ${languageName} (code: ${lang}). Lesson: ${lessonNo}, Section: ${section}.\n` +
        `Generation ID: ${genId || 'default'} | Question Set: ${qsetNum}.\n` +
        `Generate EXACTLY 10 unique, high-quality ${cefrLevel} exercises.\n` +
        `Focus scenarios: ${scenarioTopics.join("; ")}.\n` +
        `All target language answers must be in ${languageName}.\n` +
        `Each exercise MUST have completely different vocabulary and context.\n` +
        `NO REPEATS - every question and answer must be unique.\n` +
        `IMPORTANT: This is generation ${qsetNum} for this lesson - use DIFFERENT vocabulary and sentences than previous generations.\n` +
        `Include helpful hints for learners.`,
    };

    console.log(`Generating exercises for ${languageName} (${lang}), lesson ${lessonNo}, section ${section}, CEFR: ${cefrLevel}, genId: ${genId || 'none'}, qset: ${qsetNum}`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.95,
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
      .filter((ex) => ex.correct_answer.length >= 2)
      .filter((ex) => !containsBannedPattern(ex.question) && !containsBannedPattern(ex.correct_answer))
      .filter((ex) => !excludeQuestions.some(used => 
        used.toLowerCase() === ex.question.toLowerCase() || 
        used.toLowerCase() === ex.correct_answer.toLowerCase()
      ))
      .map(validateWordBank)
      .slice(0, 10);

    console.log(`Generated ${cleaned.length} valid exercises for ${lang} lesson ${lessonNo} section ${section} (${cefrLevel})`);

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
