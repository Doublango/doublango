import { getTTSLanguageCode } from "@/lib/languageContent";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

const getVoicesAsync = (timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> => {
  const synth = window.speechSynthesis;
  const immediate = synth.getVoices();
  if (immediate.length) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    };

    const onVoicesChanged = () => finish();

    synth.addEventListener("voiceschanged", onVoicesChanged);
    window.setTimeout(() => finish(), timeoutMs);
  });
};

export const speak = async (
  text: string,
  languageCode: string,
  opts: SpeakOptions = {}
) => {
  if (!text?.trim()) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getTTSLanguageCode(languageCode);
  utterance.rate = opts.rate ?? 0.75;
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = opts.volume ?? 1.0;

  const voices = await getVoicesAsync();
  const primary = utterance.lang.split("-")[0];

  const voice =
    voices.find((v) => v.lang === utterance.lang) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(primary.toLowerCase())) ||
    voices.find((v) => v.lang?.toLowerCase().includes(primary.toLowerCase()));

  if (voice) utterance.voice = voice;

  synth.speak(utterance);
};
