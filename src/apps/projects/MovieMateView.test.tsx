import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MovieMateView } from './MovieMateView';

describe('MovieMate TF-IDF demo', () => {
  it('recommends neighbours for the picked movie', async () => {
    const user = userEvent.setup();
    render(<MovieMateView />);
    await user.click(screen.getByRole('radio', { name: 'Gravity' }));
    const recs = within(screen.getByRole('list', { name: '' })).queryAllByRole('listitem');
    const list = recs.length ? recs : screen.getAllByRole('listitem');
    expect(list[0]).toHaveTextContent('The Martian');
    expect(list[0]).toHaveTextContent(/space|astronaut/);
  });
});
