import { Briefcase, FolderGit2, House, Search, SquareTerminal } from 'lucide-react';
import type { AppId } from '../data/types';
import { preloadApp } from '../apps/registry';
import { APP_META, DOCK_APPS } from './appMeta';
import { useOS } from './useOS';

export function Dock() {
  const { state, openApp, focusApp, setTerminal } = useOS();
  const visible = state.windows.filter((w) => !w.minimized && !w.closing);
  const topId = visible[visible.length - 1]?.id;

  const activate = (id: AppId) => {
    const win = state.windows.find((w) => w.id === id && !w.closing);
    if (win) focusApp(id);
    else openApp(id);
  };

  return (
    <nav className="dock" aria-label="Dock">
      <ul className="dock__list">
        {DOCK_APPS.map((id) => {
          const meta = APP_META[id];
          const running = state.windows.some((w) => w.id === id && !w.closing);
          return (
            <li key={id}>
              <button
                className={`dock__item${topId === id ? ' is-active' : ''}`}
                onClick={() => activate(id)}
                onMouseEnter={() => preloadApp(id)}
                aria-label={`${meta.title}${running ? ' (running)' : ''}`}
              >
                <meta.icon size={19} strokeWidth={1.6} />
                <span className="dock__tip mono" aria-hidden="true">
                  {meta.title}
                </span>
                {running && <span className="dock__run" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
        <li className="dock__sep" aria-hidden="true" />
        <li>
          <button
            className={`dock__item${state.terminalOpen ? ' is-active' : ''}`}
            onClick={() => setTerminal(!state.terminalOpen)}
            aria-label="Terminal"
            aria-pressed={state.terminalOpen}
          >
            <SquareTerminal size={19} strokeWidth={1.6} />
            <span className="dock__tip mono" aria-hidden="true">
              Terminal
            </span>
            {state.terminalOpen && <span className="dock__run" aria-hidden="true" />}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Bottom navigation on phones — the dock adapted to thumbs. */
export function MobileNav() {
  const { state, openApp, closeApp, setTerminal, setPalette } = useOS();
  const visible = state.windows.filter((w) => !w.minimized && !w.closing);
  const topId = visible[visible.length - 1]?.id;

  const goHome = () => {
    state.windows.forEach((w) => closeApp(w.id));
    setTerminal(false);
  };

  const items = [
    { key: 'home', label: 'Home', icon: House, active: !topId && !state.terminalOpen, onClick: goHome },
    {
      key: 'experience',
      label: 'Experience',
      icon: Briefcase,
      active: topId === 'experience',
      onClick: () => openApp('experience'),
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: FolderGit2,
      active: topId === 'projects',
      onClick: () => openApp('projects'),
    },
    { key: 'search', label: 'Search', icon: Search, active: state.paletteOpen, onClick: () => setPalette(true) },
    {
      key: 'terminal',
      label: 'Terminal',
      icon: SquareTerminal,
      active: state.terminalOpen,
      onClick: () => setTerminal(!state.terminalOpen),
    },
  ];

  return (
    <nav className="mnav" aria-label="Primary">
      {items.map((it) => (
        <button
          key={it.key}
          className={`mnav__item${it.active ? ' is-active' : ''}`}
          onClick={it.onClick}
          aria-current={it.active ? 'page' : undefined}
        >
          <it.icon size={19} strokeWidth={1.7} />
          <span className="mono">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Toast() {
  const { state } = useOS();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {state.toast && (
        <div key={state.toast.id} className="toast mono">
          <span className="dot dot--ok" /> {state.toast.text}
        </div>
      )}
    </div>
  );
}
