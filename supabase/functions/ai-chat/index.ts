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

// Conversation topics for "Ask Me" feature
const CONVERSATION_TOPICS = {
  greetings: [
    "How are you today?",
    "Good morning! What are your plans for today?",
    "Hello! Nice to meet you. Where are you from?"
  ],
  food: [
    "What's your favorite food?",
    "Do you prefer cooking at home or eating out?",
    "What did you have for breakfast today?"
  ],
  travel: [
    "Have you traveled anywhere interesting recently?",
    "What's your dream vacation destination?",
    "Do you prefer beaches or mountains?"
  ],
  hobbies: [
    "What do you like to do in your free time?",
    "Do you play any sports?",
    "What kind of music do you enjoy?"
  ],
  daily: [
    "What time do you usually wake up?",
    "How do you get to work or school?",
    "What's your favorite day of the week?"
  ],
  shopping: [
    "Do you enjoy shopping?",
    "What was the last thing you bought?",
    "Do you prefer shopping online or in stores?"
  ],
  weather: [
    "What's the weather like where you are?",
    "Do you prefer hot or cold weather?",
    "What do you like to do on rainy days?"
  ],
  family: [
    "Do you have any brothers or sisters?",
    "What do you and your family like to do together?",
    "Do you have any pets?"
  ]
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, // 'chat' | 'ask_question'
      userMessage, 
      conversationHistory,
      languageCode,
      topic // for ask_question type
    } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const languageName = LANGUAGE_NAMES[languageCode] || languageCode;

    if (type === 'ask_question') {
      // Generate a question for the user to practice answering
      const topicQuestions = topic && CONVERSATION_TOPICS[topic as keyof typeof CONVERSATION_TOPICS]
        ? CONVERSATION_TOPICS[topic as keyof typeof CONVERSATION_TOPICS]
        : Object.values(CONVERSATION_TOPICS).flat();
      
      const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

      // Translate the question to the target language
      const translateRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following English question to ${languageName}. Output ONLY the translation.`
            },
            { role: "user", content: randomQuestion }
          ],
        }),
      });

      if (!translateRes.ok) {
        throw new Error("Failed to translate question");
      }

      const translateJson = await translateRes.json();
      const translatedQuestion = translateJson?.choices?.[0]?.message?.content?.trim() ?? randomQuestion;

      return new Response(JSON.stringify({ 
        question: translatedQuestion,
        questionEnglish: randomQuestion,
        topic: topic || 'general'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chat response type
    if (!userMessage) {
      return new Response(JSON.stringify({ error: "userMessage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation messages for context
    const messages = [
      {
        role: "system",
        content: `You are a friendly language practice partner having a natural conversation in ${languageName}. 
Rules:
1. ALWAYS respond in ${languageName} - never in English unless the user writes in English
2. Keep responses conversational and natural, like a native speaker
3. Use appropriate formality based on context
4. Responses should be 1-3 sentences - not too long
5. If the user makes grammar mistakes, gently correct them within your response
6. Be encouraging and helpful
7. Ask follow-up questions to keep the conversation going`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Keep last 10 messages for context
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add the current user message
    messages.push({ role: "user", content: userMessage });

    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        messages,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text().catch(() => "");
      console.error("Chat error:", chatRes.status, errText);
      
      if (chatRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (chatRes.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Chat failed");
    }

    const chatJson = await chatRes.json();
    const aiResponse = chatJson?.choices?.[0]?.message?.content?.trim() ?? "";

    // Also get English translation of the AI response
    const translateRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `Translate the following ${languageName} text to English. Output ONLY the translation.`
          },
          { role: "user", content: aiResponse }
        ],
      }),
    });

    let englishTranslation = "";
    if (translateRes.ok) {
      const translateJson = await translateRes.json();
      englishTranslation = translateJson?.choices?.[0]?.message?.content?.trim() ?? "";
    }

    console.log(`Chat in ${languageName}: user said "${userMessage.slice(0, 50)}..."`);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      responseEnglish: englishTranslation,
      languageCode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ai-chat error:", msg);
    return new Response(JSON.stringify({ error: msg || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
