// Client-side playback for the backend Google TTS proxy (no API key)

const timeout = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const playGoogleTTSProxy = async (text: string, lang: string): Promise<void> => {
  const trimmed = text?.trim();
  if (!trimmed) return;

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-tts`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text: trimmed, lang }),
    });

    if (!res.ok) {
      // Avoid throwing noisy errors that would break UX; just bail.
      console.warn("Google TTS proxy failed", res.status);
      return;
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

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

    // Hard timeout safety
    void timeout(15000).then(finish);

    await audio.play().catch(() => finish());
  } catch {
    // ignore
  }
};
