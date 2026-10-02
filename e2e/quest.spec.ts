import { expect, test, windowNamed } from './fixtures';

// Runs on desktop and mobile.
test.describe('Neerav Quest', () => {
  test('plays from the title screen; Esc pauses; Resume continues', async ({ page, os }) => {
    await os.visit();
    const stage = page.getByRole('application', { name: /neerav quest/i });
    await stage.getByRole('button', { name: /^play$/i }).click();
    await expect(stage).toHaveClass(/is-playing/);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(stage).toHaveClass(/is-paused/);
    await stage.getByRole('button', { name: /resume/i }).click();
    await expect(stage).toHaveClass(/is-playing/);
  });

  test('hitting the first block unlocks a fact', async ({ page, os }) => {
    await os.visit();
    const stage = page.getByRole('application', { name: /neerav quest/i });
    await stage.focus();
    await page.keyboard.press('Enter');
    // The first { } block spans x 112–128. Walk most of the way, then tap toward the target so the test
    // doesn't depend on frame rate (CI machines can be slow).
    const px = () =>
      page.evaluate(() => Number(document.querySelector('.quest__stage')?.getAttribute('data-player-x') ?? 0));
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(
      () => Number(document.querySelector('.quest__stage')?.getAttribute('data-player-x')) >= 80,
    );
    await page.keyboard.up('ArrowRight');
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(120);
      const x = await px();
      if (x >= 106 && x <= 118) break;
      const key = x < 106 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(key);
      await page.waitForTimeout(40);
      await page.keyboard.up(key);
    }
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.locator('.quest__facts li.is-on').first()).toContainText('Software Engineer');
  });

  test('PLAY in the app menu starts the game', async ({ page, os }) => {
    await os.visit();
    await page.getByRole('navigation', { name: 'Applications' }).getByRole('button', { name: 'PLAY' }).click();
    await expect(page.getByRole('application', { name: /neerav quest/i })).toHaveClass(/is-playing/);
  });

  test('dock PLAY minimises open windows and starts the game', async ({ page, os, isMobile }) => {
    test.skip(isMobile, 'no dock on phones');
    await os.visit('#/education');
    await expect(windowNamed(page, /education\.sys/)).toBeVisible();
    await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: 'Play Neerav Quest' }).click();
    await expect(page.getByRole('application', { name: /neerav quest/i })).toHaveClass(/is-playing/);
    await expect(windowNamed(page, /education\.sys/)).toBeHidden();
  });

  test('terminal `play` starts the game', async ({ page, os, isMobile }) => {
    test.skip(isMobile, 'covered by the desktop project');
    await os.visit();
    await page.keyboard.press('Control+Backquote');
    const input = page.getByLabel('Terminal command');
    await input.fill('play');
    await input.press('Enter');
    await expect(page.getByRole('application', { name: /neerav quest/i })).toHaveClass(/is-playing/);
    await expect(page.getByRole('dialog', { name: 'Terminal' })).toBeHidden();
  });

  test('touch controls appear on phones while playing', async ({ page, os, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await os.visit();
    const stage = page.getByRole('application', { name: /neerav quest/i });
    await stage.getByRole('button', { name: /^play$/i }).click();
    await expect(page.locator('.quest__pad')).toBeVisible();
  });
});
