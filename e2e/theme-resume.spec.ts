import { expect, test, windowNamed } from './fixtures';

test.describe('theme', () => {
  test('toggle switches the theme and persists across reloads', async ({ page, os }) => {
    await os.visit();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f4f5f7');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(244, 245, 247)');
  });

  test('saved theme is applied before first paint (no flash)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('neeravos.theme', 'light');
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          (window as unknown as { __t: string }).__t = document.documentElement.dataset.theme ?? '';
        }
      });
    });
    await page.goto('./');
    expect(await page.evaluate(() => (window as unknown as { __t: string }).__t)).toBe('light');
  });

  test('"system" follows the OS colour scheme', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('neeravos.theme', 'system'));
    await page.goto('http://localhost:4173/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await context.close();
  });

  test('palette and terminal can change the theme', async ({ page, os }) => {
    await os.visit();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('light theme');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.keyboard.press('Control+Backquote');
    const input = page.getByLabel('Terminal command');
    await input.fill('theme dark');
    await input.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('resume', () => {
  test('the PDF is served and the download link is set up', async ({ page, os, request }) => {
    await os.visit('#/recruiter');
    const link = page.getByRole('link', { name: /download resume/i });
    await expect(link).toHaveAttribute('download', /\.pdf$/);
    const res = await request.get(new URL((await link.getAttribute('href'))!, page.url()).href);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('pdf');
  });

  test('recruiter Preview opens a modal; Esc closes it', async ({ page, os }) => {
    await os.visit('#/recruiter');
    await page.getByRole('button', { name: /preview/i }).click();
    const dialog = page.getByRole('dialog', { name: /resume/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('iframe')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('desktop Preview opens the Resume window', async ({ page, os }) => {
    await os.visit();
    await page
      .locator('.identity')
      .getByRole('button', { name: /preview/i })
      .click();
    await expect(windowNamed(page, /resume\.pdf/)).toBeVisible();
  });

  test('without an inline PDF viewer, pdf.js renders the pages', async ({ page, os }) => {
    await os.visit('#/resume', { noPdfViewer: true });
    const canvas = page.locator('.pdf-canvas canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 15_000 });
    expect(await canvas.count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(/preview unavailable/i)).toHaveCount(0);
  });
});
