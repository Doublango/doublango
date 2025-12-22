import { getTTSLanguageCode } from "@/lib/languageContent";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

let voicesLoaded = false;
let cachedVoices: SpeechSynthesisVoice[] = [];

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    
    const getVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        cachedVoices = voices;
        voicesLoaded = true;
        return voices;
      }
      return [];
    };

    // Try immediately
    const immediate = getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }

    // Wait for voiceschanged event
    const onVoicesChanged = () => {
      const voices = getVoices();
      if (voices.length > 0) {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      }
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    // Fallback timeout
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(getVoices());
    }, 2000);
  });
};

// Initialize voices on module load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

export const speak = async (
  text: string,
  languageCode: string,
  opts: SpeakOptions = {}
): Promise<void> => {
  if (!text?.trim()) return;

  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  const synth = window.speechSynthesis;
  
  // Cancel any ongoing speech
  synth.cancel();

  // Ensure voices are loaded
  const voices = voicesLoaded ? cachedVoices : await loadVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  const ttsLang = getTTSLanguageCode(languageCode);
  utterance.lang = ttsLang;
  utterance.rate = opts.rate ?? 0.75;
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = opts.volume ?? 1.0;

  // Find best matching voice
  const primary = ttsLang.split("-")[0].toLowerCase();
  
  const voice =
    voices.find((v) => v.lang.toLowerCase() === ttsLang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(primary)) ||
    voices.find((v) => v.lang.toLowerCase().includes(primary));

  if (voice) {
    utterance.voice = voice;
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      resolve(); // Don't reject to avoid breaking the flow
    };
    
    synth.speak(utterance);
  });
};

// Preload voices for a specific language
export const preloadVoices = async (languageCode: string): Promise<boolean> => {
  const voices = await loadVoices();
  const ttsLang = getTTSLanguageCode(languageCode);
  const primary = ttsLang.split("-")[0].toLowerCase();
  
  return voices.some((v) => 
    v.lang.toLowerCase().startsWith(primary) || 
    v.lang.toLowerCase().includes(primary)
  );
};
