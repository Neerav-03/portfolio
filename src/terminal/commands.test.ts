import { describe, expect, it, vi } from 'vitest';
import { COMMAND_NAMES, complete, runCommand, type Line, type TermContext } from './commands';

const text = (lines: Line[] = []) =>
  lines.map((l) => (typeof l === 'string' ? l : l.map((s) => s.text).join(''))).join('\n');

function ctx(): TermContext & { [K in keyof TermContext]: TermContext[K] } {
  return {
    history: [],
    openApp: vi.fn(),
    setTerminal: vi.fn(),
    setMode: vi.fn(),
    previewResume: vi.fn(),
  };
}

describe('terminal commands', () => {
  it('help lists every documented command', () => {
    const out = text(runCommand('help', ctx()).lines);
    for (const name of [
      'about',
      'experience',
      'projects',
      'skills',
      'education',
      'achievements',
      'resume',
      'github',
      'contact',
      'theme',
      'clear',
    ]) {
      expect(out).toContain(name);
    }
    // Easter eggs stay hidden from help.
    expect(out).not.toMatch(/\bsudo\b/);
  });

  it('is case-insensitive and ignores surrounding whitespace', () => {
    expect(text(runCommand('  ABOUT  ', ctx()).lines)).toContain('Neerav Daswani');
  });

  it('empty input does nothing', () => {
    expect(runCommand('   ', ctx())).toEqual({});
  });

  it('unknown commands suggest help', () => {
    const out = text(runCommand('hepl', ctx()).lines);
    expect(out).toContain('command not found: hepl');
    expect(out).toMatch(/did you mean `help`|type `help`/);
  });

  it('clear asks the UI to clear', () => {
    expect(runCommand('clear', ctx()).clear).toBe(true);
  });

  it('prints resume facts', () => {
    expect(text(runCommand('education', ctx()).lines)).toContain('9.59');
    const ach = text(runCommand('achievements', ctx()).lines);
    expect(ach).toContain('1639');
    expect(ach).toContain('1853');
    expect(ach).toContain('AIR 3150');
  });

  it('sudo hire neerav grants permission; other sudo is refused', () => {
    expect(text(runCommand('sudo hire neerav', ctx()).lines)).toContain('Permission granted');
    expect(text(runCommand('sudo rm everything', ctx()).lines)).toContain('not in the sudoers file');
  });

  it('open routes apps and module aliases', () => {
    const c = ctx();
    runCommand('open drp', c).after?.();
    expect(c.openApp).toHaveBeenCalledWith('experience', { view: 'drp' });
    runCommand('open code', c).after?.();
    expect(c.openApp).toHaveBeenCalledWith('code', undefined);
    expect(text(runCommand('open nowhere', c).lines)).toContain('no such app');
  });

  it('resume opens the preview; --download prints the link', () => {
    const c = ctx();
    runCommand('resume', c).after?.();
    expect(c.previewResume).toHaveBeenCalled();
    expect(c.setTerminal).toHaveBeenCalledWith(false);
    const dl = runCommand('resume --download', ctx()).lines!;
    expect(JSON.stringify(dl)).toContain('.pdf');
  });

  it('theme validates its argument', () => {
    expect(text(runCommand('theme', ctx()).lines)).toContain('usage: theme');
    expect(text(runCommand('theme neon', ctx()).lines)).toContain("unknown option 'neon'");
    runCommand('theme light', ctx());
    expect(document.documentElement.dataset.theme).toBe('light');
    runCommand('theme dark', ctx());
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('history numbers previous commands', () => {
    const c = { ...ctx(), history: ['help', 'about'] };
    expect(text(runCommand('history', c).lines)).toMatch(/1\s+help[\s\S]*2\s+about/);
  });

  it('tab completion', () => {
    expect(complete('ex')).toEqual(expect.arrayContaining(['experience', 'exit']));
    expect(complete('')).toEqual([]);
    expect(complete('neo')).toEqual(['neofetch']);
    expect(new Set(COMMAND_NAMES).size).toBe(COMMAND_NAMES.length);
  });
});

describe('every terminal command', () => {
  // Every command (documented or easter egg) must run without throwing and produce output or an action.
  const samples: Record<string, string> = {
    open: 'open moviemate',
    cat: 'cat skills.txt',
    cd: 'cd projects',
    echo: 'echo hello',
    mode: 'mode recruiter',
    rm: 'rm -rf /',
    sudo: 'sudo hire neerav',
    theme: 'theme toggle',
  };

  it.each(COMMAND_NAMES)('%s', (name) => {
    const c = ctx();
    const result = runCommand(samples[name] ?? name, c);
    expect(result.lines?.length || result.after || result.clear || name === 'exit').toBeTruthy();
    expect(() => result.after?.()).not.toThrow();
  });

  it('covers the interesting branches of the easter eggs', () => {
    const c = ctx();
    expect(text(runCommand('cat .secrets', c).lines)).toContain('tenant-specific key');
    expect(text(runCommand('cat resume.pdf', c).lines)).toContain('binary file');
    expect(text(runCommand('cat nope', c).lines)).toContain('No such file');
    expect(text(runCommand('cat', c).lines)).toContain('usage: cat');
    expect(text(runCommand('sudo rm -rf /', c).lines)).toContain('refusing to delete /');
    expect(text(runCommand('rm notes.txt', c).lines)).toContain('read-only');
    expect(text(runCommand('mode nope', c).lines)).toContain('usage: mode');
    runCommand('mode system', c).after?.();
    expect(c.setMode).toHaveBeenCalledWith('system');
    runCommand('karate', c).after?.();
    expect(c.openApp).toHaveBeenCalledWith('about', { view: 'karate' });
    runCommand('exit', c).after?.();
    expect(c.setTerminal).toHaveBeenCalledWith(false);
    expect(text(runCommand('history', ctx()).lines)).toContain('no history yet');
    expect(text(runCommand('theme system', c).lines)).toContain('theme → system');
  });
});
