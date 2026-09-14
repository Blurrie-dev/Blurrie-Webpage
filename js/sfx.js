// UI sound effects synthesised with Web Audio, so no audio files are needed.
// Muted by default; toggled from the tray or Settings.

import { store } from './store.js';

// name -> sequence of [frequencyHz, durationSec]
const SOUNDS = {
  startup: [[523, .11], [659, .11], [784, .11], [1047, .28]],
  open:    [[880, .05]],
  close:   [[440, .06]],
  click:   [[1400, .02]],
  error:   [[220, .14], [160, .18]],
  toast:   [[988, .06], [1319, .09]],
  shutdown:[[784, .12], [523, .12], [392, .3]],
};

let ctx = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function beep(ac, freq, dur, at) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.08, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export const sfx = {
  enabled: () => store.get('sound', false),
  setEnabled(on) { store.set('sound', !!on); },
  play(name) {
    if (!sfx.enabled() || !SOUNDS[name]) return;
    try {
      const ac = audio();
      let t = ac.currentTime;
      for (const [f, d] of SOUNDS[name]) { beep(ac, f, d, t); t += d; }
    } catch { /* audio unavailable */ }
  },
};
