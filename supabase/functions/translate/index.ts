import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  ca: "Catalan", th: "Thai", en: "English"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fromLanguage, toLanguage } = await req.json();

    if (!text || !fromLanguage || !toLanguage) {
      return new Response(JSON.stringify({ error: "text, fromLanguage, and toLanguage are required" }), {
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

    const fromName = LANGUAGE_NAMES[fromLanguage] || fromLanguage;
    const toName = LANGUAGE_NAMES[toLanguage] || toLanguage;

    const systemPrompt = {
      role: "system",
      content: `You are a professional translator. Translate the given text from ${fromName} to ${toName}. 
Output ONLY the translation, nothing else. No explanations, no notes, just the translated text.
Maintain the same tone and formality level as the original.`
    };

    const userMsg = {
      role: "user",
      content: text
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [systemPrompt, userMsg],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("Translation error:", aiRes.status, errText);
      
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const translation = aiJson?.choices?.[0]?.message?.content?.trim() ?? "";

    console.log(`Translated "${text.slice(0, 50)}..." from ${fromName} to ${toName}`);

    return new Response(JSON.stringify({ translation, fromLanguage, toLanguage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("translate error:", msg);
    return new Response(JSON.stringify({ error: msg || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
