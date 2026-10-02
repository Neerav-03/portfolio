import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { readStore, STORE_KEYS, writeStore } from '../lib/storage';
import './boot.css';

const STEPS = ['identity', 'education', 'experience', 'projects', 'engineering graph'];
const PAD = 28;

export function Boot({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  // Returning visitors get a compressed boot.
  const returning = useRef(readStore(STORE_KEYS.booted) === '1').current;
  const tick = reduced ? 0 : returning ? 55 : 150;
  const [shown, setShown] = useState(reduced ? STEPS.length + 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    writeStore(STORE_KEYS.booted, '1');
    setLeaving(true);
    window.setTimeout(onDone, reduced ? 0 : 260);
  }, [onDone, reduced]);

  useEffect(() => {
    if (shown > STEPS.length) {
      const t = window.setTimeout(finish, reduced ? 250 : returning ? 220 : 480);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? tick * 2 : tick);
    return () => window.clearTimeout(t);
  }, [shown, tick, finish, reduced, returning]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const online = shown > STEPS.length;
  const progress = Math.min(1, shown / (STEPS.length + 1));

  return (
    <div className={`boot${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite" aria-label="NEERAV OS is starting">
      <div className="boot__term mono">
        <p className="boot__title">
          NEERAV OS <span className="boot__ver">v1.0</span>
        </p>
        <p className="boot__dim">Initializing system...</p>
        <ul className="boot__lines">
          {STEPS.slice(0, shown).map((s) => (
            <li key={s}>
              <span>{`Loading ${s}`.padEnd(PAD, '.')}</span>
              <span className="boot__ok">OK</span>
            </li>
          ))}
        </ul>
        <p className={`boot__online${online ? ' is-on' : ''}`}>
          <span className="dot dot--ok" /> SYSTEM ONLINE
        </p>
        <div className="boot__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <button className="boot__skip mono" onClick={finish}>
        Skip <span className="kbd">Esc</span>
      </button>
    </div>
  );
}
