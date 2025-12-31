import type { Database } from "@/integrations/supabase/types";
import type { CEFRLevel } from "@/lib/content/aiLesson";

type LanguageCode = Database["public"]["Enums"]["language_code"];

const QSET_PREFIX = "dbl_ai_qset_v1";
const USED_PREFIX = "dbl_ai_used_v1";

const safeGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemove = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const qsetKey = (lang: LanguageCode, cefr: CEFRLevel) => `${QSET_PREFIX}:${lang}:${cefr}`;
const usedKey = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number) =>
  `${USED_PREFIX}:${lang}:${cefr}:lesson:${lessonNumber}`;

export const getQuestionSetVersion = (lang: LanguageCode, cefr: CEFRLevel): number => {
  const raw = safeGet(qsetKey(lang, cefr));
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

export const bumpQuestionSetVersion = (lang: LanguageCode, cefr: CEFRLevel): number => {
  const next = getQuestionSetVersion(lang, cefr) + 1;
  safeSet(qsetKey(lang, cefr), String(next));
  return next;
};

export const getUsedQuestionBank = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number): string[] => {
  const raw = safeGet(usedKey(lang, cefr, lessonNumber));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
  } catch {
    return [];
  }
};

export const appendUsedQuestionBank = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  values: string[]
) => {
  const existing = getUsedQuestionBank(lang, cefr, lessonNumber);
  const set = new Set(existing.map((s) => s.trim().toLowerCase()));
  for (const v of values) {
    const norm = v.trim().toLowerCase();
    if (!norm) continue;
    set.add(norm);
  }
  // cap to avoid unbounded growth
  const capped = Array.from(set).slice(-500);
  safeSet(usedKey(lang, cefr, lessonNumber), JSON.stringify(capped));
};

export const clearUsedQuestionBank = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number) => {
  safeRemove(usedKey(lang, cefr, lessonNumber));
};

export const makeGenerationId = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  qsetVersion: number
): string => {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `${lang}-${cefr}-lesson${lessonNumber}-set${qsetVersion}-${rand}`;
};
