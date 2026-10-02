import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DalModule } from './DalModule';
import { DrpModule } from './DrpModule';
import { EncryptionModule } from './EncryptionModule';

describe('DRP simulator', () => {
  it('offers the five bucket tiers', () => {
    render(<DrpModule />);
    const tiers = within(screen.getByRole('radiogroup', { name: /duration tier/i })).getAllByRole('radio');
    expect(tiers.map((t) => t.textContent)).toEqual(['62d', '93d', '124d', '217d', '403d']);
  });

  it('routes the object to the selected band', async () => {
    const user = userEvent.setup();
    render(<DrpModule />);
    await user.click(screen.getByRole('radio', { name: 'Tier 5, 403 days' }));
    expect(screen.getByRole('radio', { name: 'Tier 5, 403 days' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('lifecycle tag → tier 5')).toBeInTheDocument();
  });

  it('issues presigned URLs within retention and gates them after expiry', async () => {
    const user = userEvent.setup();
    render(<DrpModule />);
    await user.click(screen.getByRole('radio', { name: 'Tier 1, 62 days' }));
    const slider = screen.getByLabelText('Object age');

    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByText('day 31 of 62')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /request playback/i }));
    expect(screen.getByText(/presigned URL issued/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '120' } });
    await user.click(screen.getByRole('button', { name: /request playback/i }));
    expect(screen.getByText(/access gated, no presigned URL issued/)).toBeInTheDocument();
    expect(screen.getByText(/past retention/)).toBeInTheDocument();
  });

  it('switches between day-exact and month-rounded expiry', async () => {
    const user = userEvent.setup();
    render(<DrpModule />);
    await user.click(screen.getByRole('radio', { name: 'month-rounded' }));
    expect(screen.getByText('Expiry is computed at month granularity.')).toBeInTheDocument();
  });
});

describe('DAL console', () => {
  afterEach(() => vi.useRealTimers());

  it('applies a level through the enforcement path and audits it; rejects invalid config', async () => {
    vi.useFakeTimers();
    render(<DalModule />);
    fireEvent.click(screen.getByRole('radio', { name: /tenant-b.*level 3 of 4/i }));
    fireEvent.click(screen.getByRole('radio', { name: 'L4' }));
    fireEvent.click(screen.getByRole('button', { name: /apply config/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByText(/access level → L4 · applied to backend \+ device config/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /tenant-b.*level 4 of 4/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /push invalid config/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByText(/rejected by validation guard/)).toBeInTheDocument();
    expect(screen.getByText('guard · rejected')).toBeInTheDocument();
  });
});

describe('encryption migration', () => {
  it('toggles between before and after', async () => {
    const user = userEvent.setup();
    render(<EncryptionModule />);
    expect(screen.getByRole('group', { name: /after:/i })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'BEFORE' }));
    expect(screen.getByRole('group', { name: /before:/i })).toBeInTheDocument();
  });
});
