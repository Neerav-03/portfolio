import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { OSProvider } from './os/OSContext';
import { mediaState } from './test/setup';

function renderApp(hash = '') {
  window.history.replaceState(null, '', `/${hash}`);
  // Reduced motion keeps the boot sequence short and deterministic.
  mediaState.reducedMotion = true;
  const user = userEvent.setup();
  render(
    <OSProvider>
      <App />
    </OSProvider>,
  );
  return user;
}

const bootFinished = () =>
  waitFor(() => expect(screen.queryByRole('status', { name: /is starting/i })).not.toBeInTheDocument());

describe('recruiter mode', () => {
  it('shows the 30-second summary', () => {
    renderApp('#/recruiter');
    expect(screen.getByRole('heading', { level: 1, name: 'Neerav Daswani' })).toBeInTheDocument();
    expect(screen.getAllByText(/Netradyne/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IIT \(BHU\)/).length).toBeGreaterThan(0);
    const stack = screen.getByLabelText('Core stack');
    for (const s of ['AWS', 'Java', 'C++', 'PostgreSQL']) expect(within(stack).getByText(s)).toBeInTheDocument();
    for (const name of ['Experience', 'Projects', 'Skills', 'Achievements', 'Education']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    const download = screen.getByRole('link', { name: /download resume/i });
    expect(download).toHaveAttribute('download');
    expect(download.getAttribute('href')).toMatch(/\.pdf$/);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/Neerav-03');
    expect(screen.getByRole('img', { name: /portrait of neerav daswani/i })).toBeInTheDocument();
  });

  it('previews the resume in a modal; Esc closes it and returns focus', async () => {
    const user = renderApp('#/recruiter');
    const preview = screen.getByRole('button', { name: /preview/i });
    await user.click(preview);
    const dialog = await screen.findByRole('dialog', { name: /resume/i });
    expect(within(dialog).getByTitle(/resume \(pdf\)/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /close resume preview/i })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /resume/i })).not.toBeInTheDocument());
    expect(preview).toHaveFocus();
  });
});

describe('system mode', () => {
  it('boots to the desktop and opens apps from desktop icons', async () => {
    const user = renderApp();
    await bootFinished();
    await user.click(screen.getByRole('button', { name: 'EXPERIENCE' }));
    const win = await screen.findByRole('dialog', { name: /experience\.app/ });
    expect(await within(win).findByRole('heading', { name: 'Software Engineer' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/experience/netradyne'));
  });

  it('honours deep links after boot', async () => {
    renderApp('#/experience/drp');
    await bootFinished();
    expect(await screen.findByRole('heading', { name: 'Data Retention Policy' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/experience/drp');
  });

  it('Esc closes the focused window', async () => {
    const user = renderApp('#/code');
    await bootFinished();
    const win = await screen.findByRole('dialog', { name: /code\.cp/ });
    win.focus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /code\.cp/ })).not.toBeInTheDocument());
  });

  it('command palette: Ctrl+K, search, Enter', async () => {
    const user = renderApp();
    await bootFinished();
    await user.keyboard('{Control>}k{/Control}');
    const input = await screen.findByRole('combobox', { name: /search commands/i });
    expect(input).toHaveFocus();
    await user.type(input, 'dal');
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('DAL — GDPR Data Access Levels');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'GDPR Data Access Levels' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('terminal: Ctrl+` opens it and commands run', async () => {
    const user = renderApp();
    await bootFinished();
    await user.keyboard('{Control>}`{/Control}');
    const input = await screen.findByLabelText('Terminal command');
    await waitFor(() => expect(input).toHaveFocus());
    await user.type(input, 'help{Enter}');
    expect(screen.getByRole('log')).toHaveTextContent('Available commands');
    await user.type(input, 'sudo hire neerav{Enter}');
    expect(screen.getByRole('log')).toHaveTextContent('Permission granted');
  });

  it('theme toggle switches and persists the theme', async () => {
    const user = renderApp();
    await bootFinished();
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('neeravos.theme')).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('switches to recruiter mode and back', async () => {
    const user = renderApp();
    await bootFinished();
    await user.click(screen.getByRole('button', { name: /^recruiter/i }));
    expect(screen.getByRole('link', { name: /download resume/i })).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/recruiter'));
    await user.click(screen.getByRole('button', { name: /^system/i }));
    expect(await screen.findByRole('navigation', { name: 'Applications' })).toBeInTheDocument();
  });

  it('desktop Preview opens the Resume window', async () => {
    const user = renderApp();
    await bootFinished();
    await user.click(
      within(screen.getByRole('region', { name: /neerav daswani/i })).getByRole('button', { name: /preview/i }),
    );
    expect(await screen.findByRole('dialog', { name: /resume\.pdf/ })).toBeInTheDocument();
  });
});
