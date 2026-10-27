import { defineConfig } from '@playwright/test';

const PORT = 3100;
const ISOLATED_PORT = 3101;
const A3C_PORT = 3102;
// Chromium : par défaut celui installé par `npx playwright install chromium` (poste de T. SOEFOU). Dans un bac à sable où il est
// préinstallé ailleurs, définir PW_CHROMIUM_PATH (ex. /opt/pw-browsers/chromium).
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}` },
  // Deux serveurs : le second est réservé aux tests d'annulation (D159), dont le résultat dépend de l'absence de toute autre
  // écriture. Il n'est utilisé que par un seul fichier, donc aucune écriture concurrente ne peut l'invalider.
  webServer: [
    ...[PORT, ISOLATED_PORT].map((port) => ({
      command: `NEXT_TELEMETRY_DISABLED=1 DEMO_LOGIN_MIN_MS=50 npx next start -p ${port}`,
      url: `http://localhost:${port}/fr`,
      reuseExistingServer: true,
      timeout: 60_000,
    })),
    // Lot A3c : un serveur neuf par lancement (jamais réutilisé). Les parcours de validation, d'escalade et de délégation écrivent,
    // chacun sur son propre besoin, dans l'ordre du fichier : un serveur déjà utilisé fausserait l'état de départ, donc le lancement échoue.
    {
      command: `NEXT_TELEMETRY_DISABLED=1 DEMO_LOGIN_MIN_MS=50 npx next start -p ${A3C_PORT}`,
      url: `http://localhost:${A3C_PORT}/fr`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'chromium', testIgnore: /(undo-isolated|a3c-isolated)/, use: { browserName: 'chromium', launchOptions } },
    {
      name: 'isolated', testMatch: /undo-isolated/,
      use: { browserName: 'chromium', baseURL: `http://localhost:${ISOLATED_PORT}`, launchOptions },
    },
    {
      name: 'a3c', testMatch: /a3c-isolated/,
      use: { browserName: 'chromium', baseURL: `http://localhost:${A3C_PORT}`, launchOptions },
    },
  ],
});
