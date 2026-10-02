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
