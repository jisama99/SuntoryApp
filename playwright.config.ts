import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `NEXT_TELEMETRY_DISABLED=1 DEMO_LOGIN_MIN_MS=50 npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: '/opt/pw-browsers/chromium' } } }],
});
