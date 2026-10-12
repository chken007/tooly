import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // Clipboard-backed tests share the host clipboard.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: 'e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testMatch: 'e2e/**/*.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'json-workspace',
      testMatch: 'tests/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: 'BROWSER=none npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
});
