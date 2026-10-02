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
    // Feedback loop: line up under the block and jump; repeat if a bug knocks us off target.
    const unlocked = () => page.locator('.quest__facts li.is-on').count();
    for (let i = 0; i < 30 && (await unlocked()) === 0; i++) {
      const x = await px();
      if (x >= 106 && x <= 118) {
        await page.keyboard.down('Space');
        await page.waitForTimeout(380);
        await page.keyboard.up('Space');
        await page.waitForTimeout(250);
        continue;
      }
      const key = x < 106 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(key);
      await page.waitForTimeout(x < 70 || x > 150 ? 200 : 40);
      await page.keyboard.up(key);
      await page.waitForTimeout(90);
    }
    await expect(page.locator('.quest__facts li.is-on').first()).toContainText('Software Engineer');
  });

  test('after Play the world waits for the first key (bugs frozen)', async ({ page, os, isMobile }) => {
    test.skip(isMobile, 'tap covered by the phones test');
    await os.visit();
    const stage = page.getByRole('application', { name: /neerav quest/i });
    await stage.getByRole('button', { name: /^play$/i }).click();
    await expect(stage).toHaveClass(/is-waiting/);
    await page.waitForTimeout(700);
    await expect(stage).toHaveClass(/is-waiting/);
    await page.keyboard.press('KeyX');
    await expect(stage).not.toHaveClass(/is-waiting/);
    await expect(page.locator('.quest__ready')).toBeHidden();
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

test.describe('Neerav Quest: tutorial and sound', () => {
  test('desktop shows the move/jump tutorial; it goes away once learned', async ({ page, os, isMobile }) => {
    test.skip(isMobile, 'keyboard tutorial is desktop-only');
    await os.visit();
    const stage = page.getByRole('application', { name: /neerav quest/i });
    await stage.getByRole('button', { name: /^play$/i }).click();
    await expect(page.locator('.quest__ready')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/to move/)).toBeVisible();
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.up('ArrowRight');
    await expect(page.getByText(/to jump/)).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.locator('.quest__hint')).toHaveCount(0);
  });

  test('phones get no keyboard tutorial', async ({ page, os, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await os.visit();
    await page
      .getByRole('application', { name: /neerav quest/i })
      .getByRole('button', { name: /^play$/i })
      .click();
    await expect(page.locator('.quest__pad')).toBeVisible();
    await expect(page.locator('.quest__hint')).toHaveCount(0);
    // Waits for a tap; a control press starts the run.
    await expect(page.locator('.quest__ready', { hasText: 'Tap to start' })).toBeVisible();
    await page.locator('.quest__key').first().tap();
    await expect(page.locator('.quest__ready', { hasText: 'Tap to start' })).toBeHidden();
  });

  test('mute is remembered across visits', async ({ page, os }) => {
    await os.visit();
    const toggle = page.getByRole('button', { name: /game sound and haptics/i });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(page.getByRole('button', { name: /game sound and haptics/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
