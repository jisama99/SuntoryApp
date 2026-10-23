import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { LOCALES, pickDay, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A2b');
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];
// Une date de départ par combinaison langue x largeur : aucune collision (les besoins créés restent en mémoire).
const STARTS = ['2027-07-05', '2027-08-02', '2027-09-06', '2027-10-04'] as const;
const plusDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const ROW = (start: string, end: string) => ['Permanent', 'CMP-DEMO-01', 'Poste 4', '2', '14', start, end, '', '', 'LUN;MAR', '08:00-12:00', '', ''].join('\t');
const nextMonthBtn = (page: Page) => page.getByRole('button', { name: /Mois suivant|Next month/ });

test.describe.configure({ mode: 'serial' });

// Phase 1 : avant toute modification de réglage. Les écrans sont photographiés dans les deux langues et les deux largeurs.
let combo = 0;
for (const locale of LOCALES) {
  for (const w of WIDTHS) {
    const start = STARTS[combo++]!;
    const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}.png`), fullPage: true });

    test(`A2b ${locale} ${w.name} : liste, bannière, lot, blocage après échéance, calendrier, paramètres, alertes`, async ({ page, context }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: w.width, height: w.height });
      const watcher = watch(page);

      for (const profile of ['rs', 'agency_operator', 'direction_client']) {
        await setProfile(context, profile);
        await page.goto(`/${locale}/needs`);
        await page.waitForLoadState('networkidle');
        await shot(page, `list_${profile}`);
      }

      // Calendrier de saisie : novembre clos, jours désactivés avec la date limite dépassée.
      await setProfile(context, 'rs');
      await page.goto(`/${locale}/needs/new`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'form_banner_rs');
      await page.locator('#f-range-0').click();
      await nextMonthBtn(page).click();
      await page.locator('[data-date="2026-11-09"]').focus();
      await expect(page.getByTestId('calendar-reason')).toContainText(/19\/10\/2026/);
      await shot(page, 'calendar_locked_november_rs');
      await page.keyboard.press('Escape');

      // Lot : vide, collage, résumé, rejets expliqués (mois clos, valeur collée inconnue), ligne valide créée.
      await page.goto(`/${locale}/needs/batch`);
      await page.waitForLoadState('networkidle');
      // Brouillon repris des passages précédents (reprise après fermeture) : on repart d'un lot vide.
      await page.getByRole('button', { name: /Vider le lot|Clear the batch/ }).click();
      await expect(page.getByTestId('batch-row')).toHaveCount(3);
      await shot(page, 'batch_empty_rs');
      const lines = [ROW(start, plusDays(start, 6)), ROW('2026-11-09', '2026-11-15'), ROW(plusDays(start, 14), plusDays(start, 20)).replace('LUN;MAR', 'LUN;XYZ')].join('\n');
      await page.fill('#batch-paste', lines);
      await page.getByRole('button', { name: /Convertir en lignes|Convert to lines/ }).click();
      await expect(page.getByTestId('paste-info')).toBeVisible();
      await shot(page, 'batch_pasted_rs');
      await page.getByRole('button', { name: /Voir le résumé|See the summary/ }).click();
      await expect(page.getByTestId('summary-incomplete')).toHaveCount(0);
      await shot(page, 'batch_summary_rs');
      await page.getByRole('button', { name: /Soumettre|Submit/ }).first().click();
      await expect(page.getByTestId('batch-result')).toBeVisible();
      await expect(page.locator('[data-rule=E1]').first()).toBeVisible();
      await shot(page, 'batch_result_blocked_rs');

      // Agence : lot vide, calendrier des échéances, paramètres.
      await setProfile(context, 'agency_admin');
      await page.goto(`/${locale}/needs/batch`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'batch_empty_agency');
      await page.goto(`/${locale}/settings/deadlines`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'deadlines_admin');
      await page.goto(`/${locale}/settings/dispositifs`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'params_compare_admin');
      await page.goto(`/${locale}/settings/dispositifs?dispositif=second_placement`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'params_second_placement_admin');

      // Alertes : J-5 côté cliente (au 23/10/2026), file de réouvertures côté agence.
      for (const profile of ['rs', 'direction_client', 'agency_admin']) {
        await setProfile(context, profile);
        await page.goto(`/${locale}/alerts`);
        await page.waitForLoadState('networkidle');
        await shot(page, `alerts_j5_${profile}`);
      }
      expect(watcher.external).toEqual([]);
      expect(watcher.consoleErrors).toEqual([]);
    });
  }
}

// Phase 2 : réglages modifiés une seule fois (réouverture, paramètre, date fixe), puis captures dans les deux langues.
test('A2b phase 2 : réouverture demandée puis accordée, paramètre modifié, date fixe et alerte J-2', async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const watcher = watch(page);
  const shot = (name: string, locale = 'fr', w = '1440') => page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w}.png`), fullPage: true });

  // Le CVR dépose une demande pour une semaine clôturée (celle de novembre est déjà en attente).
  await setProfile(context, 'cvr_client');
  await page.goto('/fr/needs');
  await shot('reopen_request_cvr_before');
  await page.selectOption('#reopen-target', 'week:2026-S42');
  await page.fill('#reopen-motive', 'Correction d\'une saisie de la semaine clôturée.');
  await page.locator('#reopen-until').click();
  await pickDay(page, page.getByRole('dialog'), '2026-10-30');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await expect(page.getByTestId('reopen-result')).toContainText('transmise');
  await shot('reopen_request_cvr');

  // L'agence administration décide : file de demandes, puis trace.
  await setProfile(context, 'agency_admin');
  await page.goto('/fr/settings/deadlines');
  await page.waitForLoadState('networkidle');
  await shot('reopen_decision_admin');
  const card = page.getByTestId('reopen-request-card').first();
  await card.locator('textarea').fill('Besoin tardif accepté pour ce CVR.');
  await card.getByRole('button', { name: 'Rouvrir', exact: true }).click();
  await expect(page.getByTestId('reopen-trace')).toContainText('Besoin tardif accepté');
  await shot('reopen_trace_admin');

  // Paramètre modifié : historique tracé.
  await page.goto('/fr/settings/dispositifs?dispositif=second_placement');
  const row = page.locator('tr[data-param=min_minutes]');
  await row.getByRole('button', { name: /Modifier/ }).click();
  await page.fill('#param-second_placement-min_minutes-n', '30');
  await shot('params_editor_open_admin');
  await row.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(row).toContainText('30 minutes');
  await page.goto('/fr/settings/dispositifs?history=second_placement');
  await shot('params_history_admin');

  // Date fixe du calendrier : jours non ouvrés désactivés, puis J-2.
  await page.goto('/fr/settings/deadlines');
  await page.selectOption('#entry-month', '2026-11');
  await page.selectOption('#entry-type', 'change_request');
  await page.selectOption('#entry-mode', 'fixed');
  await page.locator('#entry-fixed').click();
  await page.locator('[data-date="2026-10-24"]').focus();
  await shot('calendar_nonworking_admin');
  await pickDay(page, page.getByRole('dialog'), '2026-10-27');
  await page.getByRole('button', { name: "Enregistrer l'échéance" }).click();
  await expect(page.getByTestId('entry-result')).toContainText('Enregistré');
  await page.reload();
  await shot('deadlines_after_edit_admin');

  // RS : bannière avec la réouverture, alerte J-2, dans les deux langues et les deux largeurs.
  await setProfile(context, 'rs');
  for (const locale of LOCALES) {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w.width, height: w.height });
      await page.goto(`/${locale}/alerts`);
      await page.waitForLoadState('networkidle');
      await shot('alerts_j2_rs', locale, w.name);
      await page.goto(`/${locale}/needs/new`);
      await page.waitForLoadState('networkidle');
      await shot('form_banner_reopened_rs', locale, w.name);
    }
  }

  // Mode sombre sur les écrans principaux.
  await page.setViewportSize({ width: 1440, height: 900 });
  await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
  for (const locale of LOCALES) {
    await page.goto(`/${locale}/needs`);
    await shot('list_dark_rs', locale);
    await page.goto(`/${locale}/needs/batch`);
    await shot('batch_dark_rs', locale);
    await setProfile(context, 'agency_admin');
    await page.goto(`/${locale}/settings/dispositifs?dispositif=second_placement`);
    await shot('params_dark_admin', locale);
    await page.goto(`/${locale}/settings/deadlines`);
    await shot('deadlines_dark_admin', locale);
    await setProfile(context, 'rs');
  }
  expect(watcher.external).toEqual([]);
  expect(watcher.consoleErrors).toEqual([]);
});
