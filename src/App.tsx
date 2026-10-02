import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useIsMobile } from './hooks/useMediaQuery';
import { parseHash } from './lib/route';
import { Boot } from './os/Boot';
import { Desktop } from './os/Desktop';
import { Dock, MobileNav, Toast } from './os/Dock';
import { useOS } from './os/OSContext';
import { TopBar } from './os/TopBar';
import { WindowLayer } from './os/WindowLayer';
import { RecruiterView } from './recruiter/RecruiterView';
import './os/shell.css';

const loadTerminal = () => import('./terminal/Terminal');
const loadPalette = () => import('./os/CommandPalette');
const Terminal = lazy(loadTerminal);
const ResumePreview = lazy(() => import('./os/ResumePreview').then((m) => ({ default: m.ResumePreview })));
const CommandPalette = lazy(loadPalette);

export function App() {
  const os = useOS();
  const { state, openApp, setPalette, setTerminal } = os;
  const isMobile = useIsMobile();
  const [initialRoute] = useState(() => parseHash(window.location.hash));
  const [booted, setBooted] = useState(() => state.mode === 'recruiter');
  const [terminalLoaded, setTerminalLoaded] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);

  const onBootDone = useCallback(() => {
    setBooted(true);
    if (initialRoute.kind === 'app') openApp(initialRoute.id, initialRoute.params);
  }, [initialRoute, openApp]);

  // Global shortcuts: Ctrl/⌘+K → command palette, Ctrl+` → terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(!state.paletteOpen);
      } else if (e.ctrlKey && (e.code === 'Backquote' || e.key === '`')) {
        e.preventDefault();
        setTerminal(!state.terminalOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.paletteOpen, state.terminalOpen, setPalette, setTerminal]);

  // Warm the overlay chunks once the desktop is idle.
  useEffect(() => {
    if (!booted) return;
    const warm = () => {
      void loadPalette();
      void loadTerminal();
    };
    const idle = window.requestIdleCallback?.(warm) ?? window.setTimeout(warm, 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [booted]);

  useEffect(() => {
    if (state.terminalOpen) setTerminalLoaded(true);
  }, [state.terminalOpen]);
  useEffect(() => {
    if (state.paletteOpen) setPaletteLoaded(true);
  }, [state.paletteOpen]);

  const focusMain = () => {
    const main = document.getElementById('main');
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  };

  return (
    <>
      <button className="skip-link" onClick={focusMain}>
        Skip to content
      </button>

      {state.mode === 'recruiter' ? (
        <RecruiterView />
      ) : (
        <div className="os" aria-hidden={!booted}>
          <TopBar />
          <Desktop />
          <WindowLayer isMobile={isMobile} />
          {isMobile ? <MobileNav /> : <Dock />}
        </div>
      )}

      <Suspense fallback={null}>{terminalLoaded && <Terminal />}</Suspense>
      <Suspense fallback={null}>{paletteLoaded && <CommandPalette />}</Suspense>
      <Suspense fallback={null}>{state.resumePreviewOpen && <ResumePreview />}</Suspense>
      <Toast />

      {!booted && <Boot onDone={onBootDone} />}
    </>
  );
}
