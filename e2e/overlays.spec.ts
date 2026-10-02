import { expect, test } from './fixtures';

test.describe('command palette', () => {
  test('Ctrl+K → search → Enter opens the module', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox', { name: /search commands/i });
    await expect(input).toBeFocused();
    await input.fill('drp');
    await expect(page.getByRole('option').first()).toContainText('DRP — Data Retention Policy');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Data Retention Policy' })).toBeVisible();
    await expect(input).toHaveCount(0);
  });

  test('arrow keys move the selection; Esc closes', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('code');
    const options = page.getByRole('option');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('combobox')).toHaveCount(0);
  });

  test('shows a helpful empty state', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('zzzzqqq');
    await expect(page.getByText(/no matches for/i)).toBeVisible();
  });
});

test.describe('terminal', () => {
  test('Ctrl+` toggles it and focuses the prompt', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+Backquote');
    const input = page.getByLabel('Terminal command');
    await expect(input).toBeFocused();
    await page.keyboard.press('Control+Backquote');
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeHidden();
  });

  test('help, easter egg, history and tab completion', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+Backquote');
    const input = page.getByLabel('Terminal command');
    const log = page.getByRole('log', { name: 'Terminal output' });
    await input.fill('help');
    await input.press('Enter');
    await expect(log).toContainText('Available commands');
    await input.fill('sudo hire neerav');
    await input.press('Enter');
    await expect(log).toContainText('Permission granted');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('sudo hire neerav');
    await input.fill('neof');
    await input.press('Tab');
    await expect(input).toHaveValue('neofetch ');
  });

  test('`open dal` launches the module and closes the terminal', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+Backquote');
    const input = page.getByLabel('Terminal command');
    await input.fill('open dal');
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'GDPR Data Access Levels' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeHidden();
  });
});
