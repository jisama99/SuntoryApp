import { defineConfig } from '@playwright/test';

const PORT = 3100;
const ISOLATED_PORT = 3101;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}` },
  // Deux serveurs : le second est réservé aux tests d'annulation (D159), dont le résultat dépend de l'absence de toute autre
  // écriture. Il n'est utilisé que par un seul fichier, donc aucune écriture concurrente ne peut l'invalider.
  webServer: [PORT, ISOLATED_PORT].map((port) => ({
    command: `NEXT_TELEMETRY_DISABLED=1 DEMO_LOGIN_MIN_MS=50 npx next start -p ${port}`,
    url: `http://localhost:${port}/fr`,
    reuseExistingServer: true,
    timeout: 60_000,
  })),
  projects: [
    { name: 'chromium', testIgnore: /undo-isolated/, use: { browserName: 'chromium', launchOptions: { executablePath: '/opt/pw-browsers/chromium' } } },
    {
      name: 'isolated', testMatch: /undo-isolated/,
      use: { browserName: 'chromium', baseURL: `http://localhost:${ISOLATED_PORT}`, launchOptions: { executablePath: '/opt/pw-browsers/chromium' } },
    },
  ],
});
