import { getTTSLanguageCode } from "@/lib/languageContent";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

let voicesLoaded = false;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (voiceLoadPromise) return voiceLoadPromise;
  
  voiceLoadPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

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
    let resolved = false;
    const onVoicesChanged = () => {
      if (resolved) return;
      const voices = getVoices();
      if (voices.length > 0) {
        resolved = true;
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      }
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    // Fallback timeout - try multiple times
    let attempts = 0;
    const tryLoad = () => {
      if (resolved) return;
      attempts++;
      const voices = getVoices();
      if (voices.length > 0) {
        resolved = true;
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      } else if (attempts < 10) {
        setTimeout(tryLoad, 200);
      } else {
        resolved = true;
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve([]);
      }
    };
    
    setTimeout(tryLoad, 100);
  });
  
  return voiceLoadPromise;
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
  if (!text?.trim()) {
    console.warn('TTS: No text provided');
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  const synth = window.speechSynthesis;
  
  // Cancel any ongoing speech first
  synth.cancel();
  
  // Small delay after cancel to ensure it's cleared
  await new Promise(resolve => setTimeout(resolve, 50));

  // Ensure voices are loaded
  const voices = await loadVoices();
  
  if (voices.length === 0) {
    console.warn('TTS: No voices available');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const ttsLang = getTTSLanguageCode(languageCode);
  
  utterance.lang = ttsLang;
  utterance.rate = opts.rate ?? 0.75;
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = opts.volume ?? 1.0;

  // Find best matching voice
  const primary = ttsLang.split("-")[0].toLowerCase();
  
  // Priority order: exact match, then starts with primary, then contains primary
  const voice =
    voices.find((v) => v.lang.toLowerCase() === ttsLang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(primary + "-")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(primary)) ||
    voices.find((v) => v.lang.toLowerCase().includes(primary));

  if (voice) {
    utterance.voice = voice;
    console.log(`TTS: Using voice "${voice.name}" for language "${ttsLang}"`);
  } else {
    console.warn(`TTS: No voice found for "${ttsLang}", using default`);
  }

  return new Promise((resolve) => {
    let completed = false;
    
    const complete = () => {
      if (completed) return;
      completed = true;
      resolve();
    };
    
    utterance.onend = complete;
    utterance.onerror = (event) => {
      // Only log if it's not an interrupted error (which happens when we cancel)
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Speech synthesis error:', event.error);
      }
      complete();
    };
    
    // Timeout fallback
    const timeout = setTimeout(() => {
      console.warn('TTS: Speech timeout, completing');
      complete();
    }, 10000);
    
    utterance.onend = () => {
      clearTimeout(timeout);
      complete();
    };
    
    try {
      synth.speak(utterance);
      
      // Chrome bug workaround: resume if paused
      if (synth.paused) {
        synth.resume();
      }
      
      // Another Chrome bug: sometimes speech doesn't start
      // Check after a brief delay and retry if needed
      setTimeout(() => {
        if (!synth.speaking && !completed) {
          console.log('TTS: Retrying speech...');
          synth.cancel();
          setTimeout(() => {
            try {
              synth.speak(utterance);
            } catch (e) {
              console.error('TTS retry failed:', e);
              complete();
            }
          }, 50);
        }
      }, 250);
    } catch (e) {
      console.error('TTS speak error:', e);
      complete();
    }
  });
};

// Cancel any ongoing speech
export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Preload voices for a specific language
export const preloadVoices = async (languageCode: string): Promise<boolean> => {
  const voices = await loadVoices();
  const ttsLang = getTTSLanguageCode(languageCode);
  const primary = ttsLang.split("-")[0].toLowerCase();
  
  const hasVoice = voices.some((v) => 
    v.lang.toLowerCase().startsWith(primary) || 
    v.lang.toLowerCase().includes(primary)
  );
  
  if (hasVoice) {
    console.log(`TTS: Voice available for ${languageCode}`);
  } else {
    console.warn(`TTS: No voice found for ${languageCode}`);
  }
  
  return hasVoice;
};

// Get available voices for debugging
export const getAvailableVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  return loadVoices();
};