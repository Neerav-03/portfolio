import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    // Locally reuse the installed Chrome; CI installs Playwright's Chromium.
    channel: CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: /mobile.spec.ts/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts|a11y\.spec\.ts|smoke\.spec\.ts/ },
  ],
  webServer: {
    // Test the production build exactly as it will be deployed.
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
