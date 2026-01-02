import type { Database } from "@/integrations/supabase/types";
import type { CEFRLevel } from "@/lib/content/aiLesson";

type LanguageCode = Database["public"]["Enums"]["language_code"];
type ModeKey = "adult" | "kids";

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

const modePart = (mode?: ModeKey) => (mode === "kids" ? "kids" : "adult");

const qsetKey = (lang: LanguageCode, cefr: CEFRLevel, mode?: ModeKey) =>
  `${QSET_PREFIX}:${modePart(mode)}:${lang}:${cefr}`;

const qsetLessonKey = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number, mode?: ModeKey) =>
  `${QSET_PREFIX}:${modePart(mode)}:${lang}:${cefr}:lesson:${lessonNumber}`;

const usedKey = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number, mode?: ModeKey) =>
  `${USED_PREFIX}:${modePart(mode)}:${lang}:${cefr}:lesson:${lessonNumber}`;

export const getQuestionSetVersion = (lang: LanguageCode, cefr: CEFRLevel, mode?: ModeKey): number => {
  const raw = safeGet(qsetKey(lang, cefr, mode));
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

export const bumpQuestionSetVersion = (lang: LanguageCode, cefr: CEFRLevel, mode?: ModeKey): number => {
  const next = getQuestionSetVersion(lang, cefr, mode) + 1;
  safeSet(qsetKey(lang, cefr, mode), String(next));
  return next;
};

export const getLessonQuestionSetVersion = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  mode?: ModeKey
): number => {
  const raw = safeGet(qsetLessonKey(lang, cefr, lessonNumber, mode));
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

export const bumpLessonQuestionSetVersion = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  mode?: ModeKey
): number => {
  const next = getLessonQuestionSetVersion(lang, cefr, lessonNumber, mode) + 1;
  safeSet(qsetLessonKey(lang, cefr, lessonNumber, mode), String(next));
  return next;
};

export const getUsedQuestionBank = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  mode?: ModeKey
): string[] => {
  const raw = safeGet(usedKey(lang, cefr, lessonNumber, mode));
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
  values: string[],
  mode?: ModeKey
) => {
  const existing = getUsedQuestionBank(lang, cefr, lessonNumber, mode);
  const set = new Set(existing.map((s) => s.trim().toLowerCase()));
  for (const v of values) {
    const norm = v.trim().toLowerCase();
    if (!norm) continue;
    set.add(norm);
  }
  // cap to avoid unbounded growth
  const capped = Array.from(set).slice(-500);
  safeSet(usedKey(lang, cefr, lessonNumber, mode), JSON.stringify(capped));
};

export const clearUsedQuestionBank = (lang: LanguageCode, cefr: CEFRLevel, lessonNumber: number, mode?: ModeKey) => {
  safeRemove(usedKey(lang, cefr, lessonNumber, mode));
};

export const makeGenerationId = (
  lang: LanguageCode,
  cefr: CEFRLevel,
  lessonNumber: number,
  qsetVersion: number,
  mode?: ModeKey
): string => {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `${modePart(mode)}-${lang}-${cefr}-lesson${lessonNumber}-set${qsetVersion}-${rand}`;
};
