// Game Sound Effects using Web Audio API
// No external dependencies - pure browser audio

type SoundType = 
  | 'correct'
  | 'incorrect'
  | 'match'
  | 'streak'
  | 'gameStart'
  | 'gameComplete'
  | 'levelUp'
  | 'tick'
  | 'pop'
  | 'whoosh'
  | 'coin'
  | 'bell'
  | 'chime'
  | 'bounce'
  | 'click';

let audioContext: AudioContext | null = null;
let soundsEnabled = true;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const setSoundsEnabled = (enabled: boolean) => {
  soundsEnabled = enabled;
  localStorage.setItem('game_sounds_enabled', String(enabled));
};

export const getSoundsEnabled = (): boolean => {
  const saved = localStorage.getItem('game_sounds_enabled');
  return saved === null ? true : saved === 'true';
};

// Initialize from localStorage
soundsEnabled = getSoundsEnabled();

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  attack: number = 0.01,
  decay: number = 0.1
) => {
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

const playNotes = (notes: Array<{ freq: number; delay: number; duration: number; type?: OscillatorType }>, volume = 0.25) => {
  if (!soundsEnabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    notes.forEach(({ freq, delay, duration, type = 'sine' }) => {
      setTimeout(() => playTone(freq, duration, type, volume), delay * 1000);
    });
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

export const playSound = (sound: SoundType) => {
  if (!soundsEnabled) return;

  switch (sound) {
    case 'correct':
      // Happy ascending chime
      playNotes([
        { freq: 523, delay: 0, duration: 0.15 },     // C5
        { freq: 659, delay: 0.08, duration: 0.15 },  // E5
        { freq: 784, delay: 0.16, duration: 0.25 },  // G5
      ], 0.3);
      break;

    case 'incorrect':
      // Descending buzz
      playNotes([
        { freq: 300, delay: 0, duration: 0.15, type: 'sawtooth' },
        { freq: 200, delay: 0.1, duration: 0.2, type: 'sawtooth' },
      ], 0.2);
      break;

    case 'match':
      // Quick pop sound
      playTone(880, 0.08, 'sine', 0.35, 0.005, 0.02);
      setTimeout(() => playTone(1100, 0.1, 'sine', 0.25), 50);
      break;

    case 'streak':
      // Exciting ascending fanfare
      playNotes([
        { freq: 523, delay: 0, duration: 0.1 },
        { freq: 659, delay: 0.06, duration: 0.1 },
        { freq: 784, delay: 0.12, duration: 0.1 },
        { freq: 1047, delay: 0.18, duration: 0.3 },
      ], 0.35);
      break;

    case 'gameStart':
      // Ready set go!
      playNotes([
        { freq: 440, delay: 0, duration: 0.15 },
        { freq: 440, delay: 0.2, duration: 0.15 },
        { freq: 587, delay: 0.4, duration: 0.3 },
      ], 0.3);
      break;

    case 'gameComplete':
      // Victory fanfare
      playNotes([
        { freq: 523, delay: 0, duration: 0.2 },
        { freq: 659, delay: 0.15, duration: 0.2 },
        { freq: 784, delay: 0.3, duration: 0.2 },
        { freq: 1047, delay: 0.45, duration: 0.4 },
        { freq: 1175, delay: 0.65, duration: 0.15 },
        { freq: 1319, delay: 0.8, duration: 0.5 },
      ], 0.35);
      break;

    case 'levelUp':
      // Epic level up
      playNotes([
        { freq: 440, delay: 0, duration: 0.1 },
        { freq: 554, delay: 0.08, duration: 0.1 },
        { freq: 659, delay: 0.16, duration: 0.1 },
        { freq: 880, delay: 0.24, duration: 0.4 },
      ], 0.35);
      break;

    case 'tick':
      // Clock tick
      playTone(1200, 0.03, 'sine', 0.15, 0.001, 0.01);
      break;

    case 'pop':
      // Bubble pop
      playTone(600, 0.05, 'sine', 0.25, 0.005, 0.02);
      break;

    case 'whoosh':
      // Swoosh sound
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      const noise = ctx.createOscillator();
      const gain = ctx.createGain();
      noise.type = 'triangle';
      noise.frequency.setValueAtTime(800, ctx.currentTime);
      noise.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.15);
      break;

    case 'coin':
      // Coin collect sound
      playNotes([
        { freq: 988, delay: 0, duration: 0.08 },
        { freq: 1319, delay: 0.06, duration: 0.15 },
      ], 0.3);
      break;

    case 'bell':
      // Bell chime
      playTone(1047, 0.4, 'sine', 0.3, 0.01, 0.15);
      break;

    case 'chime':
      // Soft chime
      playNotes([
        { freq: 784, delay: 0, duration: 0.2 },
        { freq: 988, delay: 0.1, duration: 0.25 },
      ], 0.2);
      break;

    case 'bounce':
      // Bouncy sound for kids
      playNotes([
        { freq: 400, delay: 0, duration: 0.08 },
        { freq: 600, delay: 0.06, duration: 0.1 },
        { freq: 500, delay: 0.12, duration: 0.08 },
      ], 0.25);
      break;

    case 'click':
      // UI click
      playTone(800, 0.03, 'sine', 0.15, 0.001, 0.01);
      break;
  }
};

// Kids mode sounds - more playful and bouncy
export const playKidsSound = (sound: SoundType) => {
  if (!soundsEnabled) return;

  switch (sound) {
    case 'correct':
      // Super happy bounce
      playNotes([
        { freq: 600, delay: 0, duration: 0.12 },
        { freq: 800, delay: 0.08, duration: 0.12 },
        { freq: 1000, delay: 0.16, duration: 0.12 },
        { freq: 1200, delay: 0.24, duration: 0.2 },
      ], 0.35);
      break;

    case 'incorrect':
      // Gentle boing
      playNotes([
        { freq: 400, delay: 0, duration: 0.15 },
        { freq: 300, delay: 0.08, duration: 0.2 },
      ], 0.2);
      break;

    case 'match':
      // Pop with sparkle
      playNotes([
        { freq: 800, delay: 0, duration: 0.08 },
        { freq: 1200, delay: 0.05, duration: 0.1 },
        { freq: 1600, delay: 0.1, duration: 0.08 },
      ], 0.3);
      break;

    case 'gameComplete':
      // Super exciting celebration
      playNotes([
        { freq: 523, delay: 0, duration: 0.15 },
        { freq: 659, delay: 0.1, duration: 0.15 },
        { freq: 784, delay: 0.2, duration: 0.15 },
        { freq: 880, delay: 0.3, duration: 0.15 },
        { freq: 1047, delay: 0.4, duration: 0.15 },
        { freq: 1319, delay: 0.5, duration: 0.3 },
      ], 0.4);
      break;

    default:
      playSound(sound);
  }
};
