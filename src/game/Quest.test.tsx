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

describe('Neerav Quest: tutorial, sound toggle', () => {
  it('desktop: the hint chip teaches moving, then jumping, then disappears', () => {
    renderQuest();
    fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
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
