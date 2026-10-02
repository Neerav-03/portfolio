import { expect, test } from './fixtures';

test('first visit shows the full boot sequence, then the desktop', async ({ page }) => {
  await page.goto('./');
  const boot = page.getByRole('status', { name: /is starting/i });
  await expect(boot).toBeVisible();
  await expect(boot.getByText(/NEERAV OS/)).toBeVisible();
  for (const step of ['identity', 'education', 'experience', 'projects', 'engineering graph']) {
    await expect(boot.getByText(new RegExp(`Loading ${step}\\.+`))).toBeVisible();
  }
  await expect(boot.getByText('SYSTEM ONLINE')).toBeVisible();
  await expect(boot).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByRole('navigation', { name: 'Applications' })).toBeVisible();
});

test('Skip ends the boot immediately and is remembered', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^skip esc$/i }).click();
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('neeravos.booted'))).toBe('1');
});

test('Esc skips the boot', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0);
});

test('returning visitors get a short boot (< 1.5s)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neeravos.booted', '1'));
  await page.goto('./'); // resolves on load, so network time isn't counted
  const start = Date.now();
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0);
  expect(Date.now() - start).toBeLessThan(1500);
});

test('recruiter links skip the boot entirely', async ({ page }) => {
  await page.goto('./#/recruiter');
  await expect(page.getByRole('heading', { level: 1, name: 'Neerav Daswani' })).toBeVisible();
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0);
});

test('reduced motion: boot completes without animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0, { timeout: 2000 });
  await context.close();
});
