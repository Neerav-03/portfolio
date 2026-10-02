import { Search, SquareTerminal } from 'lucide-react';
import { useClock } from '../hooks/useClock';
import { MOD_LABEL } from '../lib/platform';
import { ModeToggle } from './ModeToggle';
import { ThemeToggle } from './ThemeToggle';
import { useOS } from './OSContext';

export function Logo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 11V5l6 6V5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopBar() {
  const { setPalette, setTerminal, state } = useOS();
  const now = useClock();
  const date = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="topbar">
      <div className="topbar__left">
        <span className="topbar__brand mono">
          <Logo /> NEERAV OS
        </span>
        <span className="topbar__status mono" aria-label="System status: online">
          <span className="dot dot--ok dot--pulse" /> SYSTEM ONLINE
        </span>
      </div>
      <div className="topbar__right">
        <ModeToggle />
        <ThemeToggle />
        <button className="topbar__btn mono" onClick={() => setPalette(true)} aria-label="Open command palette" aria-keyshortcuts="Control+K Meta+K">
          <Search size={13} />
          <span className="topbar__hint">
            <span className="kbd">{MOD_LABEL}</span>
            <span className="kbd">K</span>
          </span>
        </button>
        <button
          className="topbar__btn mono"
          onClick={() => setTerminal(!state.terminalOpen)}
          aria-label="Toggle terminal"
          aria-keyshortcuts="Control+`"
          aria-pressed={state.terminalOpen}
        >
          <SquareTerminal size={14} />
        </button>
        <time className="topbar__clock mono" dateTime={now.toISOString()}>
          <span className="topbar__date">{date}</span> {time}
        </time>
      </div>
    </header>
  );
}
