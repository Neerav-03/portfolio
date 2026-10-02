import { expect, test } from './fixtures';

// Runs on desktop and mobile projects.
test('recruiter view gives the 30-second summary', async ({ page, os }) => {
  await os.visit('#/recruiter');
  await expect(page.getByRole('heading', { level: 1, name: 'Neerav Daswani' })).toBeVisible();
  await expect(page.getByText('Software Engineer at Netradyne')).toBeVisible();
  for (const s of ['AWS', 'Java', 'C++', 'PostgreSQL']) {
    await expect(page.getByLabel('Core stack').getByText(s, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /download resume/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /preview/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /portrait of neerav daswani/i })).toBeVisible();
});

test('system desktop: identity, app menu with PLAY, the game and engineering modules', async ({ page, os }) => {
  await os.visit();
  await expect(page.getByRole('heading', { level: 1, name: 'Neerav Daswani' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Applications' }).getByRole('button', { name: 'PLAY' }),
  ).toBeVisible();
  await expect(page.getByRole('application', { name: /neerav quest/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineering modules' })).toBeVisible();
  await expect(page.getByText(/explore the netradyne systems/i)).toHaveCount(0);
});

test('page has no horizontal scroll', async ({ page, os }) => {
  for (const hash of ['', '#/recruiter']) {
    await os.visit(hash);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on "${hash || 'desktop'}"`).toBeLessThanOrEqual(0);
  }
});
