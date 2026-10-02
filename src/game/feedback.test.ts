import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFeedback, CUES, HAPTICS, soundPreference } from './feedback';

/** Minimal Web Audio fake that records oscillators. */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};
  oscillators: { type: string; freq: number; started: number }[] = [];
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createOscillator() {
    const rec = { type: '', freq: 0, started: -1 };
    this.oscillators.push(rec);
    return {
      set type(t: string) {
        rec.type = t;
      },
      frequency: {
        setValueAtTime: (f: number) => {
          rec.freq = f;
        },
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: (node: unknown) => node,
      start: (t: number) => {
        rec.started = t;
      },
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (node: unknown) => node,
    };
  }
  resume = vi.fn(() => Promise.resolve());
  suspend = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

describe('game feedback (sound + haptics)', () => {
  const vibrate = vi.fn();

  beforeEach(() => {
    FakeAudioContext.instances = [];
    vi.stubGlobal('AudioContext', FakeAudioContext);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    vibrate.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is on by default and remembers being turned off', () => {
    expect(soundPreference()).toBe(true);
    const fx = createFeedback();
    fx.setEnabled(false);
    expect(localStorage.getItem('neeravos.sound')).toBe('off');
    expect(soundPreference()).toBe(false);
    expect(createFeedback().enabled).toBe(false);
  });

  it('plays every note of a cue and vibrates with its pattern', () => {
    const fx = createFeedback();
    fx.unlock();
    fx.cue('fact');
    const ac = FakeAudioContext.instances[0];
    expect(ac.oscillators).toHaveLength(CUES.fact.length);
    expect(ac.oscillators.map((o) => o.freq)).toEqual(CUES.fact.map((n) => n.f));
    expect(vibrate).toHaveBeenCalledWith(HAPTICS.fact);
  });

  it('cues without a haptic pattern only make sound', () => {
    const fx = createFeedback();
    fx.cue('jump');
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(1);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('muted: no sound, no vibration, audio suspended', () => {
    const fx = createFeedback();
    fx.unlock();
    fx.setEnabled(false);
    fx.cue('win');
    const ac = FakeAudioContext.instances[0];
    expect(ac.oscillators).toHaveLength(0);
    expect(ac.suspend).toHaveBeenCalled();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('does nothing (and never throws) without Web Audio or vibration support', () => {
    vi.stubGlobal('AudioContext', undefined);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
    const fx = createFeedback();
    expect(() => {
      fx.unlock();
      fx.cue('stomp');
      fx.dispose();
    }).not.toThrow();
  });

  it('every cue is a short, valid sequence', () => {
    for (const [name, notes] of Object.entries(CUES)) {
      expect(notes.length, name).toBeGreaterThan(0);
      for (const n of notes) {
        expect(n.f).toBeGreaterThan(20);
        expect((n.at ?? 0) + n.d, name).toBeLessThanOrEqual(1);
      }
    }
  });
});
