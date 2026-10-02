/**
 * Neerav Quest sound effects and haptics. Sounds are synthesised with Web Audio
 * (no audio files to download); haptics use the Vibration API where it exists
 * (Android browsers). One preference, stored locally, turns both on or off.
 */
import { readStore, STORE_KEYS, writeStore } from '../lib/storage';

export type Cue = 'start' | 'jump' | 'fact' | 'commit' | 'stomp' | 'hurt' | 'fall' | 'win';

interface Note {
  /** Start frequency (Hz) and optional glide target. */
  f: number;
  to?: number;
  /** Duration and start offset (s). */
  d: number;
  at?: number;
  type?: OscillatorType;
  /** Peak gain before the master volume. */
  v?: number;
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const CUES: Record<Cue, Note[]> = {
  start: [
    { f: 392, d: 0.07, type: 'square' },
    { f: C5, d: 0.12, at: 0.08, type: 'square' },
  ],
  jump: [{ f: 300, to: 620, d: 0.12, type: 'square', v: 0.05 }],
  fact: [
    { f: C5, d: 0.08, type: 'square' },
    { f: G5, d: 0.08, at: 0.08, type: 'square' },
    { f: C6, d: 0.16, at: 0.16, type: 'square' },
  ],
  commit: [
    { f: 1319, d: 0.05, type: 'square', v: 0.035 },
    { f: 1760, d: 0.08, at: 0.05, type: 'square', v: 0.035 },
  ],
  stomp: [{ f: 240, to: 70, d: 0.14, type: 'triangle', v: 0.14 }],
  hurt: [{ f: 440, to: 110, d: 0.32, type: 'sawtooth', v: 0.05 }],
  fall: [{ f: 620, to: 90, d: 0.55, type: 'triangle', v: 0.09 }],
  win: [
    { f: C5, d: 0.1, type: 'square' },
    { f: E5, d: 0.1, at: 0.11, type: 'square' },
    { f: G5, d: 0.1, at: 0.22, type: 'square' },
    { f: C6, d: 0.45, at: 0.33, type: 'square' },
    { f: G5, d: 0.45, at: 0.33, type: 'triangle', v: 0.05 },
  ],
};

/** Vibration patterns (ms). Frequent cues stay short so phones don't buzz constantly. */
export const HAPTICS: Partial<Record<Cue, number | number[]>> = {
  fact: 22,
  commit: 6,
  stomp: 28,
  hurt: [40, 40, 40],
  fall: 70,
  win: [30, 60, 30, 60, 120],
};

const MASTER = 0.7;
const DEFAULT_GAIN = 0.07;

export interface Feedback {
  readonly enabled: boolean;
  setEnabled(on: boolean): void;
  /** Call from a user gesture (e.g. Play) so the browser allows audio. */
  unlock(): void;
  cue(name: Cue): void;
  dispose(): void;
}

export function soundPreference(): boolean {
  return readStore(STORE_KEYS.sound) !== 'off';
}

type AudioContextCtor = typeof AudioContext;

export function createFeedback(): Feedback {
  let ctx: AudioContext | null = null;
  let enabled = soundPreference();

  const audio = (): AudioContext | null => {
    if (!ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    return ctx;
  };

  const play = (notes: Note[]) => {
    const ac = audio();
    if (!ac) return;
    const now = ac.currentTime;
    for (const n of notes) {
      const t0 = now + (n.at ?? 0);
      const t1 = t0 + n.d;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = n.type ?? 'square';
      osc.frequency.setValueAtTime(n.f, t0);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t1);
      // Short attack, exponential decay: no clicks.
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime((n.v ?? DEFAULT_GAIN) * MASTER, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  };

  const vibrate = (pattern: number | number[] | undefined) => {
    if (pattern === undefined || typeof navigator.vibrate !== 'function') return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* not allowed (no user activation yet) */
    }
  };

  return {
    get enabled() {
      return enabled;
    },
    setEnabled(on) {
      enabled = on;
      writeStore(STORE_KEYS.sound, on ? 'on' : 'off');
      if (!on) void ctx?.suspend().catch(() => undefined);
      else audio();
    },
    unlock() {
      if (enabled) audio();
    },
    cue(name) {
      if (!enabled) return;
      play(CUES[name]);
      vibrate(HAPTICS[name]);
    },
    dispose() {
      void ctx?.close().catch(() => undefined);
      ctx = null;
    },
  };
}
