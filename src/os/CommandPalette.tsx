import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { fuzzyScore } from '../lib/fuzzy';
import { useTheme } from '../lib/theme';
import { buildCommands, type CommandContext, type PaletteCommand } from './commands';
import { useOS } from './OSContext';
import './palette.css';

export default function CommandPalette() {
  const { state, setPalette, openApp, setTerminal, setMode, closeApp, copyEmail, previewResume } = useOS();
  const open = state.paletteOpen;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const commands = useMemo(buildCommands, []);
  const { preference, theme } = useTheme();

  const results = useMemo(() => {
    const hidden = new Set([
      state.mode === 'recruiter' ? 'recruiter' : 'system',
      preference === 'system' ? 'theme-system' : `theme-${theme}`,
    ]);
    const visible = commands.filter((c) => !hidden.has(c.id));
    if (!query.trim()) return visible;
    return visible
      .map((c) => ({ c, s: Math.max(fuzzyScore(query, c.title) * 1.2, fuzzyScore(query, `${c.sub ?? ''} ${c.keywords ?? ''} ${c.group}`) * 0.7) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c);
  }, [commands, query, state.mode, preference, theme]);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      returnFocus.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const ctx: CommandContext = {
    openApp,
    setTerminal,
    setMode,
    copyEmail,
    previewResume,
    closeAll: () => state.windows.forEach((w) => closeApp(w.id)),
  };

  const run = (cmd: PaletteCommand) => {
    returnFocus.current = null;
    setPalette(false);
    cmd.run(ctx);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = results[active];
      if (cmd) run(cmd);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setPalette(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  // Group while preserving result order.
  const groups: { name: string; items: { cmd: PaletteCommand; index: number }[] }[] = [];
  results.forEach((cmd, index) => {
    const name = query.trim() ? 'Results' : cmd.group;
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push({ cmd, index });
  });

  const activeId = results[active] ? `cmd-${results[active].id}` : undefined;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}>
        <div className="palette__search">
          <Search size={15} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, systems, projects, actions…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search commands"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul id="palette-list" ref={listRef} className="palette__list" role="listbox" aria-label="Commands">
          {results.length === 0 && <li className="palette__empty mono">No matches for “{query}”. Try “drp”, “codeforces” or “resume”.</li>}
          {groups.map((g) => (
            <li key={g.name} role="presentation">
              <div className="palette__group label" role="presentation">
                {g.name}
              </div>
              <ul role="group" aria-label={g.name}>
                {g.items.map(({ cmd, index }) => (
                  <li
                    key={cmd.id}
                    id={`cmd-${cmd.id}`}
                    role="option"
                    aria-selected={index === active}
                    className="palette__item"
                    onMouseMove={() => index !== active && setActive(index)}
                    onClick={() => run(cmd)}
                  >
                    <cmd.icon size={15} aria-hidden="true" />
                    <span className="palette__title">{cmd.title}</span>
                    {cmd.sub && <span className="palette__sub">{cmd.sub}</span>}
                    {index === active && <CornerDownLeft size={13} className="palette__enter" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="palette__foot mono" aria-hidden="true">
          <span>
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> open
          </span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
