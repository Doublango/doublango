// Client-side playback for the backend Google TTS proxy (no API key)

const timeout = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const playGoogleTTSProxy = async (
  text: string,
  lang: string,
  playbackRate?: number
): Promise<void> => {
  const trimmed = text?.trim();
  if (!trimmed) return;

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-tts`;

    const controller = new AbortController();
    const abortId = window.setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text: trimmed, lang }),
    }).finally(() => window.clearTimeout(abortId));

    if (!res.ok) {
      // Avoid throwing noisy errors that would break UX; just bail.
      console.warn("Google TTS proxy failed", res.status);
      return;
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audio.load();

    // True slow mode: adjust playback speed instead of word-by-word pauses.
    if (typeof playbackRate === 'number' && Number.isFinite(playbackRate)) {
      audio.playbackRate = clamp(playbackRate, 0.5, 1.25);
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(audioUrl);
    };

    audio.onended = finish;
    audio.onerror = () => {
      console.warn("Google TTS proxy audio playback failed");
      finish();
    };

    // Hard timeout safety (longer so slow networks still play)
    void timeout(30000).then(finish);

    await audio.play().catch(() => finish());
  } catch {
    // ignore
  }
};

