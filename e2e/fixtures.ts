import { expect, test as base, type Page } from '@playwright/test';

interface VisitOptions {
  theme?: 'light' | 'dark' | 'system';
  /** Pretend this is a returning visitor (short boot). Default true. */
  returning?: boolean;
  /** Simulate a browser without an inline PDF viewer (most Android phones). */
  noPdfViewer?: boolean;
}

export interface Helpers {
  /** Open a route with a known theme/visitor state and wait for the boot to finish. */
  visit: (hash?: string, opts?: VisitOptions) => Promise<void>;
  /** Console errors and uncaught exceptions collected so far. */
  errors: string[];
}

export const test = base.extend<{ os: Helpers }>({
  os: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });

    const visit: Helpers['visit'] = async (hash = '', opts = {}) => {
      const { theme = 'dark', returning = true, noPdfViewer = false } = opts;
      await page.addInitScript(
        ({ theme, returning, noPdfViewer }) => {
          try {
            if (!sessionStorage.getItem('e2e-seeded')) {
              localStorage.clear();
              localStorage.setItem('neeravos.theme', theme);
              if (returning) localStorage.setItem('neeravos.booted', '1');
              sessionStorage.setItem('e2e-seeded', '1');
            }
          } catch {
            /* storage blocked */
          }
          if (noPdfViewer) Object.defineProperty(Navigator.prototype, 'pdfViewerEnabled', { get: () => false });
        },
        { theme, returning, noPdfViewer },
      );
      await page.goto(`./${hash}`);
      await waitForBoot(page);
    };

    await use({ visit, errors });
    // Every test also asserts the page logged no errors.
    expect(errors, 'console errors / uncaught exceptions').toEqual([]);
  },
});

export async function waitForBoot(page: Page) {
  await expect(page.getByRole('status', { name: /is starting/i })).toHaveCount(0, { timeout: 10_000 });
}

export const windowNamed = (page: Page, name: RegExp) => page.getByRole('dialog', { name });

export { expect };
