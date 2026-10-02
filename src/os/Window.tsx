import { ArrowLeft, Maximize2, Minus, X } from 'lucide-react';
import { useEffect, useRef, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { APP_META } from './appMeta';
import { useOS } from './useOS';
import { DESKTOP_BOTTOM, DESKTOP_TOP, type WindowState } from './osState';
import './window.css';

interface WindowProps {
  win: WindowState;
  z: number;
  isTop: boolean;
  isMobile: boolean;
  children: ReactNode;
}

const MIN_W = 420;
const MIN_H = 320;

export function Window({ win, z, isTop, isMobile, children }: WindowProps) {
  const { closeApp, removeApp, minimizeApp, focusApp, toggleMax, setBounds } = useOS();
  const ref = useRef<HTMLElement>(null);
  const meta = APP_META[win.id];
  const titleId = `win-title-${win.id}`;

  // Move keyboard focus into a freshly opened window.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  // Window-level behaviour: any press inside raises the window; Esc closes it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPointer = () => focusApp(win.id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.stopPropagation();
        closeApp(win.id);
      }
    };
    el.addEventListener('pointerdown', onPointer, { capture: true });
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('pointerdown', onPointer, { capture: true });
      el.removeEventListener('keydown', onKey);
    };
  }, [focusApp, closeApp, win.id]);

  // Let the exit animation play before unmounting.
  useEffect(() => {
    if (!win.closing) return;
    const t = window.setTimeout(() => removeApp(win.id), 150);
    return () => window.clearTimeout(t);
  }, [win.closing, win.id, removeApp]);

  const startGesture = (e: RPointerEvent, kind: 'move' | 'resize') => {
    if (isMobile || win.maximized || e.button !== 0) return;
    if (kind === 'move' && (e.target as HTMLElement).closest('button')) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    focusApp(win.id);
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    const start = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, w: win.w, h: win.h };
    let next = { x: win.x, y: win.y, w: win.w, h: win.h };
    el.classList.add('is-dragging');

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (kind === 'move') {
        next.x = Math.min(Math.max(start.x + dx, 80 - start.w), vw - 80);
        next.y = Math.min(Math.max(start.y + dy, DESKTOP_TOP - 8), vh - 60);
        el.style.left = `${next.x}px`;
        el.style.top = `${next.y}px`;
      } else {
        next.w = Math.min(Math.max(start.w + dx, MIN_W), vw - start.x - 8);
        next.h = Math.min(Math.max(start.h + dy, MIN_H), vh - start.y - 8);
        el.style.width = `${next.w}px`;
        el.style.height = `${next.h}px`;
      }
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      el.classList.remove('is-dragging');
      setBounds(win.id, next);
      next = { ...next };
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  const style = isMobile
    ? { zIndex: z }
    : win.maximized
      ? { zIndex: z, left: 12, top: DESKTOP_TOP, right: 12, bottom: DESKTOP_BOTTOM }
      : { zIndex: z, left: win.x, top: win.y, width: win.w, height: win.h };

  const classes = [
    'win',
    isMobile ? 'win--mobile' : '',
    isTop ? 'is-top' : '',
    win.minimized ? 'is-minimized' : '',
    win.closing ? 'is-closing' : '',
    win.maximized ? 'is-max' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const crumb = win.params.view;

  return (
    <section
      ref={ref}
      className={classes}
      style={style}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      inert={win.minimized || win.closing}
    >
      <header
        className="win__bar"
        onPointerDown={(e) => startGesture(e, 'move')}
        onDoubleClick={(e) => {
          if (!isMobile && !(e.target as HTMLElement).closest('button')) toggleMax(win.id);
        }}
      >
        {isMobile ? (
          <button className="win__back" onClick={() => closeApp(win.id)} aria-label="Back to home">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="win__controls">
            <button
              className="win__ctl win__ctl--close"
              onClick={() => closeApp(win.id)}
              aria-label={`Close ${meta.title}`}
            >
              <X size={9} strokeWidth={3} />
            </button>
            <button
              className="win__ctl win__ctl--min"
              onClick={() => minimizeApp(win.id)}
              aria-label={`Minimize ${meta.title}`}
            >
              <Minus size={9} strokeWidth={3} />
            </button>
            <button
              className="win__ctl win__ctl--max"
              onClick={() => toggleMax(win.id)}
              aria-label={win.maximized ? `Restore ${meta.title}` : `Maximize ${meta.title}`}
            >
              <Maximize2 size={8} strokeWidth={3} />
            </button>
          </div>
        )}
        <h2 id={titleId} className="win__title mono">
          <meta.icon size={13} aria-hidden="true" />
          <span>{meta.process}</span>
          {crumb && (
            <span className="win__crumb">
              <span aria-hidden="true">/</span> {crumb}
            </span>
          )}
        </h2>
        <span className="win__status mono" aria-hidden="true">
          <span className="dot dot--ok" /> running
        </span>
      </header>
      <div className="win__body">{children}</div>
      {!isMobile && !win.maximized && (
        <div className="win__resize" onPointerDown={(e) => startGesture(e, 'resize')} aria-hidden="true" />
      )}
    </section>
  );
}
