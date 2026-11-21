// Tiny WebAudio sound effects — all synthesized, no audio files.
// AudioContext is created lazily on the first user gesture (browser policy).
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq, dur, type, gain) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export const sfx = {
  unlock() {
    ac();
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  step() {
    blip(180, 0.05, 'sine', 0.03);
  },
  pickup() {
    blip(880, 0.12, 'sine', 0.12);
    setTimeout(() => blip(1320, 0.14, 'sine', 0.1), 70);
  },
  pebble() {
    blip(1400, 0.05, 'square', 0.05);
    setTimeout(() => blip(900, 0.06, 'square', 0.04), 90);
  },
  suspicious() {
    blip(520, 0.18, 'triangle', 0.12);
  },
  spotted() {
    blip(220, 0.3, 'sawtooth', 0.14);
    setTimeout(() => blip(180, 0.35, 'sawtooth', 0.14), 120);
  },
  caught() {
    blip(160, 0.5, 'sawtooth', 0.16);
    setTimeout(() => blip(110, 0.6, 'sawtooth', 0.16), 160);
    setTimeout(() => blip(55, 0.25, 'sine', 0.2), 40); // low thud as the guards grab you
  },
  wingClear() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.12), i * 110));
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sine', 0.12), i * 130));
  },
};
