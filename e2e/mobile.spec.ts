import { expect, test } from './fixtures';

// Runs only in the "mobile" project (Pixel 7 emulation); see playwright.config.ts.
test('desktop becomes a dashboard with bottom navigation', async ({ page, os }) => {
  await os.visit();
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav).toBeVisible();
  for (const item of ['Home', 'Experience', 'Projects', 'Search', 'Terminal']) {
    await expect(nav.getByRole('button', { name: item })).toBeVisible();
  }
  await expect(page.getByRole('navigation', { name: 'Dock' })).toHaveCount(0);
});

test('apps open as full-screen panels with a back button', async ({ page, os }) => {
  await os.visit();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Experience' }).click();
  const panel = page.getByRole('dialog', { name: /experience\.app/ });
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(panel).toHaveCount(0);
});

test('architecture diagrams scroll horizontally inside their frame, not the page', async ({ page, os }) => {
  await os.visit('#/experience/drp');
  await expect(page.getByRole('heading', { name: 'Data Retention Policy' })).toBeVisible();
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageOverflow).toBeLessThanOrEqual(0);
});

test('terminal is usable on mobile', async ({ page, os }) => {
  await os.visit();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Terminal' }).click();
  const input = page.getByLabel('Terminal command');
  await input.fill('whoami');
  await input.press('Enter');
  await expect(page.getByRole('log')).toContainText('guest');
  await page.getByRole('button', { name: 'Close terminal' }).click();
  await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeHidden();
});

test('search opens the command palette', async ({ page, os }) => {
  await os.visit();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('combobox', { name: /search commands/i })).toBeVisible();
});
