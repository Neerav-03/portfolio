import { Moon, Sun } from 'lucide-react';
import { toggleTheme, useTheme } from '../lib/theme';

/** Sun in dark mode (switch to light), moon in light mode (switch to dark). */
export function ThemeToggle({ className = 'topbar__btn' }: { className?: string }) {
  const { theme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      className={`${className} theme-toggle`}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon key={theme} size={14} className="theme-toggle__icon" aria-hidden="true" />
    </button>
  );
}
