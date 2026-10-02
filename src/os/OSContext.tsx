import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppId, AppParams } from '../data/types';
import { profile } from '../data/portfolio';
import { buildHash, parseHash } from '../lib/route';
import { readStore, STORE_KEYS, writeStore } from '../lib/storage';
import { osReducer, type Mode, type OSState } from './osState';
import { OSContext, type OSApi } from './useOS';

function initialState(): OSState {
  const route = parseHash(window.location.hash);
  const stored = readStore(STORE_KEYS.mode);
  const mode: Mode =
    route.kind === 'recruiter'
      ? 'recruiter'
      : route.kind === 'app'
        ? 'system'
        : stored === 'recruiter'
          ? 'recruiter'
          : 'system';
  return {
    windows: [],
    hasOpenedWindow: false,
    terminalOpen: false,
    paletteOpen: false,
    resumePreviewOpen: false,
    mode,
    toast: null,
  };
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export function OSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(osReducer, undefined, initialState);

  const openApp = useCallback((id: AppId, params?: AppParams) => {
    dispatch({ type: 'mode', mode: 'system' });
    dispatch({ type: 'open', id, params, viewport: viewport() });
  }, []);

  // Actions only depend on the stable `dispatch`, so their identities never change.
  const actions = useMemo<Omit<OSApi, 'state'>>(
    () => ({
      openApp,
      closeApp: (id) => dispatch({ type: 'close', id }),
      removeApp: (id) => dispatch({ type: 'remove', id }),
      minimizeApp: (id) => dispatch({ type: 'minimize', id }),
      focusApp: (id) => dispatch({ type: 'focus', id }),
      toggleMax: (id) => dispatch({ type: 'toggleMax', id }),
      setBounds: (id, b) => dispatch({ type: 'bounds', id, ...b }),
      reportView: (id, view) => dispatch({ type: 'view', id, view }),
      setTerminal: (open) => dispatch({ type: 'terminal', open }),
      setPalette: (open) => dispatch({ type: 'palette', open }),
      setMode: (mode) => dispatch({ type: 'mode', mode }),
      previewResume: () => dispatch({ type: 'previewResume', viewport: viewport() }),
      closeResumePreview: () => dispatch({ type: 'closeResumePreview' }),
      toast: (text) => dispatch({ type: 'toast', text }),
      copyEmail: () => {
        const done = () => dispatch({ type: 'toast', text: `Copied ${profile.email}` });
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(profile.email)
            .then(done, () => dispatch({ type: 'toast', text: profile.email }));
        } else {
          dispatch({ type: 'toast', text: profile.email });
        }
      },
    }),
    [openApp],
  );
  const api = useMemo<OSApi>(() => ({ state, ...actions }), [state, actions]);

  // Persist mode.
  useEffect(() => writeStore(STORE_KEYS.mode, state.mode), [state.mode]);

  // Keep the URL hash in sync with the focused window so any view is shareable.
  const top = [...state.windows].reverse().find((w) => !w.minimized && !w.closing);
  const hash = buildHash(state.mode, top ? { id: top.id, view: top.params.view } : undefined);
  // Don't clobber an incoming deep link while the boot sequence is still running.
  const holdHash = !state.hasOpenedWindow && state.mode === 'system';
  useEffect(() => {
    if (window.location.hash === hash || holdHash) return;
    const url = window.location.pathname + window.location.search + hash;
    window.history.replaceState(null, '', url);
  }, [hash, holdHash]);

  // In-page links like href="#/experience/drp" open the target app.
  useEffect(() => {
    const onHash = () => {
      const route = parseHash(window.location.hash);
      if (route.kind === 'app') openApp(route.id, route.params);
      else if (route.kind === 'recruiter') dispatch({ type: 'mode', mode: 'recruiter' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [openApp]);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => dispatch({ type: 'fit', viewport: viewport() }));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!state.toast) return;
    const id = state.toast.id;
    const t = window.setTimeout(() => dispatch({ type: 'clearToast', id }), 2400);
    return () => window.clearTimeout(t);
  }, [state.toast]);

  return <OSContext.Provider value={api}>{children}</OSContext.Provider>;
}
