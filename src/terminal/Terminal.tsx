import { X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useOS } from '../os/useOS';
import { complete, runCommand, type Line, type TermContext } from './commands';
import './terminal.css';

interface Entry {
  id: number;
  input?: string;
  lines: Line[];
}

const PROMPT_USER = 'guest@neerav-os';
const WELCOME: Line[] = [
  [
    { text: 'NEERAV OS terminal', tone: 'head' },
    { text: ' · v1.0', tone: 'dim' },
  ],
  [
    { text: 'Type ', tone: 'dim' },
    { text: 'help', tone: 'accent' },
    { text: ' to list commands. Tab completes, ↑/↓ recalls history, Esc closes.', tone: 'dim' },
  ],
];

function Prompt() {
  return (
    <span className="term__prompt" aria-hidden="true">
      <span className="term__user">{PROMPT_USER}</span>
      <span className="term__dim">:</span>
      <span className="term__path">~</span>
      <span className="term__dim">$</span>{' '}
    </span>
  );
}

function renderLine(line: Line, key: number) {
  if (typeof line === 'string')
    return (
      <div key={key} className="term__line">
        {line || ' '}
      </div>
    );
  return (
    <div key={key} className="term__line">
      {line.map((seg, i) =>
        seg.href ? (
          <a
            key={i}
            className={`t-${seg.tone ?? 'accent'}`}
            href={seg.href}
            target={seg.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
          >
            {seg.text}
          </a>
        ) : (
          <span key={i} className={seg.tone ? `t-${seg.tone}` : undefined}>
            {seg.text}
          </span>
        ),
      )}
    </div>
  );
}

export default function Terminal() {
  const { state, setTerminal, openApp, setMode, previewResume, playQuest } = useOS();
  const open = state.terminalOpen;
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, lines: WELCOME }]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (returnFocus.current && document.contains(returnFocus.current)) {
      returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const submit = () => {
    const input = value;
    setValue('');
    setCursor(null);
    const nextHistory = input.trim() ? [...history, input.trim()] : history;
    setHistory(nextHistory);
    const ctx: TermContext = {
      openApp,
      setMode,
      previewResume,
      play: () => {
        returnFocus.current = null;
        playQuest();
      },
      history: nextHistory,
      setTerminal: (o) => {
        if (!o) returnFocus.current = null;
        setTerminal(o);
      },
    };
    const result = runCommand(input, ctx);
    if (result.clear) {
      setEntries([]);
      return;
    }
    setEntries((prev) => [...prev.slice(-200), { id: idRef.current++, input, lines: result.lines ?? [] }]);
    if (result.after) window.setTimeout(result.after, 260);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor === null) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(null);
        setValue('');
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (value.includes(' ')) return;
      const options = complete(value);
      if (options.length === 1) setValue(`${options[0]} `);
      else if (options.length > 1) {
        setEntries((prev) => [...prev, { id: idRef.current++, input: value, lines: [options.join('   ')] }]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTerminal(false);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <div
      className={`term${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Terminal"
      inert={!open}
      aria-hidden={!open}
    >
      <div className="term__bar mono">
        <span className="dot dot--ok" aria-hidden="true" />
        <span>terminal — {PROMPT_USER}</span>
        <span className="term__bar-hint">Ctrl + `</span>
        <button className="term__close" onClick={() => setTerminal(false)} aria-label="Close terminal">
          <X size={14} />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="term__body mono"
        role="presentation"
        onMouseUp={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus();
        }}
      >
        <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Terminal output">
          {entries.map((entry) => (
            <div key={entry.id} className="term__entry">
              {entry.input !== undefined && (
                <div className="term__line">
                  <Prompt />
                  <span className="sr-only">Command: </span>
                  {entry.input}
                </div>
              )}
              {entry.lines.map(renderLine)}
            </div>
          ))}
        </div>
        <div className="term__input-row">
          <Prompt />
          <label htmlFor="term-input" className="sr-only">
            Terminal command
          </label>
          <input
            id="term-input"
            ref={inputRef}
            className="term__input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCursor(null);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
          />
        </div>
      </div>
    </div>
  );
}
