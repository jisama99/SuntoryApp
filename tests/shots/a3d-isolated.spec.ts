import { expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import path from 'node:path';
import { loginAs, pickRange, watch } from '../e2e/helpers';

/**
 * Captures du lot A3d (docs/captures/A3d) : qui saisit, pour qui, comment c'est tracé. Serveur dédié, neuf à chaque lancement
 * (playwright.config.ts). Phase 1 : saisie par chaque profil en français (écrit), phase 2 : états d'arrivée en anglais (lecture seule).
 * Chaque état est pris à 1440 puis 390 px en clair ; les écrans principaux le sont aussi en sombre.
 */
const OUT = path.join('docs', 'captures', 'A3d');
const SIZES = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }];
const BASE = 'http://localhost:3103';

test.describe.configure({ mode: 'serial' });

test('A3d : captures des rôles de saisie et de leur trace', async ({ page, context }) => {
  test.setTimeout(600_000);
  const watcher = watch(page);
  let locale: 'fr' | 'en' = 'fr';
  const as = (c: BrowserContext, username: string) => loginAs(c, username);

  const shot = async (name: string, dark = false) => {
    for (const theme of dark ? ['light', 'dark'] : ['light']) {
      await context.addCookies([{ name: 'demo_theme', value: theme, url: BASE }]);
      await page.reload();
      for (const w of SIZES) {
        await page.setViewportSize({ width: w.width, height: w.height });
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}_${theme}.png`), fullPage: true });
      }
    }
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: BASE }]);
    await page.setViewportSize({ width: 1440, height: 900 });
  };

  async function fill(start: string, end: string, sectorIndex?: number) {
    if (sectorIndex !== undefined) await page.selectOption('#f-sector', { index: sectorIndex });
    await page.selectOption('#f-dispositif', 'permanent');
    await page.selectOption('#f-campaign', 'CMP-DEMO-01');
    await page.selectOption('#f-position', 'Poste 6');
    await page.selectOption('#f-priority', '2');
    await page.selectOption('#f-hours', '14');
    await page.fill('#f-slot', '08:00-12:00');
    await pickRange(page, 'f-range-0', start, end);
    await page.getByRole('button', { name: 'Lun à ven' }).click();
    await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
  }
  async function save(): Promise<string> {
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const saved = page.getByTestId('saved');
    const confirm = page.getByTestId('confirm-actions');
    await expect(saved.or(confirm)).toBeVisible();
    if (await confirm.isVisible()) await confirm.getByRole('button').first().click();
    await expect(saved).toBeVisible();
    return /BES-DEMO-\d{3}/.exec((await saved.textContent()) ?? '')?.[0] ?? '';
  }
  const dossier = async (code: string) => {
    await page.goto(`/${locale}/proposals?filter=all`);
    await page.getByRole('link', { name: code, exact: true }).first().click();
    await expect(page.getByTestId('dimensions')).toBeVisible();
  };

  const made: Record<string, string> = {};
  const plans = [
    { key: 'cvr', user: 'DemoCVR01', start: '2027-03-08', end: '2027-03-14', sector: 1 },
    { key: 'dr', user: 'DemoDR01', start: '2027-03-22', end: '2027-03-28', sector: 3 },
    { key: 'direction', user: 'DemoDirection01', start: '2027-04-05', end: '2027-04-11', sector: 7 },
    { key: 'agency', user: 'DemoAgence01', start: '2027-04-19', end: '2027-04-25', sector: 4 },
  ] as const;

  // Phase 1 : saisie en français, un profil après l'autre.
  for (const p of plans) {
    await as(context, p.user);
    await page.goto('/fr/needs');
    await shot(`needs_list_${p.key}_before`);
    await page.goto('/fr/needs/new');
    await shot(`needs_new_${p.key}`, p.key === 'cvr');
    await fill(p.start, p.end, p.sector);
    made[p.key] = await save();
    await page.goto('/fr/needs');
    await shot(`needs_list_${p.key}_after`);
    await dossier(made[p.key]!);
    await shot(`dossier_${p.key}`, p.key === 'cvr' || p.key === 'agency');
  }
  await as(context, 'DemoPresta01');
  await page.goto('/fr/needs');
  await shot('needs_list_provider_read_only');

  // Phase 2 : états d'arrivée en anglais, lecture seule.
  locale = 'en';
  for (const p of plans) {
    await as(context, p.user);
    await page.goto('/en/needs/new');
    await shot(`needs_new_${p.key}`);
  }
  await as(context, 'DemoAgence01');
  await page.goto('/en/needs');
  await shot('needs_list_agency_after');
  for (const key of ['cvr', 'agency'] as const) {
    await dossier(made[key]!);
    await shot(`dossier_${key}`);
  }
  await as(context, 'DemoDR01');
  await dossier(made.cvr!);
  await shot('dossier_cvr_seen_by_dr');

  expect(watcher.consoleErrors).toEqual([]);
  expect(watcher.external).toEqual([]);
});
