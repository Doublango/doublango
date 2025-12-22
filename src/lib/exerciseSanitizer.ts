import type { Database, Json } from "@/integrations/supabase/types";
import { LANGUAGE_CONTENT } from "@/lib/languageContent";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type LanguageCode = Database["public"]["Enums"]["language_code"];

// Comprehensive phrase pool with English keys and translations
const ENGLISH_PHRASE_POOL: Array<{ key: string; en: string }> = [
  { key: "hello", en: "Hello" },
  { key: "goodbye", en: "Goodbye" },
  { key: "thank_you", en: "Thank you" },
  { key: "please", en: "Please" },
  { key: "yes", en: "Yes" },
  { key: "no", en: "No" },
  { key: "good_morning", en: "Good morning" },
  { key: "good_night", en: "Good night" },
  { key: "how_are_you", en: "How are you?" },
  { key: "im_fine", en: "I'm fine" },
  { key: "my_name_is", en: "My name is..." },
  { key: "nice_to_meet_you", en: "Nice to meet you" },
  { key: "excuse_me", en: "Excuse me" },
  { key: "sorry", en: "Sorry" },
  { key: "water", en: "Water" },
  { key: "food", en: "Food" },
  { key: "help", en: "Help" },
  { key: "where_is", en: "Where is...?" },
  { key: "how_much", en: "How much?" },
  { key: "i_dont_understand", en: "I don't understand" },
];

// Detect placeholder content that should be replaced
const isPlaceholderString = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  if (!v) return true;
  
  // Match explicit placeholders
  if (
    v === "correct_option" ||
    v === "translated_phrase" ||
    v === "correct sentence" ||
    v === "the correct sentence" ||
    v.startsWith("wrong_")
  ) return true;
  
  // Match "word1", "word2", "word 1", "word 2" patterns
  if (/^word\s?\d+$/i.test(v)) return true;
  
  // Match "translation1", "translation 1", "translation2" patterns  
  if (/^translation\s?\d+$/i.test(v)) return true;
  
  // Match "option1", "option 1" patterns
  if (/^option\s?\d+$/i.test(v)) return true;
  
  return false;
};

const optionsContainPlaceholders = (options: unknown): boolean => {
  if (!options) return true;

  if (Array.isArray(options)) {
    // Check if any option is a placeholder
    const hasPlaceholder = options.some((o) => {
      if (typeof o === 'string') return isPlaceholderString(o);
      if (typeof o === 'object' && o !== null && 'text' in o) {
        return isPlaceholderString((o as { text: string }).text);
      }
      return false;
    });
    // Also return true if array is empty or has fewer than 2 items
    if (options.length < 2) return true;
    return hasPlaceholder;
  }

  if (typeof options === "object") {
    const anyOpt = options as Record<string, unknown>;
    
    // Check words array
    if (Array.isArray(anyOpt.words)) {
      if (anyOpt.words.length === 0) return true;
      return anyOpt.words.some((w) => isPlaceholderString(w));
    }
    
    // Check pairs array
    if (Array.isArray(anyOpt.pairs)) {
      if (anyOpt.pairs.length === 0) return true;
      return anyOpt.pairs.some((p: { left?: string; right?: string }) => 
        isPlaceholderString(p?.left) || isPlaceholderString(p?.right)
      );
    }
  }

  return false;
};

const hashString = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const makeSeededRng = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const rng = makeSeededRng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getPhrasePairs = (languageCode: LanguageCode) => {
  const dict = (LANGUAGE_CONTENT as Record<string, Record<string, string>>)[languageCode] as Record<string, string> | undefined;

  return ENGLISH_PHRASE_POOL.map(({ key, en }) => {
    const target = dict?.[key] || en;
    return { key, en, target };
  });
};

const splitWords = (text: string) => text.split(/\s+/).map((w) => w.trim()).filter(Boolean);

const buildWordHints = (correctAnswer: string, pool: string[], seed: number) => {
  const correctWords = splitWords(correctAnswer);
  const distractorWords = seededShuffle(
    pool
      .flatMap(splitWords)
      .filter((w) => w && !correctWords.includes(w))
      .slice(0, 20),
    seed
  ).slice(0, Math.min(4, Math.max(1, correctWords.length)));

  return seededShuffle([...new Set([...correctWords, ...distractorWords])], seed + 1);
};

export const sanitizeLessonExercises = (
  exercises: Exercise[] | null | undefined,
  languageCode: LanguageCode
): Exercise[] => {
  if (!exercises?.length) return [];

  const pairs = getPhrasePairs(languageCode);
  const targetPool = pairs.map((p) => p.target);

  return exercises.map((ex, idx) => {
    const seed = hashString(`${ex.id}-${idx}-${languageCode}`);
    const needsFix =
      isPlaceholderString(ex.question) ||
      isPlaceholderString(ex.correct_answer) ||
      optionsContainPlaceholders(ex.options);

    if (!needsFix) return ex;

    const picked = pairs[seed % pairs.length];

    let question = ex.question;
    let correct = ex.correct_answer;
    let options: Json = ex.options;

    switch (ex.exercise_type) {
      case "multiple_choice":
      case "select_sentence": {
        question = `Translate: "${picked.en}"`;
        correct = picked.target;
        const distractors = seededShuffle(
          targetPool.filter((t) => t !== correct),
          seed
        ).slice(0, 3);
        options = seededShuffle([correct, ...distractors], seed + 2);
        break;
      }
      case "translation":
      case "fill_blank": {
        question = `Translate: "${picked.en}"`;
        correct = picked.target;
        options = buildWordHints(correct, targetPool, seed);
        break;
      }
      case "word_bank": {
        question = `Arrange the words: "${picked.en}"`;
        correct = picked.target;
        const words = buildWordHints(correct, targetPool, seed);
        options = { words };
        break;
      }
      case "type_what_you_hear": {
        question = "Type what you hear";
        correct = picked.target;
        options = buildWordHints(correct, targetPool, seed);
        break;
      }
      case "speak_answer": {
        question = "Speak this phrase";
        correct = picked.target;
        options = null;
        break;
      }
      case "match_pairs": {
        const rngPairs = seededShuffle(pairs, seed).slice(0, 4);
        question = "Match the pairs";
        correct = "";
        options = {
          pairs: rngPairs.map((p) => ({ left: p.en, right: p.target })),
        };
        break;
      }
      default: {
        question = ex.question?.trim() ? ex.question : `Translate: "${picked.en}"`;
        correct = isPlaceholderString(ex.correct_answer) ? picked.target : ex.correct_answer;
        options = ex.options;
      }
    }

    return {
      ...ex,
      question: question || `Translate: "${picked.en}"`,
      correct_answer: correct || picked.target,
      options,
    };
  });
};
