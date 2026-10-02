import type { AppId, AppParams } from '../data/types';
import { APP_META } from './appMeta';

export type Mode = 'system' | 'recruiter';

export interface WindowState {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  closing: boolean;
  params: AppParams;
  /** Bumped whenever params are pushed from outside (palette, terminal, links). */
  nonce: number;
}

export interface OSState {
  /** Ordered by z-index: last element is on top. */
  windows: WindowState[];
  /** True once any window has opened (the URL hash is left alone until then). */
  hasOpenedWindow: boolean;
  terminalOpen: boolean;
  paletteOpen: boolean;
  /** Resume preview modal (recruiter mode; system mode uses the Resume window). */
  resumePreviewOpen: boolean;
  mode: Mode;
  toast: { id: number; text: string } | null;
}

export interface Viewport {
  width: number;
  height: number;
}

export type OSAction =
  | { type: 'open'; id: AppId; params?: AppParams; viewport: Viewport }
  | { type: 'close'; id: AppId }
  | { type: 'remove'; id: AppId }
  | { type: 'minimize'; id: AppId }
  | { type: 'showDesktop' }
  | { type: 'focus'; id: AppId }
  | { type: 'toggleMax'; id: AppId }
  | { type: 'bounds'; id: AppId; x: number; y: number; w?: number; h?: number }
  | { type: 'view'; id: AppId; view: string }
  | { type: 'fit'; viewport: Viewport }
  | { type: 'terminal'; open: boolean }
  | { type: 'palette'; open: boolean }
  | { type: 'mode'; mode: Mode }
  | { type: 'previewResume'; viewport: Viewport }
  | { type: 'closeResumePreview' }
  | { type: 'toast'; text: string }
  | { type: 'clearToast'; id: number };

export const DESKTOP_TOP = 44; // top bar + gap
export const DESKTOP_BOTTOM = 84; // dock + gap

function initialBounds(id: AppId, count: number, vp: Viewport) {
  const { w: dw, h: dh } = APP_META[id].size;
  const availW = vp.width - 32;
  const availH = vp.height - DESKTOP_TOP - DESKTOP_BOTTOM;
  const w = Math.min(dw, availW);
  const h = Math.min(dh, availH);
  const step = (count % 6) * 26;
  const cx = Math.round((vp.width - w) / 2) + step - 52;
  const cy = DESKTOP_TOP + Math.max(0, Math.round((availH - h) / 3)) + step;
  return {
    x: Math.max(16, Math.min(cx, vp.width - w - 16)),
    y: Math.max(DESKTOP_TOP, Math.min(cy, DESKTOP_TOP + availH - h)),
    w,
    h,
  };
}

function bringToTop(windows: WindowState[], id: AppId, patch: Partial<WindowState> = {}) {
  const target = windows.find((w) => w.id === id);
  if (!target) return windows;
  return [...windows.filter((w) => w.id !== id), { ...target, ...patch }];
}

export function osReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'open': {
      const existing = state.windows.find((w) => w.id === action.id);
      if (existing) {
        const patch: Partial<WindowState> = { minimized: false, closing: false };
        if (action.params) {
          patch.params = action.params;
          patch.nonce = existing.nonce + 1;
        }
        return { ...state, windows: bringToTop(state.windows, action.id, patch) };
      }
      const win: WindowState = {
        id: action.id,
        ...initialBounds(action.id, state.windows.length, action.viewport),
        minimized: false,
        maximized: false,
        closing: false,
        params: action.params ?? {},
        nonce: 0,
      };
      return { ...state, hasOpenedWindow: true, windows: [...state.windows, win] };
    }
    case 'close':
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, closing: true } : w)),
      };
    case 'remove':
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case 'minimize':
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      };
    case 'showDesktop':
      if (state.windows.every((w) => w.minimized)) return state;
      return { ...state, windows: state.windows.map((w) => (w.minimized ? w : { ...w, minimized: true })) };
    case 'focus': {
      const top = state.windows[state.windows.length - 1];
      if (top?.id === action.id && !top.minimized) return state;
      return { ...state, windows: bringToTop(state.windows, action.id, { minimized: false }) };
    }
    case 'toggleMax':
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, maximized: !w.maximized } : w)),
      };
    case 'bounds':
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, x: action.x, y: action.y, w: action.w ?? w.w, h: action.h ?? w.h } : w,
        ),
      };
    case 'view':
      if (!state.windows.some((w) => w.id === action.id && w.params.view !== action.view)) return state;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id && w.params.view !== action.view
            ? { ...w, params: { ...w.params, view: action.view } }
            : w,
        ),
      };
    case 'fit': {
      // Keep every window reachable after the viewport shrinks.
      const { width, height } = action.viewport;
      const availH = height - DESKTOP_TOP - DESKTOP_BOTTOM;
      let changed = false;
      const windows = state.windows.map((win) => {
        const w = Math.min(win.w, width - 32);
        const h = Math.min(win.h, availH);
        const x = Math.max(16, Math.min(win.x, width - w - 16));
        const y = Math.max(DESKTOP_TOP, Math.min(win.y, DESKTOP_TOP + availH - h));
        if (w === win.w && h === win.h && x === win.x && y === win.y) return win;
        changed = true;
        return { ...win, x, y, w, h };
      });
      return changed ? { ...state, windows } : state;
    }
    case 'terminal':
      return { ...state, terminalOpen: action.open, paletteOpen: action.open ? false : state.paletteOpen };
    case 'palette':
      return { ...state, paletteOpen: action.open, terminalOpen: action.open ? false : state.terminalOpen };
    case 'mode':
      return { ...state, mode: action.mode, paletteOpen: false, resumePreviewOpen: false };
    case 'previewResume':
      // System mode previews in the Resume window; recruiter mode has no windows, so use the modal.
      return state.mode === 'system'
        ? osReducer({ ...state, paletteOpen: false }, { type: 'open', id: 'resume', viewport: action.viewport })
        : { ...state, paletteOpen: false, terminalOpen: false, resumePreviewOpen: true };
    case 'closeResumePreview':
      return { ...state, resumePreviewOpen: false };
    case 'toast':
      return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, text: action.text } };
    case 'clearToast':
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
  }
}
