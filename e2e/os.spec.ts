import type { Locator } from '@playwright/test';
import { expect, test, windowNamed } from './fixtures';

/** Range inputs can't be fill()-ed; set the value the way a drag would. */
async function setRange(slider: Locator, value: number) {
  await slider.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.describe('window manager', () => {
  test('desktop icon opens a window and updates the URL', async ({ page, os }) => {
    await os.visit();
    await page.getByRole('button', { name: 'EXPERIENCE', exact: true }).click();
    const win = windowNamed(page, /experience\.app/);
    await expect(win).toBeVisible();
    await expect(win.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
    await expect(page).toHaveURL(/#\/experience\/netradyne$/);
  });

  test('deep links open the right module and survive reload', async ({ page, os }) => {
    await os.visit('#/experience/dal');
    await expect(page.getByRole('heading', { name: 'GDPR Data Access Levels' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'GDPR Data Access Levels' })).toBeVisible();
    await expect(page).toHaveURL(/#\/experience\/dal$/);
  });

  test('module cards zoom in; breadcrumb zooms back out', async ({ page, os }) => {
    await os.visit('#/experience/netradyne');
    const win = windowNamed(page, /experience.app/);
    await win.getByRole('button', { name: /data retention policy/i }).click();
    await expect(page.getByRole('heading', { name: 'Data Retention Policy' })).toBeVisible();
    await expect(page).toHaveURL(/#\/experience\/drp$/);
    await page.getByRole('button', { name: 'Netradyne', exact: true }).click();
    await expect(page.getByRole('heading', { name: /system map/i })).toBeVisible();
  });

  test('windows can be dragged by the title bar', async ({ page, os }) => {
    await os.visit('#/education');
    const win = windowNamed(page, /education\.sys/);
    const before = (await win.boundingBox())!;
    const bar = win.locator('.win__bar');
    const barBox = (await bar.boundingBox())!;
    await page.mouse.move(barBox.x + barBox.width * 0.75, barBox.y + barBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(barBox.x + barBox.width * 0.75 - 120, barBox.y + 90, { steps: 8 });
    await page.mouse.up();
    const after = (await win.boundingBox())!;
    expect(after.x - before.x).toBeCloseTo(-120, 0);
    expect(after.y - before.y).toBeCloseTo(90 - barBox.height / 2, 0);
  });

  test('maximize, minimize to dock, restore from dock, close', async ({ page, os }) => {
    await os.visit('#/code');
    const win = windowNamed(page, /code\.cp/);
    await page.getByRole('button', { name: 'Maximize Code' }).click();
    const vp = page.viewportSize()!;
    expect((await win.boundingBox())!.width).toBeGreaterThan(vp.width - 40);

    await page.getByRole('button', { name: 'Minimize Code' }).click();
    await expect(win).toBeHidden();
    await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: /^Code/ }).click();
    await expect(win).toBeVisible();

    await page.getByRole('button', { name: 'Close Code' }).click();
    await expect(win).toHaveCount(0);
  });

  test('Esc closes the focused window', async ({ page, os }) => {
    await os.visit('#/about');
    const win = windowNamed(page, /about\.md/);
    await win.click({ position: { x: 300, y: 300 } });
    await page.keyboard.press('Escape');
    await expect(win).toHaveCount(0);
  });

  test('clicking a background window brings it to the front', async ({ page, os }) => {
    await os.visit('#/education');
    await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: /^Code/ }).click();
    const edu = windowNamed(page, /education\.sys/);
    const code = windowNamed(page, /code\.cp/);
    const z = async (l: typeof edu) => Number(await l.evaluate((el) => getComputedStyle(el).zIndex));
    expect(await z(code)).toBeGreaterThan(await z(edu));
    await edu.locator('.win__bar').click({ position: { x: 20, y: 15 } });
    expect(await z(edu)).toBeGreaterThan(await z(code));
  });
});

test.describe('interactive modules', () => {
  test('DRP: tier + age drive the presigned-URL gate', async ({ page, os }) => {
    await os.visit('#/experience/drp');
    await page.getByRole('radio', { name: 'Tier 1, 62 days' }).click();
    await setRange(page.getByLabel('Object age'), 120);
    await page.getByRole('button', { name: /request playback/i }).click();
    await expect(page.getByText(/access gated, no presigned URL issued/)).toBeVisible();
    await expect(page.locator('.drp-age__value')).toHaveText('day 74 of 62');
  });

  test('DAL: apply and invalid config land in the audit log', async ({ page, os }) => {
    await os.visit('#/experience/dal');
    await page.getByRole('button', { name: /apply config/i }).click();
    await expect(page.getByText(/applied to backend \+ device config/)).toBeVisible();
    await page.getByRole('button', { name: /push invalid config/i }).click();
    await expect(page.getByText(/rejected by validation guard/)).toBeVisible();
  });

  test('EXL dashboard tabs switch views', async ({ page, os }) => {
    await os.visit('#/experience/exl');
    for (const tab of ['Sales', 'Price', 'Elasticity', 'Overview']) {
      await page.getByRole('tab', { name: tab }).click();
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    }
    await expect(page.getByText(/ILLUSTRATIVE · synthetic data/)).toBeVisible();
  });

  test('MovieMate demo recommends live', async ({ page, os }) => {
    await os.visit('#/projects/moviemate');
    await page.getByRole('radio', { name: 'The Dark Knight' }).click();
    await expect(page.locator('.pj-rec').first()).toContainText('Batman Begins');
  });

  test('About: hidden modules load', async ({ page, os }) => {
    await os.visit('#/about');
    for (const id of ['aptiquest', 'admad', 'karate']) {
      await page.getByRole('button', { name: `$ modprobe ${id}` }).click();
    }
    await expect(page.getByText('3/3 loaded')).toBeVisible();
  });
});
