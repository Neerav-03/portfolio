import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Automated WCAG 2.1 AA checks (axe-core) on every major view, in both themes. */
const VIEWS = [
  '',
  '#/recruiter',
  '#/experience/netradyne',
  '#/experience/drp',
  '#/experience/dal',
  '#/experience/encryption',
  '#/experience/exl',
  '#/projects/moviemate',
  '#/projects/doclink',
  '#/engineering',
  '#/code',
  '#/education',
  '#/about',
  '#/resume',
];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // The PDF viewer iframe is browser chrome, not our markup.
    .exclude('.resume-viewer__frame')
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`,
    );
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`${theme} theme`, () => {
    for (const view of VIEWS) {
      test(`no serious a11y violations: ${view || 'desktop'}`, async ({ page, os }) => {
        await os.visit(view, { theme });
        if (view && view !== '#/recruiter') await expect(page.getByRole('dialog').first()).toBeVisible();
        // Settle fonts, lazy chunks and entry animations so layout and colours are final.
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.waitForTimeout(400);
        expect(await scan(page)).toEqual([]);
      });
    }
  });
}

test('overlays: palette and terminal', async ({ page, os }) => {
  await os.visit();
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('re');
  expect(await scan(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+Backquote');
  await page.getByLabel('Terminal command').fill('help');
  await page.getByLabel('Terminal command').press('Enter');
  expect(await scan(page)).toEqual([]);
});
