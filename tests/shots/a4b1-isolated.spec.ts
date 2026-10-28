import { expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import path from 'node:path';
import { loginAs, pickRange, watch } from '../e2e/helpers';

/**
 * Captures du lot A4b1 (docs/captures/A4b1) : enveloppe cliente, allocation de l'agence, prévisionnel par besoin. Serveur dédié,
 * neuf à chaque lancement (playwright.config.ts). Phase 1 : états de départ en français, puis les écritures (nouvelle version,
 * nouvelle ligne, besoin au-delà du disponible) et leurs états d'arrivée. Phase 2 : les mêmes écrans en anglais.
 * Chaque état est pris à 1440 puis 390 px en clair ; les écrans principaux le sont aussi en sombre.
 */
const OUT = path.join('docs', 'captures', 'A4b1');
const SIZES = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }];
const BASE = 'http://localhost:3104';

test.describe.configure({ mode: 'serial' });

test('A4b1 : captures de la chaîne budgétaire', async ({ page, context }) => {
  test.setTimeout(600_000);
  const watcher = watch(page);
  let locale: 'fr' | 'en' = 'fr';
  const as = (c: BrowserContext, username: string) => loginAs(c, username);

  const shot = async (name: string, dark = false, reload = true) => {
    for (const theme of dark ? ['light', 'dark'] : ['light']) {
      await context.addCookies([{ name: 'demo_theme', value: theme, url: BASE }]);
      // Sans rechargement, l'état de l'écran (message de refus, formulaire rempli) reste visible sur la capture.
      if (reload) await page.reload();
      for (const w of SIZES) {
        await page.setViewportSize({ width: w.width, height: w.height });
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}_${theme}.png`), fullPage: true });
      }
    }
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: BASE }]);
    await page.setViewportSize({ width: 1440, height: 900 });
  };
  const view = async (url: string, name: string, dark = false) => {
    await page.goto(`/${locale}${url}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await shot(name, dark);
  };

  // ---- Phase 1 : français, états de départ ----
  await as(context, 'DemoDirection01');
  await view('/budget', 'situation_direction', true);
  await view('/budget/envelope', 'envelope_direction');
  await view('/budget/journal', 'journal_direction');
  await as(context, 'DemoDR01');
  await view('/budget', 'situation_dr');
  await as(context, 'DemoAgence01');
  await view('/budget', 'situation_agency', true);
  await view('/budget?by=cvr', 'situation_agency_par_cvr');
  await view('/budget/envelope', 'envelope_agency_lecture');
  await view('/budget/allocation', 'allocation_agency', true);
  await view('/budget/needs', 'needs_agency');
  await view('/budget/needs?filter=beyond', 'needs_agency_au_dela');
  await view('/budget/journal', 'journal_agency');
  await view('/alerts', 'alerts_agency');
  await as(context, 'DemoPresta01');
  await view('/budget/allocation', 'allocation_provider_lecture_seule');

  // ---- Écritures : nouvelle version d'enveloppe, nouvelle ligne, puis un besoin au-delà du disponible ----
  await as(context, 'DemoDirection01');
  await page.goto('/fr/budget/envelope');
  await page.getByLabel('Montant (euros hors taxes)').fill('120 000');
  await page.getByLabel('Motif de la nouvelle version').fill('Rallonge validée en comité.');
  await page.getByRole('button', { name: 'Enregistrer la version' }).click();
  await expect(page.getByTestId('envelope-versions').locator('tbody tr')).toHaveCount(2);
  await shot('envelope_direction_deux_versions');

  await as(context, 'DemoAgence01');
  await page.goto('/fr/budget/allocation');
  const uh = await page.locator('#allocation-cvr option', { hasText: 'CVR-UH06' }).first().getAttribute('value');
  await page.getByLabel('Campagne').selectOption('CMP-DEMO-02');
  await page.getByLabel('CVR').selectOption(uh!);
  await page.getByLabel('Montant réparti (euros hors taxes)').fill('999 999');
  await page.getByRole('button', { name: 'Enregistrer la ligne' }).click();
  await expect(page.getByTestId('allocation-result')).toContainText('dépasserait l\'enveloppe');
  await shot('allocation_refus_depassement', false, false);
  await page.goto('/fr/budget/allocation');
  await page.getByLabel('Campagne').selectOption('CMP-DEMO-02');
  await page.getByLabel('CVR').selectOption(uh!);
  await page.getByLabel('Montant réparti (euros hors taxes)').fill('4 000');
  await page.getByRole('button', { name: 'Enregistrer la ligne' }).click();
  await expect(page.getByTestId('allocation-lines').locator('tbody tr')).toHaveCount(19);
  await shot('allocation_apres_ajout');

  await page.goto('/fr/needs/new');
  await page.selectOption('#f-sector', await page.locator('#f-sector option', { hasText: 'Nord-Test 3' }).first().getAttribute('value') as string);
  await page.selectOption('#f-dispositif', 'permanent');
  await page.selectOption('#f-campaign', 'CMP-DEMO-01');
  await page.selectOption('#f-position', 'Poste 6');
  await page.selectOption('#f-priority', '2');
  await page.selectOption('#f-hours', '14');
  await page.fill('#f-slot', '08:00-12:00');
  await pickRange(page, 'f-range-0', '2027-03-08', '2027-04-30');
  await page.getByRole('button', { name: 'Lun à ven' }).click();
  await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
  await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
  const saved = page.getByTestId('saved');
  const confirm = page.getByTestId('confirm-actions');
  await expect(saved.or(confirm)).toBeVisible();
  if (await confirm.isVisible()) await confirm.getByRole('button').first().click();
  await expect(saved).toBeVisible();

  await view('/budget', 'situation_agency_apres_depassement', true);
  await view('/budget/needs?filter=beyond', 'needs_agency_apres_depassement');
  await view('/budget/journal', 'journal_agency_apres_depassement');
  await view('/alerts', 'alerts_agency_apres_depassement');
  await as(context, 'DemoDirection01');
  await view('/alerts', 'alerts_direction_apres_depassement');
  await view('/budget/journal', 'journal_direction_apres_depassement');

  // ---- Phase 2 : anglais ----
  locale = 'en';
  await view('/budget', 'situation_direction');
  await view('/budget/envelope', 'envelope_direction');
  await as(context, 'DemoAgence01');
  await view('/budget', 'situation_agency');
  await view('/budget/allocation', 'allocation_agency');
  await view('/budget/needs', 'needs_agency');
  await view('/budget/journal', 'journal_agency');
  await view('/alerts', 'alerts_agency');

  expect(watcher.consoleErrors).toEqual([]);
  expect(watcher.external).toEqual([]);
});
