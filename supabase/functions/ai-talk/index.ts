import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DifficultyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface TalkPhrase {
  key: string;
  en: string;
  translation: string;
  level: DifficultyLevel;
}

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

// Topic pools for each CEFR level
const TOPIC_POOLS: Record<DifficultyLevel, string[]> = {
  A1: [
    "basic greetings and farewells",
    "introducing yourself by name and age",
    "counting from 1 to 20",
    "days of the week and months",
    "colors and simple descriptions",
    "family members (mother, father, brother, sister)",
    "simple food items (bread, water, milk, fruit)",
    "asking for items in a shop",
    "basic weather (sunny, rainy, cold, hot)",
    "classroom objects and simple instructions",
  ],
  A2: [
    "ordering food and drinks at a café",
    "giving and following simple directions",
    "making a hotel reservation",
    "buying tickets for transport",
    "describing daily routines and schedules",
    "talking about hobbies and free time",
    "asking about prices and payment",
    "describing your home and neighborhood",
    "making appointments",
    "simple shopping conversations",
  ],
  B1: [
    "expressing opinions about movies and books",
    "describing past travel experiences",
    "discussing future plans and goals",
    "explaining a problem to customer service",
    "making formal phone calls",
    "discussing current events",
    "negotiating prices",
    "comparing cities and places",
    "talking about work and career",
    "describing symptoms to a doctor",
  ],
  B2: [
    "debating social issues respectfully",
    "explaining complex processes step by step",
    "discussing hypothetical situations",
    "making formal complaints",
    "presenting ideas in a meeting",
    "discussing environmental topics",
    "analyzing cultural differences",
    "negotiating business agreements",
    "discussing health and lifestyle",
    "explaining historical events",
  ],
  C1: [
    "nuanced political discussions",
    "academic presentations with evidence",
    "discussing legal and bureaucratic matters",
    "philosophical debates about ethics",
    "advanced business negotiations",
    "literary analysis and criticism",
    "scientific explanations",
    "using idioms and figurative language",
    "discussing art and cultural movements",
    "conflict resolution and mediation",
  ],
  C2: [
    "mastering subtle humor and irony",
    "professional debate and rhetoric",
    "academic discourse at expert level",
    "understanding regional dialects and slang",
    "diplomatic and political language",
    "legal contract terminology",
    "medical consultation terminology",
    "financial and economic analysis",
    "philosophical argumentation",
    "native-level spontaneous conversation",
  ],
};

// Kids-specific topics
const KIDS_TOPICS: Record<string, string[]> = {
  A1: ["animals and pets", "colors and shapes", "numbers 1-10", "family members", "toys and games"],
  A2: ["favorite foods", "playground activities", "school subjects", "seasons and weather", "birthday parties"],
  B1: ["hobbies and sports", "my neighborhood", "helping at home", "friends and friendship", "weekend activities"],
  B2: ["future dreams", "favorite stories", "comparing things", "giving instructions", "talking about feelings"],
  C1: ["explaining why", "problem solving", "creative storytelling", "expressing complex emotions", "debating gently"],
  C2: ["advanced vocabulary", "complex stories", "abstract concepts", "persuasive speech", "creative expression"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { languageCode, category, difficultyLevel, isKidsMode, usedPhrases, batchSize = 10 } = body;
    
    const lang = String(languageCode || "es").trim();
    const cefrLevel = (difficultyLevel || "A1") as DifficultyLevel;
    const kidsMode = Boolean(isKidsMode);
    const categoryHint = String(category || "").trim();
    const excludePhrases = Array.isArray(usedPhrases) ? usedPhrases.slice(0, 50) : [];
    const count = Math.min(Math.max(Number(batchSize) || 10, 5), 20);

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

    const languageName = LANGUAGE_NAMES[lang] || lang.toUpperCase();
    
    // Select topics based on mode and level
    const topicPool = kidsMode 
      ? (KIDS_TOPICS[cefrLevel] || KIDS_TOPICS.A1)
      : (TOPIC_POOLS[cefrLevel] || TOPIC_POOLS.A1);
    
    const selectedTopics = categoryHint
      ? [categoryHint, ...topicPool.filter(t => t !== categoryHint).sort(() => 0.5 - Math.random()).slice(0, 2)]
      : topicPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Phrase complexity by level
    const levelComplexity: Record<DifficultyLevel, { words: string; grammar: string }> = {
      A1: { words: "2-4 words", grammar: "present tense, basic nouns and verbs" },
      A2: { words: "4-7 words", grammar: "present and simple past, common expressions" },
      B1: { words: "6-10 words", grammar: "past and future tenses, modal verbs" },
      B2: { words: "8-12 words", grammar: "conditional, relative clauses, varied vocabulary" },
      C1: { words: "10-16 words", grammar: "subjunctive, idioms, complex clauses" },
      C2: { words: "12-20 words", grammar: "native-level expressions, nuanced vocabulary, rare idioms" },
    };

    const complexity = levelComplexity[cefrLevel] || levelComplexity.A1;

    const exclusionNote = excludePhrases.length > 0
      ? `\n\nDO NOT USE THESE PHRASES (already practiced):\n${excludePhrases.map(p => `- "${p}"`).join("\n")}`
      : "";

    const prompt = {
      role: "system",
      content:
        "You are an expert language-learning content generator for a speech practice app.\n" +
        "Output ONLY valid JSON: { \"phrases\": TalkPhrase[] }\n\n" +
        "Each TalkPhrase must have:\n" +
        "- key: unique snake_case identifier\n" +
        "- en: English phrase\n" +
        "- translation: The phrase in the target language\n" +
        "- level: CEFR level (A1, A2, B1, B2, C1, C2)\n\n" +
        "CRITICAL RULES:\n" +
        "- Generate PRACTICAL, REAL-WORLD phrases that people actually say\n" +
        "- Each phrase MUST be unique and different from others in the batch\n" +
        "- Translations must be accurate and natural in the target language\n" +
        `- Phrase length: ${complexity.words}\n` +
        `- Grammar focus: ${complexity.grammar}\n` +
        (kidsMode ? "- MODE: Kids - Use simple, fun, age-appropriate language\n" : "") +
        `- CEFR Level: ${cefrLevel} - Generate ONLY ${cefrLevel}-appropriate content\n` +
        "- Do NOT include any A1/A2 phrases when generating B2/C1/C2 content\n" +
        exclusionNote,
    };

    const userMsg = {
      role: "user",
      content:
        `Generate exactly ${count} unique phrases for speaking practice.\n` +
        `Target language: ${languageName} (code: ${lang})\n` +
        `CEFR Level: ${cefrLevel}\n` +
        `Topics to focus on: ${selectedTopics.join(", ")}\n` +
        `All translations must be in ${languageName}. English phrases as "en".\n` +
        `IMPORTANT: Difficulty must match ${cefrLevel} exactly - no simpler content!`,
    };

    console.log(`Generating ${count} talk phrases for ${languageName}, level ${cefrLevel}, kids: ${kidsMode}`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [prompt, userMsg],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("AI gateway error:", aiRes.status, errText);
      
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
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
      
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: { phrases?: TalkPhrase[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content.slice(0, 500));
      parsed = {};
    }

    const phrases = Array.isArray(parsed.phrases) ? parsed.phrases : [];

    // Clean and validate phrases
    const cleaned = phrases
      .map((p) => ({
        key: String(p?.key || `phrase_${Math.random().toString(36).slice(2, 8)}`).trim(),
        en: String(p?.en || "").trim(),
        translation: String(p?.translation || "").trim(),
        level: String(p?.level || cefrLevel) as DifficultyLevel,
      }))
      .filter((p) => p.en && p.translation && p.en.length >= 2 && p.translation.length >= 2)
      .filter((p) => !excludePhrases.some(used => 
        used.toLowerCase() === p.en.toLowerCase() || 
        used.toLowerCase() === p.translation.toLowerCase()
      ))
      .slice(0, count);

    console.log(`Generated ${cleaned.length} valid phrases for ${lang} at ${cefrLevel}`);

    return new Response(JSON.stringify({ phrases: cleaned, level: cefrLevel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ai-talk error:", msg);
    return new Response(JSON.stringify({ error: msg || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
