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
  refreshVoices();

  const handler = () => refreshVoices();
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
 * Build a Google Translate TTS URL (free, no API key)
 */
const buildGoogleTTSUrl = (text: string, lang: string): string => {
  const tl = lang.split("-")[0]; // Google uses simple 2-letter codes
  const encoded = encodeURIComponent(text.slice(0, 200)); // Google limits ~200 chars
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encoded}`;
};

/**
 * Play audio via Google Translate TTS (fallback)
 */
const playGoogleTTS = (text: string, lang: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const url = buildGoogleTTSUrl(text, lang);
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      audio.onended = finish;
      audio.onerror = () => {
        console.warn("Google TTS fallback failed");
        finish();
      };

      // Timeout fallback
      setTimeout(finish, 15000);

      audio.play().catch(() => finish());
    } catch {
      resolve();
    }
  });
};

/**
 * Play using Web Speech API
 */
const playWebSpeech = (text: string, ttsLang: string, opts: SpeakOptions): Promise<boolean> => {
  const synth = getSynth();
  if (!synth) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      synth.cancel();
    } catch {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utterance.rate = opts.rate ?? 0.8;
    utterance.pitch = opts.pitch ?? 1;
    utterance.volume = opts.volume ?? 1;

    const voice = pickBestVoice(ttsLang);
    if (voice) utterance.voice = voice;

    let done = false;
    let started = false;

    const finish = (success: boolean) => {
      if (done) return;
      done = true;
      resolve(success);
    };

    utterance.onstart = () => {
      started = true;
    };

    utterance.onend = () => finish(true);
    utterance.onerror = (e) => {
      // "interrupted" is normal when canceling
      if (e.error === "interrupted" || e.error === "canceled") {
        finish(true);
      } else {
        console.warn("Web Speech error:", e.error);
        finish(false);
      }
    };

    try {
      synth.speak(utterance);

      // Chrome fix: resume if paused
      try {
        if ((synth as any).paused) (synth as any).resume?.();
      } catch {
        // ignore
      }

      // Check if speech actually started after 300ms
      setTimeout(() => {
        if (!done && !started && !(synth as any).speaking) {
          // Speech didn't start - fail so we can try fallback
          finish(false);
        }
      }, 300);

      // Hard timeout
      setTimeout(() => finish(started), 12000);
    } catch {
      finish(false);
    }
  });
};

/**
 * Main speak function - tries Web Speech API first, then Google Translate TTS fallback
 */
export const speak = async (
  text: string,
  languageCode: string,
  opts: SpeakOptions = {}
): Promise<void> => {
  const trimmed = text?.trim();
  if (!trimmed) return;

  ensureVoiceListeners();
  const ttsLang = getTTSLanguageCode(languageCode);

  // Try Web Speech API first
  const webSpeechWorked = await playWebSpeech(trimmed, ttsLang, opts);
  
  if (!webSpeechWorked) {
    // Fallback to Google Translate TTS
    console.log("TTS: Using Google Translate fallback");
    await playGoogleTTS(trimmed, ttsLang);
  }
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

export const isTTSSupported = () => true; // Always true now with Google fallback
