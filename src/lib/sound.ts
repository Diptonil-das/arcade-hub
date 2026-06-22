export const SOUND_PREFERENCE_STORAGE_KEY = "arcade-hub:sound-enabled";

export type SoundEffect =
  | "collect"
  | "game-over"
  | "move"
  | "win"
  | "loss"
  | "draw"
  | "milestone";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  audioContext ??= new AudioContextConstructor();

  return audioContext;
}

export function readSoundPreference() {
  try {
    const storedPreference = window.localStorage.getItem(
      SOUND_PREFERENCE_STORAGE_KEY,
    );

    return storedPreference === null ? true : storedPreference === "true";
  } catch {
    return true;
  }
}

export function saveSoundPreference(isEnabled: boolean) {
  try {
    window.localStorage.setItem(
      SOUND_PREFERENCE_STORAGE_KEY,
      String(isEnabled),
    );
  } catch {
    // Sound preference persistence should never interrupt gameplay.
  }
}

export function unlockAudio() {
  const context = getAudioContext();

  if (!context || context.state !== "suspended") {
    return;
  }

  void context.resume().catch(() => {});
}

export function playSound(effect: SoundEffect, isEnabled: boolean) {
  if (!isEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume().catch(() => {});
  }

  const now = context.currentTime;
  const gain = context.createGain();

  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);

  const playTone = (
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType = "square",
  ) => {
    const oscillator = context.createOscillator();
    const toneGain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now + start);
    oscillator.connect(toneGain);
    toneGain.connect(gain);
    toneGain.gain.setValueAtTime(0.0001, now + start);
    toneGain.gain.exponentialRampToValueAtTime(volume, now + start + 0.012);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    oscillator.start(now + start);
    oscillator.stop(now + start + duration + 0.02);
  };

  if (effect === "collect") {
    gain.gain.setValueAtTime(0.18, now);
    playTone(660, 0, 0.07, 0.32);
    playTone(990, 0.055, 0.08, 0.24);
    return;
  }

  if (effect === "move") {
    gain.gain.setValueAtTime(0.12, now);
    playTone(440, 0, 0.055, 0.22, "triangle");
    return;
  }

  if (effect === "win") {
    gain.gain.setValueAtTime(0.16, now);
    playTone(523, 0, 0.08, 0.24, "triangle");
    playTone(659, 0.08, 0.08, 0.22, "triangle");
    playTone(784, 0.16, 0.12, 0.2, "triangle");
    return;
  }

  if (effect === "draw") {
    gain.gain.setValueAtTime(0.13, now);
    playTone(392, 0, 0.08, 0.2, "sine");
    playTone(392, 0.1, 0.08, 0.18, "sine");
    return;
  }

  if (effect === "milestone") {
    gain.gain.setValueAtTime(0.1, now);
    playTone(740, 0, 0.045, 0.18, "triangle");
    playTone(932, 0.045, 0.055, 0.16, "triangle");
    return;
  }

  gain.gain.setValueAtTime(effect === "loss" ? 0.18 : 0.22, now);
  playTone(effect === "loss" ? 220 : 170, 0, 0.1, 0.32, "sawtooth");
  playTone(effect === "loss" ? 155 : 92, 0.08, 0.18, 0.28, "sawtooth");
}
