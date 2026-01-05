// Client-side playback for the backend Google TTS proxy (no API key)

const timeout = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeAbortController: AbortController | null = null;
let activeFinish: (() => void) | null = null;

const cleanupActive = () => {
  if (activeAudio) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.onpause = null;
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  if (activeObjectUrl) {
    try {
      URL.revokeObjectURL(activeObjectUrl);
    } catch {
      // ignore
    }
  }
  activeAudio = null;
  activeObjectUrl = null;
  activeAbortController = null;
  activeFinish = null;
};

export const stopGoogleTTSProxy = () => {
  // Cancel pending fetch
  try {
    activeAbortController?.abort();
  } catch {
    // ignore
  }

  // Stop current audio
  try {
    activeAudio?.pause();
    if (activeAudio) activeAudio.currentTime = 0;
  } catch {
    // ignore
  }

  // Resolve any awaiting promise
  try {
    activeFinish?.();
  } catch {
    // ignore
  }

  cleanupActive();
};

export const playGoogleTTSProxy = async (
  text: string,
  lang: string,
  playbackRate?: number
): Promise<void> => {
  const trimmed = text?.trim();
  if (!trimmed) return;

  // Ensure we never overlap proxy audio (fixes overlapping words in slow mode)
  stopGoogleTTSProxy();

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-tts`;

    const controller = new AbortController();
    activeAbortController = controller;

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
      cleanupActive();
      return;
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    activeAudio = audio;
    activeObjectUrl = audioUrl;

    audio.preload = "auto";
    audio.load();

    if (typeof playbackRate === "number" && Number.isFinite(playbackRate)) {
      audio.playbackRate = clamp(playbackRate, 0.5, 1.25);
    }

    let done = false;
    const endedPromise = new Promise<void>((resolve) => {
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      activeFinish = finish;

      audio.onended = finish;
      audio.onerror = () => {
        console.warn("Google TTS proxy audio playback failed");
        finish();
      };

      // Hard timeout safety (longer so slow networks still play)
      void timeout(30000).then(finish);
    });

    // Start playback, then wait for actual end (audio.play() resolves on start only)
    await audio.play().catch(() => {
      try {
        activeFinish?.();
      } catch {
        // ignore
      }
    });

    await endedPromise;
  } catch {
    // ignore
  } finally {
    cleanupActive();
  }
};

