import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { LOCALES, pickRange, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A3c');
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

test.describe.configure({ mode: 'serial' });

const openNeed = async (page: Page, locale: string, code: string) => {
  await page.goto(`/${locale}/proposals?filter=all`);
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
  await page.waitForLoadState('networkidle');
};

// Chaque capture part d'un état du jeu de démonstration, identique à chaque lancement du serveur : besoin à valider (030),
// refusé avec motif (032), escaladé pour arbitrage entre CVR (033), validé par le DR et à qualifier (034). L'écriture elle-même
// (valider, refuser, escalader, créer une délégation) est couverte par le parcours e2e du projet « circuit ».
for (const locale of LOCALES) {
  for (const w of WIDTHS) {
    test(`A3c ${locale} ${w.name} : validation CVR, escalade DR, qualification, délégations`, async ({ page, context }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: w.width, height: w.height });
      const watcher = watch(page);
      const notFound: string[] = [];
      page.on('response', (r) => { if (r.status() === 404) notFound.push(r.url()); });
      page.on('console', (m) => { if (m.type() === 'error') notFound.push(`console:${m.location().url}`); });
      // Captures reproductibles : mouvement réduit (aucune transition en cours), défilement en haut, curseur masqué.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const shot = async (name: string) => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}.png`), fullPage: true, animations: 'disabled', caret: 'hide' });
      };
      const L = locale === 'fr'
        ? { create: 'Créer la délégation', stop: 'Arrêter', active: 'En cours' }
        : { create: 'Create the delegation', stop: 'Stop', active: 'In progress' };

      await setProfile(context, 'cvr_client');
      await page.goto(`/${locale}/proposals?filter=validation`);
      await page.waitForLoadState('networkidle');
      await shot('list_cvr_to_validate');
      await openNeed(page, locale, 'BES-DEMO-030');
      await shot('cvr_validates');
      await openNeed(page, locale, 'BES-DEMO-032');
      await shot('cvr_refused_with_motive');

      await setProfile(context, 'dr_client');
      await openNeed(page, locale, 'BES-DEMO-033');
      await shot('dr_escalation_arbitration');

      await setProfile(context, 'agency_operator');
      await openNeed(page, locale, 'BES-DEMO-034');
      await shot('agency_qualification');

      // Délégation : création au calendrier, suppléant en action sur la zone de l'absent, arrêt.
      await setProfile(context, 'agency_admin');
      await page.goto(`/${locale}/settings/delegations`);
      await page.waitForLoadState('networkidle');
      await shot('delegations_admin');
      const absent = await page.locator('#delegation-absent option', { hasText: 'CVR-WY02' }).getAttribute('value');
      await page.selectOption('#delegation-absent', absent as string);
      const sub = await page.locator('#delegation-substitute option', { hasText: 'CVR-ZV01' }).getAttribute('value');
      await page.selectOption('#delegation-substitute', sub as string);
      await pickRange(page, 'delegation-period', '2026-10-23', '2026-10-30');
      await page.getByTestId('delegation-form').getByRole('button', { name: L.create }).click();
      await expect(page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: L.active })).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      await shot('delegation_created');

      await setProfile(context, 'cvr_client');
      await openNeed(page, locale, 'BES-DEMO-035');
      await expect(page.getByTestId('acting-for')).toBeVisible();
      await shot('delegation_acting');

      await setProfile(context, 'agency_admin');
      await page.goto(`/${locale}/settings/delegations`);
      await page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: L.active }).getByRole('button', { name: L.stop }).click();
      await expect(page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: L.active })).toHaveCount(0);
      expect(notFound).toEqual([]);
      expect(watcher.consoleErrors).toEqual([]);
      expect(watcher.external).toEqual([]);
    });
  }
}

test('A3c mode sombre : liste du CVR et fil d\'un besoin escaladé', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await setProfile(context, 'cvr_client');
  await page.goto('/fr/proposals?filter=validation');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT, 'list_cvr_to_validate_dark_fr_1440.png'), fullPage: true, animations: 'disabled', caret: 'hide' });
  await setProfile(context, 'dr_client');
  await openNeed(page, 'fr', 'BES-DEMO-033');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT, 'dr_escalation_arbitration_dark_fr_1440.png'), fullPage: true, animations: 'disabled', caret: 'hide' });
});
