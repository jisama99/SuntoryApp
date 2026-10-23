import type { BrowserContext, Locator, Page } from '@playwright/test';

export const PROFILES = [
  'direction_client',
  'dr_client',
  'cvr_client',
  'rs',
  'agency_operator',
  'agency_admin',
  'provider_admin',
] as const;
export const LOCALES = ['fr', 'en'] as const;

export async function setProfile(context: BrowserContext, id: string) {
  await context.addCookies([
    { name: 'demo_profile_simule', value: `sim.${id}`, url: 'http://localhost:3100' },
  ]);
}

/** Enregistre les requêtes hors serveur local et les erreurs de console. */
export function watch(page: Page) {
  const external: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    if (new URL(u).origin !== 'http://localhost:3100') external.push(u);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  return { external, consoleErrors };
}

export const EXPECTED_MENU: Record<string, string[]> = {
  direction_client: ['home', 'dashboard', 'needs', 'proposals', 'budget', 'alerts'],
  dr_client: ['home', 'dashboard', 'needs', 'proposals', 'budget', 'alerts'],
  cvr_client: ['home', 'dashboard', 'needs', 'proposals', 'alerts'],
  rs: ['home', 'needs', 'proposals', 'field', 'alerts'],
  agency_operator: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts'],
  agency_admin: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts', 'settings'],
  provider_admin: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts', 'settings', 'admin'],
};

/** Ouvre un calendrier déjà affiché et clique le jour demandé, en changeant de mois au besoin. */
export async function pickDay(page: Page, dialog: Locator, date: string) {
  const cell = dialog.locator(`[data-date="${date}"]`);
  for (let i = 0; i < 24 && (await cell.count()) === 0; i++) {
    const [y, m] = date.split('-').map(Number);
    const first = await dialog.locator('[data-date]').first().getAttribute('data-date');
    const later = new Date(Date.UTC(y!, m! - 1, 1)).getTime() > new Date(`${first}T00:00:00Z`).getTime();
    await page.getByRole('button', { name: later ? /Mois suivant|Next month/ : /Mois précédent|Previous month/ }).click();
  }
  await cell.click();
}

export async function pickRange(page: Page, id: string, start: string, end: string) {
  await page.locator(`#${id}`).click();
  const dialog = page.getByRole('dialog');
  await pickDay(page, dialog, start);
  await pickDay(page, dialog, end);
}
