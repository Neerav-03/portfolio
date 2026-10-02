import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OSProvider } from '../os/OSContext';
import { questFacts } from './facts';
import { launchQuest } from './launch';
import Quest from './Quest';

const renderQuest = () =>
  render(
    <OSProvider>
      <Quest />
    </OSProvider>,
  );
const stage = () => screen.getByRole('application', { name: /neerav quest/i });

describe('Neerav Quest', () => {
  it('starts on a title screen with every fact available to screen readers', () => {
    renderQuest();
    expect(screen.getByText('NEERAV QUEST')).toBeInTheDocument();
    // The title screen is just the name and Play; instructions come after Play.
    const title = screen.getByText('NEERAV QUEST').parentElement as HTMLElement;
    expect(within(title).getByRole('button')).toHaveTextContent(/^play$/i);
    expect(title.querySelectorAll('p')).toHaveLength(1);
    const list = screen.getByRole('list', { name: /facts unlocked/i });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(questFacts().length);
    for (const f of questFacts()) expect(list).toHaveTextContent(f.label);
  });

  it('Play starts the game, Esc pauses, Resume continues', async () => {
    const user = userEvent.setup();
    renderQuest();
    await user.click(screen.getByRole('button', { name: /^play$/i }));
    expect(stage()).toHaveClass('is-playing');
    expect(stage()).toHaveFocus();
    fireEvent.keyDown(stage(), { key: 'Escape' });
    expect(stage()).toHaveClass('is-paused');
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(stage()).toHaveClass('is-playing');
  });

  it('Enter on the focused stage starts it; focus leaving pauses it', () => {
    renderQuest();
    stage().focus();
    fireEvent.keyDown(stage(), { key: 'Enter' });
    expect(stage()).toHaveClass('is-playing');
    fireEvent.focusOut(stage(), { relatedTarget: document.body });
    expect(stage()).toHaveClass('is-paused');
  });

  it('starts when launched from elsewhere (PLAY icon, terminal, palette)', () => {
    renderQuest();
    act(() => launchQuest());
    expect(stage()).toHaveClass('is-playing');
  });
});

describe('Neerav Quest: waiting for the first key', () => {
  it('Play shows a ready prompt; nothing starts until a key that is not pause or mute', async () => {
    const user = userEvent.setup();
    renderQuest();
    await user.click(screen.getByRole('button', { name: /^play$/i }));
    expect(stage()).toHaveClass('is-playing', 'is-waiting');
    expect(screen.getByText('Press any key to start')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/press any key to start/i);
    // The tutorial waits too.
    expect(screen.queryByText(/to move/)).not.toBeInTheDocument();

    // Mute, focus moves and bare modifiers don't start the run.
    for (const key of ['m', 'Tab', 'Shift']) fireEvent.keyDown(stage(), { key });
    expect(stage()).toHaveClass('is-waiting');

    // Pausing and resuming keeps waiting.
    fireEvent.keyDown(stage(), { key: 'Escape' });
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(stage()).toHaveClass('is-waiting');

    fireEvent.keyDown(stage(), { key: 'x' });
    expect(stage()).not.toHaveClass('is-waiting');
    expect(screen.queryByText('Press any key to start')).not.toBeInTheDocument();
  });

  it('a click or tap on the game starts the run', async () => {
    const user = userEvent.setup();
    renderQuest();
    await user.click(screen.getByRole('button', { name: /^play$/i }));
    expect(stage()).toHaveClass('is-waiting');
    fireEvent.pointerDown(stage());
    expect(stage()).not.toHaveClass('is-waiting');
  });
});

describe('Neerav Quest: tutorial, sound toggle', () => {
  it('desktop: the hint chip teaches moving, then jumping, then disappears', () => {
    renderQuest();
    fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
    fireEvent.keyDown(stage(), { key: 'Enter' });
    expect(screen.getByText(/to move/)).toBeInTheDocument();
    fireEvent.keyDown(stage(), { key: 'ArrowRight' });
    fireEvent.keyUp(stage(), { key: 'ArrowRight' });
    expect(screen.queryByText(/to move/)).not.toBeInTheDocument();
    expect(screen.getByText(/to jump/)).toBeInTheDocument();
    fireEvent.keyDown(stage(), { key: ' ' });
    fireEvent.keyUp(stage(), { key: ' ' });
    expect(screen.queryByText(/to jump/)).not.toBeInTheDocument();
  });

  it('sound toggle flips, persists, and M mutes while playing without pausing', () => {
    renderQuest();
    const toggle = screen.getByRole('button', { name: /game sound and haptics/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('neeravos.sound')).toBe('off');

    fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
    fireEvent.keyDown(stage(), { key: 'm' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(stage()).toHaveClass('is-playing');

    // Focus moving to the game's own controls doesn't pause.
    fireEvent.focusOut(stage(), { relatedTarget: toggle });
    expect(stage()).toHaveClass('is-playing');
  });
});
