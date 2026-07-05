import { soundEnabled } from './state.js';
import { get } from 'svelte/store';

let audioCtx = null;

/**
 * Lazy initialize and resume the AudioContext.
 * Returns null if not in a browser environment.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

/**
 * Play synthesized sound effects using the Web Audio API oscillators.
 * @param {'correct' | 'error' | 'win' | 'click' | 'typewriter' | 'combo' | 'combo-break' | 'combo-milestone' | 'level-up' | 'achievement' | 'streak' | 'xp' | 'welcome' | 'daily-challenge'} type 
 */
export function playSound(type) {
  // Check if sound is globally enabled
  if (!get(soundEnabled)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;

  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.055);

  } else if (type === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.11);

  } else if (type === 'win') {
    const freqs = [500, 600, 700, 800];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.1, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.1);

      o.start(t + i * 0.08);
      o.stop(t + i * 0.08 + 0.11);
    });
  } else if (type === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.start(t);
    osc.stop(t + 0.035);
  } else if (type === 'typewriter') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.02);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.start(t);
    osc.stop(t + 0.025);

  } else if (type === 'combo') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.1);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    osc.stop(t + 0.13);

  } else if (type === 'combo-break') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.19);

  } else if (type === 'combo-milestone') {
    const freqs = [523, 659, 784];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.12, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.08);

      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.09);
    });

  } else if (type === 'level-up') {
    const freqs = [262, 330, 392, 523, 659, 784];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.1, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);

      o.start(t + i * 0.1);
      o.stop(t + i * 0.1 + 0.13);

      // Shimmer oscillator one octave up
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();

      o2.connect(g2);
      g2.connect(ctx.destination);

      o2.type = 'sine';
      o2.frequency.value = freq * 2;

      g2.gain.setValueAtTime(0.05, t + i * 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);

      o2.start(t + i * 0.1);
      o2.stop(t + i * 0.1 + 0.13);
    });

  } else if (type === 'achievement') {
    const freqs = [880, 660, 1046];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.001, t + i * 0.1);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.1 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);

      o.start(t + i * 0.1);
      o.stop(t + i * 0.1 + 0.16);
    });

  } else if (type === 'streak') {
    // Rapid drum-roll pulses
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);

    gain.gain.setValueAtTime(0.001, t);
    for (let i = 0; i < 8; i++) {
      const pulseStart = t + i * 0.0375;
      gain.gain.linearRampToValueAtTime(0.08, pulseStart);
      gain.gain.linearRampToValueAtTime(0.001, pulseStart + 0.02);
    }

    osc.start(t);
    osc.stop(t + 0.31);

    // Final sustain note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, t + 0.3);

    gain2.gain.setValueAtTime(0.1, t + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc2.start(t + 0.3);
    osc2.stop(t + 0.46);

  } else if (type === 'xp') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.055);

  } else if (type === 'welcome') {
    const freqs = [262, 330, 392];
    freqs.forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.05);
      g.gain.setValueAtTime(0.08, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      o.start(t);
      o.stop(t + 0.56);
    });

  } else if (type === 'daily-challenge') {
    const freqs = [600, 900];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = 'sine';
      o.frequency.value = freq;

      g.gain.setValueAtTime(0.1, t + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.07);

      o.start(t + i * 0.05);
      o.stop(t + i * 0.05 + 0.08);
    });
  }
}
