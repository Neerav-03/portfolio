import { describe, expect, it } from 'vitest';
import { DESKTOP_BOTTOM, DESKTOP_TOP, osReducer, type OSAction, type OSState } from './osState';

const viewport = { width: 1440, height: 900 };
const base: OSState = {
  windows: [],
  hasOpenedWindow: false,
  terminalOpen: false,
  paletteOpen: false,
  resumePreviewOpen: false,
  mode: 'system',
  toast: null,
};
const run = (actions: OSAction[], state = base) => actions.reduce(osReducer, state);
const ids = (s: OSState) => s.windows.map((w) => w.id);

describe('osReducer · windows', () => {
  it('opens a window inside the desktop area', () => {
    const s = run([{ type: 'open', id: 'experience', viewport }]);
    const [w] = s.windows;
    expect(s.hasOpenedWindow).toBe(true);
    expect(w.id).toBe('experience');
    expect(w.y).toBeGreaterThanOrEqual(DESKTOP_TOP);
    expect(w.y + w.h).toBeLessThanOrEqual(viewport.height - DESKTOP_BOTTOM);
    expect(w.x + w.w).toBeLessThanOrEqual(viewport.width);
  });

  it('clamps window size to small viewports', () => {
    const small = { width: 600, height: 500 };
    const [w] = run([{ type: 'open', id: 'experience', viewport: small }]).windows;
    expect(w.w).toBeLessThanOrEqual(small.width - 32);
    expect(w.h).toBeLessThanOrEqual(small.height - DESKTOP_TOP - DESKTOP_BOTTOM);
  });

  it('re-opening focuses the existing window and pushes new params', () => {
    const s = run([
      { type: 'open', id: 'experience', viewport },
      { type: 'open', id: 'code', viewport },
      { type: 'open', id: 'experience', params: { view: 'drp' }, viewport },
    ]);
    expect(ids(s)).toEqual(['code', 'experience']);
    const exp = s.windows[1];
    expect(exp.params.view).toBe('drp');
    expect(exp.nonce).toBe(1);
  });

  it('focus raises a window and restores it when minimized', () => {
    const s = run([
      { type: 'open', id: 'experience', viewport },
      { type: 'open', id: 'code', viewport },
      { type: 'minimize', id: 'experience' },
      { type: 'focus', id: 'experience' },
    ]);
    expect(ids(s)).toEqual(['code', 'experience']);
    expect(s.windows[1].minimized).toBe(false);
  });

  it('focus on the top window is a no-op', () => {
    const s = run([{ type: 'open', id: 'code', viewport }]);
    expect(osReducer(s, { type: 'focus', id: 'code' })).toBe(s);
  });

  it('close marks the window closing, remove deletes it', () => {
    let s = run([
      { type: 'open', id: 'about', viewport },
      { type: 'close', id: 'about' },
    ]);
    expect(s.windows[0].closing).toBe(true);
    s = osReducer(s, { type: 'remove', id: 'about' });
    expect(s.windows).toHaveLength(0);
    expect(s.hasOpenedWindow).toBe(true);
  });

  it('toggles maximize and stores bounds', () => {
    let s = run([
      { type: 'open', id: 'code', viewport },
      { type: 'toggleMax', id: 'code' },
    ]);
    expect(s.windows[0].maximized).toBe(true);
    s = osReducer(s, { type: 'bounds', id: 'code', x: 40, y: 60, w: 500, h: 400 });
    expect(s.windows[0]).toMatchObject({ x: 40, y: 60, w: 500, h: 400 });
  });

  it('view updates params without bumping the nonce, and no-ops when unchanged', () => {
    const s = run([
      { type: 'open', id: 'experience', viewport },
      { type: 'view', id: 'experience', view: 'dal' },
    ]);
    expect(s.windows[0].params.view).toBe('dal');
    expect(s.windows[0].nonce).toBe(0);
    expect(osReducer(s, { type: 'view', id: 'experience', view: 'dal' })).toBe(s);
  });

  it('fit pulls windows back inside a shrunken viewport', () => {
    const s = run([
      { type: 'open', id: 'experience', viewport },
      { type: 'bounds', id: 'experience', x: 900, y: 500, w: 1000, h: 700 },
      { type: 'fit', viewport: { width: 800, height: 600 } },
    ]);
    const w = s.windows[0];
    expect(w.x + w.w).toBeLessThanOrEqual(800);
    expect(w.y + w.h).toBeLessThanOrEqual(600 - DESKTOP_BOTTOM);
    expect(osReducer(s, { type: 'fit', viewport: { width: 800, height: 600 } })).toBe(s);
  });
});

describe('osReducer · overlays and modes', () => {
  it('terminal and palette are mutually exclusive', () => {
    let s = run([{ type: 'terminal', open: true }]);
    s = osReducer(s, { type: 'palette', open: true });
    expect(s).toMatchObject({ paletteOpen: true, terminalOpen: false });
    s = osReducer(s, { type: 'terminal', open: true });
    expect(s).toMatchObject({ paletteOpen: false, terminalOpen: true });
  });

  it('previewResume opens the Resume window in system mode', () => {
    const s = run([{ type: 'previewResume', viewport }]);
    expect(ids(s)).toEqual(['resume']);
    expect(s.resumePreviewOpen).toBe(false);
  });

  it('previewResume opens the modal in recruiter mode; mode change closes it', () => {
    let s = run([
      { type: 'mode', mode: 'recruiter' },
      { type: 'previewResume', viewport },
    ]);
    expect(s.resumePreviewOpen).toBe(true);
    expect(s.windows).toHaveLength(0);
    s = osReducer(s, { type: 'closeResumePreview' });
    expect(s.resumePreviewOpen).toBe(false);
    s = run(
      [
        { type: 'previewResume', viewport },
        { type: 'mode', mode: 'system' },
      ],
      s,
    );
    expect(s.resumePreviewOpen).toBe(false);
  });

  it('toasts get increasing ids and only the current one clears', () => {
    let s = run([
      { type: 'toast', text: 'a' },
      { type: 'toast', text: 'b' },
    ]);
    expect(s.toast).toEqual({ id: 2, text: 'b' });
    expect(osReducer(s, { type: 'clearToast', id: 1 })).toBe(s);
    s = osReducer(s, { type: 'clearToast', id: 2 });
    expect(s.toast).toBeNull();
  });
});
