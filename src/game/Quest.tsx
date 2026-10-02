import { ArrowLeft, ArrowRight, ArrowUp, Eye, Mail, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { profile } from '../data/portfolio';
import { LinkedInIcon } from '../components/BrandIcons';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useOS } from '../os/useOS';
import { createWorld, step, VIEW_H, VIEW_W, type Input, type QuestEvent, type World } from './engine';
import { createFeedback, soundPreference, type Cue, type Feedback } from './feedback';
import { questFacts } from './facts';
import { consumeQuestLaunch, QUEST_EVENT } from './launch';
import { buildLevel } from './level';
import { render } from './render';
import { buildSprites, readPalette, type Palette, type Sprites } from './sprites';
import './quest.css';

type Status = 'title' | 'playing' | 'paused' | 'won';

/** Which sound / vibration plays for each game event. */
const EVENT_CUE: Record<QuestEvent['type'], Cue> = {
  jump: 'jump',
  fact: 'fact',
  commit: 'commit',
  squash: 'stomp',
  hurt: 'hurt',
  fell: 'fall',
  won: 'win',
};

const KEYS: Record<string, keyof Input> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ' ': 'jump',
  ArrowUp: 'jump',
  w: 'jump',
  W: 'jump',
};
const COMMITS_TOTAL = buildLevel().commits.length;
const noInput = (): Input => ({ left: false, right: false, jump: false });

/** Neerav Quest: a 45-second platformer whose code blocks reveal resume facts. */
export default function Quest() {
  const { previewResume, copyEmail } = useOS();
  const facts = useMemo(() => questFacts(), []);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const gfxRef = useRef<{ palette: Palette; sprites: Sprites } | null>(null);
  const inputRef = useRef<Input>(noInput());
  const statusRef = useRef<Status>('title');
  const [status, setStatusState] = useState<Status>('title');
  const [revealed, setRevealed] = useState<boolean[]>(() => facts.map(() => false));
  const [hud, setHud] = useState({ commits: 0, squashed: 0 });
  const [announcement, setAnnouncement] = useState('');
  const [result, setResult] = useState<{ seconds: number; facts: number; commits: number } | null>(null);
  // Desktop (keyboard) players get tutorial signs and a hint chip until they've moved and jumped.
  const touch = useMediaQuery('(pointer: coarse)');
  const hintsRef = useRef(true);
  const [learned, setLearned] = useState({ moved: false, jumped: false });
  // Sound + haptics: one switch, remembered between visits.
  const fxRef = useRef<Feedback | null>(null);
  const [soundOn, setSoundOn] = useState(soundPreference);

  useEffect(() => {
    const fx = createFeedback();
    fxRef.current = fx;
    return () => fx.dispose();
  }, []);

  const toggleSound = useCallback(() => {
    const fx = fxRef.current;
    const next = !(fx?.enabled ?? soundPreference());
    fx?.setEnabled(next);
    setSoundOn(next);
    if (next) fx?.cue('commit');
    // Keep playing: hand focus back to the game surface.
    if (statusRef.current === 'playing') hostRef.current?.focus({ preventScroll: true });
  }, []);

  const setStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    const gfx = gfxRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !world || !gfx || !ctx) return;
    const scale = canvas.width / VIEW_W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    render(ctx, world, gfx.sprites, gfx.palette, facts, performance.now() / 1000, { hints: hintsRef.current });
  }, [facts]);

  // Colours follow the theme: rebuild sprites whenever data-theme flips.
  useEffect(() => {
    const rebuild = () => {
      const palette = readPalette();
      gfxRef.current = { palette, sprites: buildSprites(palette) };
      worldRef.current ??= createWorld();
      draw();
    };
    rebuild();
    const mo = new MutationObserver(rebuild);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [draw]);

  useEffect(() => {
    hintsRef.current = !touch;
    draw();
  }, [touch, draw]);

  // Crisp pixels at any size: an integer multiple of the logical resolution.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const scale = Math.max(1, Math.round((canvas.clientWidth * (window.devicePixelRatio || 1)) / VIEW_W));
      canvas.width = VIEW_W * scale;
      canvas.height = VIEW_H * scale;
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  const start = useCallback(() => {
    if (statusRef.current === 'playing') return;
    if (statusRef.current !== 'paused') {
      worldRef.current = createWorld();
      setRevealed(facts.map(() => false));
      setHud({ commits: 0, squashed: 0 });
      setResult(null);
      setAnnouncement('');
      setLearned({ moved: false, jumped: false });
    }
    inputRef.current = noInput();
    setStatus('playing');
    fxRef.current?.unlock();
    fxRef.current?.cue('start');
    hostRef.current?.focus({ preventScroll: true });
  }, [facts, setStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    inputRef.current = noInput();
    setStatus('paused');
  }, [setStatus]);

  // Game loop runs only while playing.
  useEffect(() => {
    if (status !== 'playing') return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const world = worldRef.current;
      if (!world) return;
      const events = step(world, inputRef.current, (now - last) / 1000);
      last = now;
      if (events.length) {
        for (const e of events) {
          fxRef.current?.cue(EVENT_CUE[e.type]);
          if (e.type === 'fact') {
            const f = facts[e.index];
            setAnnouncement(`Unlocked: ${f.label} ${f.detail}`);
          }
        }
        setRevealed([...world.revealed]);
        setHud({ commits: world.stats.commits, squashed: world.stats.squashed });
      }
      draw();
      hostRef.current?.setAttribute('data-player-x', String(Math.round(world.player.x)));
      if (world.won) {
        setResult({
          seconds: Math.round(world.time),
          facts: world.revealed.filter(Boolean).length,
          commits: world.stats.commits,
        });
        setStatus('won');
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [status, draw, facts, setStatus]);

  // Keyboard (only while the game has focus), pause on blur / hidden tab.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = statusRef.current;
      if (s !== 'playing') {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === host) {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        e.stopPropagation();
        pause();
        return;
      }
      const k = KEYS[e.key];
      if (k) {
        e.preventDefault();
        inputRef.current[k] = true;
        setLearned((l) =>
          k === 'jump' ? (l.jumped ? l : { ...l, jumped: true }) : l.moved ? l : { ...l, moved: true },
        );
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (k) inputRef.current[k] = false;
    };
    const onFocusOut = (e: FocusEvent) => {
      // Moving focus to the game's own controls (mute, pause) doesn't pause it.
      const within = host.closest('.quest') ?? host;
      if (!within.contains(e.relatedTarget as Node | null)) pause();
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    host.addEventListener('keydown', onKeyDown);
    host.addEventListener('keyup', onKeyUp);
    host.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      host.removeEventListener('keydown', onKeyDown);
      host.removeEventListener('keyup', onKeyUp);
      host.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [start, pause, toggleSound]);

  // PLAY icon / terminal / palette.
  useEffect(() => {
    const launch = () => {
      consumeQuestLaunch();
      hostRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      start();
    };
    if (consumeQuestLaunch()) launch();
    window.addEventListener(QUEST_EVENT, launch);
    return () => window.removeEventListener(QUEST_EVENT, launch);
  }, [start]);

  // Touch pad: one handler for all three buttons (data-key says which).
  const onPad = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const key = e.currentTarget.dataset.key as keyof Input;
    const down = e.type === 'pointerdown';
    if (down) e.currentTarget.setPointerCapture(e.pointerId);
    inputRef.current[key] = down;
  };

  const found = revealed.filter(Boolean).length;

  return (
    <section className="quest" aria-labelledby="quest-title">
      <header className="quest__bar">
        <h2 id="quest-title" className="mono quest__title">
          <Play size={11} aria-hidden="true" /> quest.exe
        </h2>
        <p className="quest__hud mono" aria-hidden="true">
          <span>
            facts <strong>{found}</strong>/{facts.length}
          </span>
          <span>
            commits <strong>{hud.commits}</strong>/{COMMITS_TOTAL}
          </span>
          <span>
            bugs fixed <strong>{hud.squashed}</strong>
          </span>
        </p>
        <button
          className="quest__icon"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label="Game sound and haptics"
          title={soundOn ? 'Sound on: click to mute' : 'Sound off: click to unmute'}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
        {status === 'playing' && (
          <button className="quest__icon" onClick={pause} aria-label="Pause game">
            <Pause size={13} />
          </button>
        )}
      </header>

      <div
        ref={hostRef}
        className={`quest__stage is-${status}`}
        // A focusable game surface: arrow keys / WASD move, Space jumps, Esc pauses.
        role="application"
        aria-roledescription="game"
        aria-label="Neerav Quest. Arrow keys or A and D to move, Space to jump, Escape to pause, M to mute."
        tabIndex={0}
      >
        <canvas ref={canvasRef} className="quest__canvas" aria-hidden="true" />

        {status === 'playing' && !touch && !(learned.moved && learned.jumped) && (
          <p className="quest__hint mono" aria-hidden="true">
            {!learned.moved ? (
              <>
                Press <span className="kbd">←</span> <span className="kbd">→</span> to move
              </>
            ) : (
              <>
                Press <span className="kbd">Space</span> to jump
              </>
            )}
          </p>
        )}

        {status === 'title' && (
          <div className="quest__overlay">
            <p className="quest__logo mono">NEERAV QUEST</p>
            <p className="quest__tag">A 45-second side quest through my resume. Hit the {'{ }'} blocks.</p>
            <button className="btn btn--primary" onClick={start}>
              <Play size={14} /> Play
            </button>
            <p className="quest__keys mono" aria-hidden="true">
              <span className="kbd">←</span>
              <span className="kbd">→</span> move <span className="kbd">Space</span> jump{' '}
              <span className="kbd">Esc</span> pause <span className="kbd">M</span> mute
            </p>
          </div>
        )}
        {status === 'paused' && (
          <div className="quest__overlay quest__overlay--dim">
            <p className="quest__logo mono">PAUSED</p>
            <button className="btn btn--primary" onClick={start}>
              <Play size={14} /> Resume
            </button>
          </div>
        )}
        {status === 'won' && result && (
          <div className="quest__overlay quest__overlay--dim">
            <p className="quest__logo mono">QUEST COMPLETE</p>
            <p className="quest__tag">
              {result.facts}/{facts.length} facts · {result.commits} commits · {result.seconds}s. You reached the
              resume. Let&rsquo;s talk.
            </p>
            <div className="quest__cta">
              <button className="btn btn--primary btn--sm" onClick={previewResume}>
                <Eye size={13} /> Preview resume
              </button>
              <a className="btn btn--sm" href={profile.links.linkedin} target="_blank" rel="noreferrer">
                <LinkedInIcon size={13} /> LinkedIn
              </a>
              <button className="btn btn--sm" onClick={copyEmail}>
                <Mail size={13} /> Email
              </button>
              <button className="btn btn--sm btn--ghost" onClick={start}>
                <RotateCcw size={13} /> Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {touch && status === 'playing' && (
        <div className="quest__pad" aria-hidden="true">
          <button
            className="quest__key"
            tabIndex={-1}
            data-key="left"
            onPointerDown={onPad}
            onPointerUp={onPad}
            onPointerCancel={onPad}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="quest__key"
            tabIndex={-1}
            data-key="right"
            onPointerDown={onPad}
            onPointerUp={onPad}
            onPointerCancel={onPad}
          >
            <ArrowRight size={18} />
          </button>
          <button
            className="quest__key quest__key--jump"
            tabIndex={-1}
            data-key="jump"
            onPointerDown={onPad}
            onPointerUp={onPad}
            onPointerCancel={onPad}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      )}

      <ul className="quest__facts" aria-label="Facts unlocked in the game">
        {facts.map((f, i) => (
          <li key={f.label} className={revealed[i] ? 'is-on' : undefined}>
            {revealed[i] ? (
              <>
                <span>{f.label}</span> <span className="mono">{f.detail}</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="mono">
                  {'{ ? }'}
                </span>
                <span className="sr-only">
                  Locked: {f.label} {f.detail}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
