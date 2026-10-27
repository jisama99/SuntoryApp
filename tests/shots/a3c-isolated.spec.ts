import { expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import path from 'node:path';
import { loginAs, pickRange, setProfile, watch } from '../e2e/helpers';

/**
 * Captures du lot A3c (docs/captures/A3c). Serveur dédié et neuf à chaque lancement (playwright.config.ts). Trois phases dans un seul
 * test, car chaque scénario écrit sur son besoin : (1) états de départ en lecture seule, formulaires remplis sans envoi, FR puis EN ;
 * (2) parcours complets en français, qui écrivent ; (3) états d'arrivée en anglais, en lecture seule. Chaque état est pris à 1440 puis
 * à 390 px, sur la même page.
 */
const OUT = path.join('docs', 'captures', 'A3c');
const DESKTOP = { name: '1440', width: 1440, height: 900 };
const MOBILE = { name: '390', width: 390, height: 844 };

test.describe.configure({ mode: 'serial' });

const as = (context: BrowserContext, username: string) => loginAs(context, username);

test('A3c : captures de la chaîne managériale, de l\'escalade, des délégations et de la qualification', async ({ page, context }) => {
  test.setTimeout(600_000);
  const watcher = watch(page);
  let locale: 'fr' | 'en' = 'fr';

  const both = async (name: string) => {
    for (const w of [DESKTOP, MOBILE]) {
      await page.setViewportSize({ width: w.width, height: w.height });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
  };
  const open = async (code: string) => {
    await page.goto(`/${locale}/proposals?filter=all`);
    await page.getByRole('link', { name: code, exact: true }).first().click();
    await expect(page.getByTestId('dimensions')).toBeVisible();
  };
  const panel = () => page.getByTestId('validation-panel');
  const zoneOption = async (id: string, code: string) => {
    const select = page.locator(`#${id}`);
    const index = (await select.locator('option').allTextContents()).findIndex((t) => t.includes(code));
    await select.selectOption({ index });
  };
  const decide = async (outcome: string, motive?: string) => {
    await panel().locator('#validation-outcome').selectOption(outcome);
    if (motive !== undefined) await panel().locator('#validation-motive').fill(motive);
    await panel().locator('button[type="submit"]').click();
    await expect(page.getByRole('status')).toBeVisible();
  };
  const delegateForm = async () => {
    await zoneOption('delegation-delegator', 'CVR-ZV01');
    await zoneOption('delegation-substitute', 'CVR-WY02');
    await pickRange(page, 'delegation-period', '2026-10-23', '2026-10-30');
  };

  // ---- Phase 1 : états de départ, lecture seule ----
  for (const l of ['fr', 'en'] as const) {
    locale = l;
    await as(context, 'DemoCVR01');
    await page.goto(`/${locale}/proposals?filter=validation`);
    await expect(page.getByTestId('batch-validation')).toBeVisible();
    await both('list_cvr_validation');
    await open('BES-DEMO-032');
    await both('thread_cvr_to_validate');
    await panel().locator('#validation-outcome').selectOption('refuse');
    await panel().locator('#validation-motive').fill(l === 'fr' ? 'Heures supérieures au besoin du secteur.' : 'Hours above the sector need.');
    await both('thread_cvr_refuse_filled');
    await panel().locator('#validation-outcome').selectOption('escalate');
    await panel().locator('#validation-reason').selectOption('arbitration');
    await panel().locator('#validation-other').selectOption({ index: 1 });
    await panel().locator('#validation-motive').fill(l === 'fr' ? 'Deux CVR revendiquent ce poste.' : 'Two CVRs claim this position.');
    await both('thread_cvr_escalate_filled');
    await panel().locator('#validation-reason').selectOption('out_of_envelope');
    await both('thread_cvr_envelope_note');

    await as(context, 'DemoAgence01');
    await open('BES-DEMO-032');
    await both('thread_agency_waiting_validation');
    await page.goto(`/${locale}/settings/delegations`);
    await both('delegations_admin');
    await delegateForm();
    await both('delegation_form_filled');
    await page.goto(`/${locale}/proposals/funnel`);
    await both('funnel_agency');
    await page.goto(`/${locale}/alerts`);
    await both('alerts_agency');

    await as(context, 'DemoDR01');
    await open('BES-DEMO-035');
    await both('thread_dr_arbitrate');
    await setProfile(context, 'rs');
    await open('BES-DEMO-036');
    await both('thread_rs_refused');
  }

  // ---- Phase 2 : parcours complets en français ----
  locale = 'fr';
  // 1. Le CVR valide, l'agence qualifie.
  await as(context, 'DemoCVR01');
  await open('BES-DEMO-032');
  await decide('validate');
  await both('thread_cvr_validated');
  await as(context, 'DemoAgence01');
  await open('BES-DEMO-032');
  await both('thread_agency_qualify_form');
  await page.getByTestId('qualify-form').locator('button[type="submit"]').click();
  await expect(page.getByTestId('dimensions')).toContainText('Pris en charge');
  await both('thread_agency_qualified');
  // 2. Le CVR refuse avec motif, le RS soumet de nouveau, le CVR valide.
  await as(context, 'DemoCVR01');
  await open('BES-DEMO-031');
  await decide('refuse', 'Heures supérieures au besoin du secteur.');
  await both('thread_cvr_refused');
  await setProfile(context, 'rs');
  await open('BES-DEMO-031');
  await both('thread_rs_resubmit');
  await panel().locator('button[type="button"]').click();
  await expect(page.getByTestId('dimensions')).toContainText('Tour 2');
  await both('thread_rs_resubmitted');
  await as(context, 'DemoCVR01');
  await open('BES-DEMO-031');
  await decide('validate');
  await both('thread_second_round_validated');
  // 3. Escalade hors périmètre, le DR valide.
  await open('BES-DEMO-033');
  await panel().locator('#validation-outcome').selectOption('escalate');
  await panel().locator('#validation-reason').selectOption('out_of_perimeter');
  await panel().locator('#validation-motive').fill('Ce secteur relève d\'un autre périmètre.');
  await panel().locator('button[type="submit"]').click();
  await expect(page.getByTestId('dimensions')).toContainText('Escaladé au DR');
  await both('thread_cvr_escalated');
  await as(context, 'DemoDR01');
  await open('BES-DEMO-033');
  await decide('validate');
  await both('thread_dr_arbitrated');
  // 4. Arbitrage entre deux CVR, le DR refuse.
  await as(context, 'DemoCVR01');
  await open('BES-DEMO-034');
  await panel().locator('#validation-outcome').selectOption('escalate');
  await panel().locator('#validation-reason').selectOption('arbitration');
  await panel().locator('#validation-other').selectOption({ index: 1 });
  await panel().locator('#validation-motive').fill('Deux CVR revendiquent ce poste.');
  await panel().locator('button[type="submit"]').click();
  await expect(page.getByTestId('dimensions')).toContainText('Escaladé au DR');
  await both('thread_cvr_arbitration');
  await as(context, 'DemoDR01');
  await open('BES-DEMO-034');
  await decide('refuse', 'Le poste revient au secteur voisin.');
  await both('thread_dr_refused');
  // 5. Délégation : l'agence désigne, le suppléant valide en lot.
  await as(context, 'DemoAgence01');
  await page.goto('/fr/settings/delegations');
  await delegateForm();
  await page.getByTestId('delegation-form').locator('button[type="submit"]').click();
  await expect(page.locator('[data-delegation-status="active"]')).toHaveCount(1);
  await both('delegations_active');
  await as(context, 'DemoCVR02');
  await page.goto('/fr/proposals?filter=validation');
  await expect(page.getByTestId('delegation-banner')).toContainText('Vous agissez pour');
  await both('list_substitute');
  await open('BES-DEMO-030');
  await both('thread_substitute');
  await page.goto('/fr/proposals?filter=validation');
  await page.getByTestId('batch-validation').getByRole('button', { name: 'Tout cocher' }).click();
  await page.getByTestId('batch-validation').getByRole('button', { name: 'Valider la sélection' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await open('BES-DEMO-030');
  await both('thread_substitute_validated');
  // 6. Fin de la délégation.
  await as(context, 'DemoAgence01');
  await page.goto('/fr/settings/delegations');
  await page.locator('[data-delegation-status="active"]').getByRole('button', { name: 'Révoquer' }).click();
  await expect(page.locator('[data-delegation-status="active"]')).toHaveCount(0);
  await both('delegations_revoked');
  await as(context, 'DemoCVR02');
  await page.goto('/fr/proposals?filter=all');
  await both('list_substitute_after_end');

  // ---- Phase 3 : états d'arrivée en anglais, lecture seule ----
  locale = 'en';
  await as(context, 'DemoAgence01');
  for (const [code, name] of [['BES-DEMO-032', 'thread_final_qualified'], ['BES-DEMO-031', 'thread_final_two_rounds'], ['BES-DEMO-033', 'thread_final_arbitrated'], ['BES-DEMO-034', 'thread_final_refused_by_dr'], ['BES-DEMO-030', 'thread_final_substitute']] as const) {
    await open(code);
    await both(name);
  }
  await page.goto('/en/settings/delegations');
  await both('delegations_final');
  await as(context, 'DemoCVR01');
  await page.goto('/en/proposals?filter=all');
  await both('list_cvr_final');

  expect(watcher.consoleErrors).toEqual([]);
  expect(watcher.external).toEqual([]);
});
