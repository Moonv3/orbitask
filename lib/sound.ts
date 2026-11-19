let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  try {
    context ??= new AudioContext();
    return context;
  } catch {
    return null;
  }
};

/**
 * A tiny two-note chime, generated with oscillators so no audio file is
 * needed. Only called after an explicit user action (completing a task).
 */
export function playCompletionChime(): void {
  const audio = getContext();
  if (!audio) return;

  if (audio.state === "suspended") {
    void audio.resume();
  }

  const start = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
  master.connect(audio.destination);

  [659.25, 987.77].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const at = start + index * 0.11;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.9, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + 0.6);
  });
}
