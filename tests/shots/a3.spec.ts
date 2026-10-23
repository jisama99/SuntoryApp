import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { LOCALES, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A3');
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

test.describe.configure({ mode: 'serial' });

// Captures reproductibles : mouvement réduit (aucune transition en cours), défilement en haut, curseur masqué. L'heure de l'acceptation
// vient de l'horloge de démonstration (10:30), jamais de l'horloge du poste : deux régénérations donnent des images identiques.
const snap = async (page: Page, file: string) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide' });
};

const openNeed = async (page: Page, locale: string, code: string) => {
  await page.goto(`/${locale}/proposals?filter=all`);
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
  await page.waitForLoadState('networkidle');
};

for (const locale of LOCALES) {
  for (const w of WIDTHS) {
    const shot = (page: Page, name: string) => snap(page, path.join(OUT, `${name}_${locale}_${w.name}.png`));

    test(`A3 ${locale} ${w.name} : listes, fils, entonnoir, alertes`, async ({ page, context }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: w.width, height: w.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const watcher = watch(page);
      for (const profile of ['agency_operator', 'cvr_client', 'rs']) {
        await setProfile(context, profile);
        await page.goto(`/${locale}/proposals`);
        await page.waitForLoadState('networkidle');
        await shot(page, `list_${profile}`);
      }
      await setProfile(context, 'cvr_client');
      await openNeed(page, locale, 'BES-DEMO-005');
      await shot(page, 'thread_decision_pending_cvr');
      await setProfile(context, 'agency_operator');
      await openNeed(page, locale, 'BES-DEMO-018');
      await shot(page, 'thread_replacement_agency');
      await openNeed(page, locale, 'BES-DEMO-009');
      await shot(page, 'thread_refusal_agency');
      await setProfile(context, 'direction_client');
      await page.goto(`/${locale}/proposals/funnel`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'funnel_direction');
      await setProfile(context, 'agency_operator');
      await page.goto(`/${locale}/alerts`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'alerts_agency');
      expect(watcher.consoleErrors).toEqual([]);
      expect(watcher.external).toEqual([]);
    });
  }
}

// Parcours besoin, proposition, décision, refus puis nouvelle proposition : un besoin distinct par combinaison.
const FLOW: Array<{ locale: 'fr' | 'en'; w: (typeof WIDTHS)[number]; code: string; qualify: boolean }> = [
  { locale: 'fr', w: WIDTHS[0]!, code: 'BES-DEMO-013', qualify: true },
  { locale: 'en', w: WIDTHS[1]!, code: 'BES-DEMO-010', qualify: false },
];
for (const f of FLOW) {
  test(`A3 ${f.locale} ${f.w.name} : besoin, proposition, décision, refus, nouvelle proposition`, async ({ page, context }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: f.w.width, height: f.w.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const shot = (name: string) => snap(page, path.join(OUT, `flow_${name}_${f.locale}_${f.w.name}.png`));
    const L = f.locale === 'fr'
      ? { qualify: 'Enregistrer', send: 'Envoyer à la cliente', decide: 'Enregistrer la décision', motive: 'Profil non adapté.' }
      : { qualify: 'Save', send: 'Send to the client', decide: 'Save the decision', motive: 'Profile not suitable.' };
    await setProfile(context, 'agency_operator');
    await openNeed(page, f.locale, f.code);
    if (f.qualify) {
      await shot('1_to_qualify');
      await page.getByRole('button', { name: L.qualify, exact: true }).click();
      await expect(page.getByTestId('proposal-form')).toBeVisible();
    }
    await page.fill('#proposal-worker', 'INT-801');
    await page.getByRole('button', { name: L.send }).click();
    await expect(page.getByTestId('proposal-result')).toBeVisible();
    await page.waitForTimeout(400);
    await shot('2_proposal_sent');
    await setProfile(context, 'dr_client');
    await openNeed(page, f.locale, f.code);
    await page.selectOption('select[id^="decide-outcome"]', 'refused');
    await page.fill('textarea[id^="decide-motive"]', L.motive);
    await page.getByRole('button', { name: L.decide }).click();
    await expect(page.locator('[data-decision-status="valid"]')).toBeVisible();
    await page.waitForTimeout(400);
    await shot('3_refused');
    await setProfile(context, 'agency_operator');
    await openNeed(page, f.locale, f.code);
    await page.fill('#proposal-worker', 'INT-802');
    await page.getByRole('button', { name: L.send }).click();
    await expect(page.getByTestId('proposal-result')).toBeVisible();
    await page.waitForTimeout(400);
    await page.reload();
    await shot('4_new_proposal_invalidates_refusal');
  });
}

test('A3 mode sombre : liste et fil', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await setProfile(context, 'cvr_client');
  await page.goto('/fr/proposals');
  await page.waitForLoadState('networkidle');
  await snap(page, path.join(OUT, 'list_cvr_dark_fr_1440.png'));
});
