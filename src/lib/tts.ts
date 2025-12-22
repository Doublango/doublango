import { getTTSLanguageCode } from "@/lib/languageContent";

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

const getSynth = () => {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
};

let cachedVoices: SpeechSynthesisVoice[] = [];
let listenersInstalled = false;

const refreshVoices = (): SpeechSynthesisVoice[] => {
  const synth = getSynth();
  if (!synth) return [];
  const voices = synth.getVoices?.() ?? [];
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
};

const ensureVoiceListeners = () => {
  const synth = getSynth();
  if (!synth || listenersInstalled) return;
  listenersInstalled = true;

  // Prime immediately
  refreshVoices();

  const handler = () => {
    refreshVoices();
  };

  // Some browsers support addEventListener, others only onvoiceschanged
  try {
    if (typeof (synth as any).addEventListener === "function") {
      (synth as any).addEventListener("voiceschanged", handler);
    } else {
      (synth as any).onvoiceschanged = handler;
    }
  } catch {
    // ignore
  }
};

const pickBestVoice = (ttsLang: string): SpeechSynthesisVoice | undefined => {
  const voices = refreshVoices();
  if (!voices.length) return undefined;

  const wanted = ttsLang.toLowerCase();
  const primary = wanted.split("-")[0];

  return (
    voices.find((v) => v.lang.toLowerCase() === wanted) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(primary + "-")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(primary)) ||
    voices.find((v) => v.lang.toLowerCase().includes(primary))
  );
};

/**
 * IMPORTANT: Keep this function user-gesture friendly.
 * Avoid awaiting before calling synth.speak(), otherwise iOS/Safari may block audio.
 */
export const speak = (text: string, languageCode: string, opts: SpeakOptions = {}): Promise<void> => {
  const synth = getSynth();
  if (!synth) return Promise.resolve();

  const trimmed = text?.trim();
  if (!trimmed) return Promise.resolve();

  ensureVoiceListeners();

  const ttsLang = getTTSLanguageCode(languageCode);
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = ttsLang;
  utterance.rate = opts.rate ?? 0.8;
  utterance.pitch = opts.pitch ?? 1;
  utterance.volume = opts.volume ?? 1;

  const voice = pickBestVoice(ttsLang);
  if (voice) utterance.voice = voice;

  // Cancel any previous utterance
  try {
    synth.cancel();
  } catch {
    // ignore
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = () => finish();

    try {
      synth.speak(utterance);

      // Safari/Chrome occasionally starts paused
      try {
        if ((synth as any).paused) (synth as any).resume?.();
      } catch {
        // ignore
      }

      // If the browser silently blocks / fails to start, retry quickly once
      setTimeout(() => {
        try {
          if (!done && !(synth as any).speaking) {
            (synth as any).resume?.();
            synth.speak(utterance);
          }
        } catch {
          // ignore
        }
      }, 150);

      // Hard timeout safeguard
      setTimeout(() => {
        if (!done) finish();
      }, 12000);
    } catch {
      finish();
    }
  });
};

export const cancelSpeech = () => {
  const synth = getSynth();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // ignore
  }
};

export const preloadVoices = async (languageCode: string): Promise<boolean> => {
  const synth = getSynth();
  if (!synth) return false;

  ensureVoiceListeners();
  const ttsLang = getTTSLanguageCode(languageCode);
  const primary = ttsLang.split("-")[0].toLowerCase();

  const voices = refreshVoices();
  return voices.some((v) => v.lang.toLowerCase().startsWith(primary));
};

export const getAvailableVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  ensureVoiceListeners();
  return refreshVoices();
};

export const isTTSSupported = () => Boolean(getSynth());
